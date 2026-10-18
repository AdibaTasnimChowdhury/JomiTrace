"""Parties API router for confirmed party entities and aliases."""
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import VerificationCase
from app.models.party import Party, PartyAlias
from app.schemas.party import (
    PartyAliasCreate,
    PartyAliasResponse,
    PartyCreate,
    PartyResponse,
)
from app.services.case_service import mark_case_runs_stale, record_audit_event

router = APIRouter()

@router.get("/cases/{case_id}/parties", response_model=List[PartyResponse])
def list_parties_for_case(case_id: str, db: Session = Depends(get_db)) -> List[Party]:
    """Retrieves all confirmed parties and their raw name aliases for a case."""
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
    return db.query(Party).filter(Party.case_id == case.id).order_by(Party.created_at.asc()).all()

@router.post(
    "/cases/{case_id}/parties",
    response_model=PartyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_party_for_case(
    case_id: str,
    payload: PartyCreate,
    db: Session = Depends(get_db),
) -> Party:
    """Creates a canonical party identity and links optional initial aliases."""
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

    party = Party(case_id=case.id, label=payload.label)
    db.add(party)
    db.flush()

    if payload.aliases:
        for alias_str in payload.aliases:
            if alias_str.strip():
                alias = PartyAlias(
                    party_id=party.id,
                    alias_text=alias_str.strip(),
                    confirmed_by_reviewer=True,
                    confirmed_at=datetime.now(timezone.utc),
                )
                db.add(alias)

    mark_case_runs_stale(db, case.id)
    db.commit()
    db.refresh(party)


    return party

@router.post(
    "/parties/{party_id}/aliases",
    response_model=PartyAliasResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_party_alias(
    party_id: str,
    payload: PartyAliasCreate,
    db: Session = Depends(get_db),
) -> PartyAlias:
    """Adds a raw document spelling or alias to a confirmed party identity."""
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Party '{party_id}' not found.",
        )

    alias = PartyAlias(
        party_id=party.id,
        alias_text=payload.alias_text,
        confirmed_by_reviewer=payload.confirmed_by_reviewer,
        confirmed_at=datetime.now(timezone.utc) if payload.confirmed_by_reviewer else None,
    )
    db.add(alias)

    # Invalidate existing analysis runs for the parent case
    mark_case_runs_stale(db, party.case_id)

    db.commit()
    db.refresh(alias)


    return alias
