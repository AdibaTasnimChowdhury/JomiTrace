"""Plot Crosswalk API router for cross-survey series mapping."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import VerificationCase
from app.models.plot_crosswalk import PlotCrosswalk
from app.schemas.plot_crosswalk import (
    PlotCrosswalkCreate,
    PlotCrosswalkResponse,
    PlotCrosswalkUpdate,
)
from app.services.case_service import mark_case_runs_stale, record_audit_event

router = APIRouter()

@router.get("/cases/{case_id}/crosswalk", response_model=List[PlotCrosswalkResponse])
def list_crosswalk_for_case(case_id: str, db: Session = Depends(get_db)) -> List[PlotCrosswalk]:
    """Retrieves all cross-series plot mapping entries for a case."""
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
    return db.query(PlotCrosswalk).filter(PlotCrosswalk.case_id == case.id).all()

@router.post(
    "/cases/{case_id}/crosswalk",
    response_model=PlotCrosswalkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_crosswalk_entry(
    case_id: str,
    payload: PlotCrosswalkCreate,
    db: Session = Depends(get_db),
) -> PlotCrosswalk:
    """Adds a cross-survey series plot mapping entry and marks active runs as stale."""
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

    crosswalk = PlotCrosswalk(
        case_id=case.id,
        series_a=payload.series_a,
        dag_a=payload.dag_a,
        series_b=payload.series_b,
        dag_b=payload.dag_b,
        basis_note=payload.basis_note,
        confirmed_by_reviewer=payload.confirmed_by_reviewer,
    )
    db.add(crosswalk)

    # Invalidate existing analysis runs for the parent case
    mark_case_runs_stale(db, case.id)

    db.commit()
    db.refresh(crosswalk)


    return crosswalk

@router.patch("/crosswalk/{crosswalk_id}", response_model=PlotCrosswalkResponse)
def update_crosswalk_entry(
    crosswalk_id: str,
    payload: PlotCrosswalkUpdate,
    db: Session = Depends(get_db),
) -> PlotCrosswalk:
    """Updates a cross-survey series plot mapping entry and marks active runs as stale."""
    crosswalk = db.query(PlotCrosswalk).filter(PlotCrosswalk.id == crosswalk_id).first()
    if not crosswalk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plot crosswalk '{crosswalk_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crosswalk, field, value)

    mark_case_runs_stale(db, crosswalk.case_id)
    db.commit()
    db.refresh(crosswalk)


    return crosswalk

@router.delete("/crosswalk/{crosswalk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crosswalk_entry(
    crosswalk_id: str,
    db: Session = Depends(get_db),
) -> None:
    """Deletes a cross-survey series plot mapping entry and marks active runs as stale."""
    crosswalk = db.query(PlotCrosswalk).filter(PlotCrosswalk.id == crosswalk_id).first()
    if not crosswalk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plot crosswalk '{crosswalk_id}' not found.",
        )

    case_id = crosswalk.case_id
    cw_id = crosswalk.id
    db.delete(crosswalk)
    mark_case_runs_stale(db, case_id)
    db.commit()
