"""Checklist API router for external manual verification items."""
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import VerificationCase
from app.models.checklist import ChecklistItem
from app.schemas.checklist import ChecklistItemResponse, ChecklistItemUpdate
from app.services.case_service import record_audit_event, seed_default_checklist

router = APIRouter()

@router.get("/cases/{case_id}/checklist", response_model=List[ChecklistItemResponse])
def get_case_checklist(case_id: str, db: Session = Depends(get_db)) -> List[ChecklistItem]:
    """Retrieves all external verification checklist items for a case."""
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

    # Seed if not already seeded
    items = seed_default_checklist(db, case.id)
    return items

@router.patch("/checklist/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    item_id: str,
    payload: ChecklistItemUpdate,
    db: Session = Depends(get_db),
) -> ChecklistItem:
    """Updates the reviewer status or completion note of a manual verification checklist item."""
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item '{item_id}' not found.",
        )

    if payload.status is not None:
        item.status = payload.status
    if payload.completion_note is not None:
        item.completion_note = payload.completion_note
    item.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(item)


    return item
