"""Verification case model."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy import String, Text, DateTime, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.db.base import Base
from app.models.enums import CaseStatus, Provenance

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class VerificationCase(Base):
    """Represents an evidence-first land-record verification case."""
    __tablename__ = "verification_cases"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    case_code: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    upazila: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    mouza: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    jl_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus),
        nullable=False,
        default=CaseStatus.DRAFT,
    )
    provenance: Mapped[Provenance] = mapped_column(
        Enum(Provenance),
        nullable=False,
        default=Provenance.USER_ENTERED,
    )
    config_json: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=lambda: dict(settings.DEFAULT_CASE_CONFIG),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    # Relationships
    records: Mapped[List["SourceRecord"]] = relationship(
        "SourceRecord",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    parties: Mapped[List["Party"]] = relationship(
        "Party",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    crosswalks: Mapped[List["PlotCrosswalk"]] = relationship(
        "PlotCrosswalk",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    events: Mapped[List["TransferEvent"]] = relationship(
        "TransferEvent",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    analysis_runs: Mapped[List["AnalysisRun"]] = relationship(
        "AnalysisRun",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    checklist_items: Mapped[List["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="case",
        cascade="all, delete-orphan",
    )
    audit_events: Mapped[List["CaseAuditEvent"]] = relationship(
        "CaseAuditEvent",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="desc(CaseAuditEvent.created_at)",
    )
