"""Cases API router for case creation, listing, retrieval, and updating."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.analysis_run import AnalysisRun
from app.models.case import VerificationCase
from app.models.enums import CaseStatus, FindingStatus, Provenance
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate
from app.rules.base import Finding as RuleFinding
from app.rules.engine import compute_case_summary
from app.services.case_service import mark_case_runs_stale, record_audit_event, seed_default_checklist

router = APIRouter()

def _apply_latest_analysis_status(db: Session, case: VerificationCase) -> CaseResponse:
    run = db.query(AnalysisRun).filter(AnalysisRun.case_id == case.id).order_by(AnalysisRun.started_at.desc()).first()
    if run is None:
        return CaseResponse.model_validate(case)
    summary_findings = [RuleFinding(
        rule_code=f.rule_code,
        category=f.category.value if hasattr(f.category, "value") else str(f.category),
        status=f.status.value if hasattr(f.status, "value") else str(f.status),
        summary=f.summary,
        explanation=f.explanation,
        source_record_ids=list({e.source_record_id for e in f.evidence}),
        limitations=f.limitations,
        recommended_next_step=f.recommended_next_step,
    ) for f in run.findings]
    canonical_status = compute_case_summary(summary_findings)["banner_status"]
    if canonical_status == "no_inconsistency_found":
        canonical_status = CaseStatus.REPORT_READY.value
    return CaseResponse.model_validate(case).model_copy(update={"status": CaseStatus(canonical_status)})

@router.post("/cases", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)) -> VerificationCase:
    """Creates a new verification case and seeds the standard investigation checklist."""
    # Check for duplicate case code
    existing = db.query(VerificationCase).filter(VerificationCase.case_code == payload.case_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Case with code '{payload.case_code}' already exists.",
        )

    case = VerificationCase(
        case_code=payload.case_code,
        title=payload.title,
        district=payload.district,
        upazila=payload.upazila,
        mouza=payload.mouza,
        jl_number=payload.jl_number,
        notes=payload.notes,
        provenance=payload.provenance,
        config_json=payload.config_json or {},
        status=CaseStatus.DRAFT,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Seed the standard verification checklist
    seed_default_checklist(db, case.id)

    return case

@router.get("/cases", response_model=List[CaseResponse])
def list_cases(
    status_filter: Optional[CaseStatus] = Query(None, alias="status", description="Filter by case status"),
    provenance_filter: Optional[Provenance] = Query(None, alias="provenance", description="Filter demo, user-entered, or reference cases"),
    search: Optional[str] = Query(None, description="Search by case code, title, district, or mouza"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> List[CaseResponse]:
    """Lists verification cases for the dense dashboard ledger with optional filtering and search."""
    query = db.query(VerificationCase)

    if provenance_filter:
        query = query.filter(VerificationCase.provenance == provenance_filter)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                VerificationCase.case_code.ilike(s),
                VerificationCase.title.ilike(s),
                VerificationCase.district.ilike(s),
                VerificationCase.mouza.ilike(s),
            )
        )

    query = query.order_by(VerificationCase.updated_at.desc())
    cases = [_apply_latest_analysis_status(db, case) for case in query.all()]
    if status_filter:
        cases = [case for case in cases if case.status == status_filter.value]
    return cases[offset : offset + limit]

@router.get("/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)) -> CaseResponse:
    """Retrieves a specific verification case by UUID or case code."""
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
    return _apply_latest_analysis_status(db, case)

@router.patch("/cases/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
) -> VerificationCase:
    """Updates case metadata, tolerance configuration, notes, or operational status."""
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

    update_data = payload.model_dump(exclude_unset=True)
    config_changed = False

    for field, value in update_data.items():
        if field == "config_json" and value is not None:
            # Merge config
            merged = dict(case.config_json or {})
            merged.update(value)
            case.config_json = merged
            config_changed = True
        else:
            setattr(case, field, value)

    # Any config edit marks existing analysis runs as stale
    if config_changed:
        mark_case_runs_stale(db, case.id)

    db.commit()
    db.refresh(case)

    return case

@router.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db)) -> None:
    """Deletes a verification case and cascade-deletes all associated records."""
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
    db.delete(case)
    db.commit()
