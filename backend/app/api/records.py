"""Source records API router for land documents and entries."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import VerificationCase
from app.models.finding import FindingEvidence
from app.models.source_record import SourceRecord
from app.schemas.source_record import (
    SourceRecordCreate,
    SourceRecordResponse,
    SourceRecordUpdate,
)
from app.services.case_service import mark_case_runs_stale, record_audit_event

router = APIRouter()

@router.get("/cases/{case_id}/records", response_model=List[SourceRecordResponse])
def list_records_for_case(
    case_id: str,
    include_archived: bool = Query(False, description="Include archived/soft-deleted records"),
    db: Session = Depends(get_db),
) -> List[SourceRecord]:
    """Retrieves all source records associated with a verification case."""
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

    query = db.query(SourceRecord).filter(SourceRecord.case_id == case.id)
    if not include_archived:
        query = query.filter(SourceRecord.is_archived.is_(False))

    return query.order_by(SourceRecord.created_at.asc()).all()

@router.post(
    "/cases/{case_id}/records",
    response_model=SourceRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_record_to_case(
    case_id: str,
    payload: SourceRecordCreate,
    db: Session = Depends(get_db),
) -> SourceRecord:
    """Adds a new source record (deed, khatian, mutation, DCR) to a case and invalidates prior runs."""
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

    record_data = payload.model_dump()
    record = SourceRecord(
        case_id=case.id,
        **record_data,
    )
    db.add(record)

    # Any record addition marks previous analysis runs as stale
    mark_case_runs_stale(db, case.id)

    db.commit()
    db.refresh(record)


    return record

@router.patch("/records/{record_id}", response_model=SourceRecordResponse)
def update_record(
    record_id: str,
    payload: SourceRecordUpdate,
    db: Session = Depends(get_db),
) -> SourceRecord:
    """Updates metadata on an existing source record and marks analysis runs as stale."""
    record = db.query(SourceRecord).filter(SourceRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source record '{record_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    # Invalidate existing analysis runs for the parent case
    mark_case_runs_stale(db, record.case_id)

    db.commit()
    db.refresh(record)


    return record

@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: str,
    soft: bool = Query(False, description="Soft-archive the record instead of permanent deletion"),
    db: Session = Depends(get_db),
) -> None:
    """
    Deletes a source record. If the record is cited by any existing finding evidence,
    hard deletion is restricted to preserve audit integrity (HTTP 409) unless soft archiving is requested.
    """
    record = db.query(SourceRecord).filter(SourceRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source record '{record_id}' not found.",
        )

    # Check evidence citations
    citations_count = db.query(FindingEvidence).filter(FindingEvidence.source_record_id == record.id).count()

    if citations_count > 0:
        if soft:
            record.is_archived = True
            mark_case_runs_stale(db, record.case_id)
            db.commit()
            return
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete record '{record.source_reference}' because it is cited by {citations_count} "
                f"finding evidence reference(s). Archive the record instead by setting soft=true or is_archived."
            ),
        )

    case_id = record.case_id
    rec_ref = record.source_reference
    rec_id = record.id
    db.delete(record)
    mark_case_runs_stale(db, case_id)
    db.commit()
