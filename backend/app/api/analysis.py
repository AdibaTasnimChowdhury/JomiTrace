from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.analysis_run import AnalysisRun
from app.models.case import VerificationCase
from app.models.finding import Finding
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, CaseSummaryResponse
from app.schemas.analysis_run import AnalysisRunResponse
from app.schemas.audit import AuditTrailResponse
from app.schemas.comparison import ComparisonResponse
from app.schemas.finding import FindingResponse
from app.schemas.integrity import IntegrityCheckResponse
from app.schemas.report import ReportResponse
from app.schemas.timeline import TimelineResponse
from app.services.case_service import (
    build_comparison_for_case,
    build_report_payload,
    build_timeline_for_case,
    get_case_audit_trail,
    record_audit_event,
    run_analysis_for_case,
    verify_case_integrity,
)

router = APIRouter()

def _get_case_or_404(db: Session, case_id: str) -> VerificationCase:
    case = (
        db.query(VerificationCase)
        .filter(or_(VerificationCase.id == case_id, VerificationCase.case_code == case_id))
        .first()
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification case '{case_id}' not found.",
        )
    return case

@router.post("/cases/{case_id}/analyze", response_model=AnalysisResponse)
def analyze_case(
    case_id: str,
    payload: Optional[AnalysisRequest] = None,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Executes the deterministic rule engine against a case and creates an auditable analysis run."""
    case = _get_case_or_404(db, case_id)
    config_override = payload.config_override if payload else None
    run, summary = run_analysis_for_case(db, case, config_override=config_override)

    return AnalysisResponse(
        run=run,
        summary=CaseSummaryResponse(**summary),
    )

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_case_alt(
    payload: AnalysisRequest,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Convenience endpoint accepting case_id in the JSON body."""
    if not payload.case_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="case_id must be provided in request body.",
        )
    return analyze_case(payload.case_id, payload, db)

@router.get("/cases/{case_id}/runs", response_model=List[AnalysisRunResponse])
def get_case_runs(case_id: str, db: Session = Depends(get_db)) -> List[AnalysisRun]:
    """Retrieves all analysis runs for a case ordered chronologically (newest first)."""
    case = _get_case_or_404(db, case_id)
    return (
        db.query(AnalysisRun)
        .filter(AnalysisRun.case_id == case.id)
        .order_by(AnalysisRun.started_at.desc())
        .all()
    )

@router.get("/cases/{case_id}/findings", response_model=List[FindingResponse])
def get_case_findings(
    case_id: str,
    run_id: Optional[str] = Query(None, description="Specific analysis run ID; defaults to latest run"),
    db: Session = Depends(get_db),
) -> List[Finding]:
    """Retrieves structured discrepancy findings with evidence references for a case."""
    case = _get_case_or_404(db, case_id)

    if run_id:
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id, AnalysisRun.case_id == case.id).first()
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis run '{run_id}' not found for case '{case_id}'.",
            )
    else:
        # Get latest run
        run = (
            db.query(AnalysisRun)
            .filter(AnalysisRun.case_id == case.id)
            .order_by(AnalysisRun.started_at.desc())
            .first()
        )

    if not run:
        return []

    return db.query(Finding).filter(Finding.run_id == run.id).order_by(Finding.rule_code.asc()).all()

@router.get("/cases/{case_id}/timeline", response_model=TimelineResponse)
def get_case_timeline(case_id: str, db: Session = Depends(get_db)) -> TimelineResponse:
    """Retrieves chronological ownership transfer timeline with chain-gap interruption markers."""
    case = _get_case_or_404(db, case_id)
    latest_run = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.case_id == case.id)
        .order_by(AnalysisRun.started_at.desc())
        .first()
    )
    return build_timeline_for_case(case, latest_run)

@router.get("/cases/{case_id}/compare", response_model=ComparisonResponse)
@router.get("/cases/{case_id}/comparison", response_model=ComparisonResponse, include_in_schema=False)
def get_case_comparison(case_id: str, db: Session = Depends(get_db)) -> ComparisonResponse:
    """Retrieves horizontal pairwise record comparison grid highlighting inconsistencies."""
    case = _get_case_or_404(db, case_id)
    latest_run = db.query(AnalysisRun).filter(AnalysisRun.case_id == case.id).order_by(AnalysisRun.started_at.desc()).first()
    return build_comparison_for_case(case, latest_run)

@router.get("/cases/{case_id}/report", response_model=ReportResponse)
def get_case_report(
    case_id: str,
    run_id: Optional[str] = Query(None, description="Specific run ID; defaults to latest run"),
    allow_stale: bool = Query(False, description="Allow exporting a stale run after record modifications"),
    db: Session = Depends(get_db),
) -> ReportResponse:
    """
    Generates a screening report payload with case details, records, rules run,
    findings, evidence citations, timeline, checklist state, and limitations.
    Refuses to export a stale run without explicit allow_stale confirmation.
    """
    case = _get_case_or_404(db, case_id)

    if run_id:
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id, AnalysisRun.case_id == case.id).first()
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis run '{run_id}' not found for case '{case_id}'.",
            )
    else:
        run = (
            db.query(AnalysisRun)
            .filter(AnalysisRun.case_id == case.id)
            .order_by(AnalysisRun.started_at.desc())
            .first()
        )

    if not run:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No analysis runs exist for this case. Run checks before generating a report.",
        )

    if run.is_stale and not allow_stale:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Records have changed since the last analysis run. "
                "Please re-run checks before exporting the report, or set allow_stale=true to proceed."
            ),
        )

    # Compute summary counts
    from app.rules.base import Finding as RuleFinding
    findings_for_summary = [
        RuleFinding(
            rule_code=f.rule_code,
            category=f.category.value if hasattr(f.category, "value") else str(f.category),
            status=f.status.value if hasattr(f.status, "value") else str(f.status),
            summary=f.summary,
            explanation=f.explanation,
            source_record_ids=list({e.source_record_id for e in f.evidence}),
            limitations=f.limitations,
            recommended_next_step=f.recommended_next_step,
        )
        for f in run.findings
    ]
    from app.rules.engine import compute_case_summary
    summary = compute_case_summary(findings_for_summary)

    return build_report_payload(case, run, summary)

@router.post("/cases/{case_id}/report/exported", status_code=status.HTTP_204_NO_CONTENT)
def log_report_export(case_id: str, db: Session = Depends(get_db)) -> None:
    """Record a deliberate print/PDF export, never a passive report page view."""
    case = _get_case_or_404(db, case_id)
    run = db.query(AnalysisRun).filter(AnalysisRun.case_id == case.id).order_by(AnalysisRun.started_at.desc()).first()
    if run is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Run checks before exporting a report.")
    record_audit_event(
        db,
        case_id=case.id,
        action="report_exported",
        actor="local_unverified_session",
        details={"run_id": run.id, "rule_version": run.rule_version, "result": "Report exported", "input_fingerprint": run.input_hash},
    )

@router.get("/cases/{case_id}/audit", response_model=AuditTrailResponse)
def get_case_audit(case_id: str, db: Session = Depends(get_db)) -> AuditTrailResponse:
    """Retrieves chronological audit trail of all reviewer actions and lifecycle events for a case."""
    case = _get_case_or_404(db, case_id)
    return get_case_audit_trail(db, case.id, case.case_code)

@router.get("/cases/{case_id}/integrity", response_model=IntegrityCheckResponse)
def get_case_integrity(
    case_id: str,
    log_event: bool = Query(False, description="Deprecated; passive integrity reads do not create audit events"),
    db: Session = Depends(get_db),
) -> IntegrityCheckResponse:
    """
    Compares the live input fingerprint with the analyzed snapshot. Reads do not write audit events.
    """
    case = _get_case_or_404(db, case_id)
    integrity = verify_case_integrity(case)

    return integrity
