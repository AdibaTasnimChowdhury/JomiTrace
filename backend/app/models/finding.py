"""Finding and FindingEvidence models for deterministic verification results."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FindingCategory, FindingStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Finding(Base):
    """Represents a discrepancy screening result produced by the deterministic rule engine."""
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("verification_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_code: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )
    category: Mapped[FindingCategory] = mapped_column(
        Enum(FindingCategory),
        nullable=False,
    )
    status: Mapped[FindingStatus] = mapped_column(
        Enum(FindingStatus),
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    compared_fields: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    observed_values: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    limitations: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    recommended_next_step: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    run: Mapped["AnalysisRun"] = relationship("AnalysisRun", back_populates="findings")
    case: Mapped["VerificationCase"] = relationship("VerificationCase")
    evidence: Mapped[List["FindingEvidence"]] = relationship(
        "FindingEvidence",
        back_populates="finding",
        cascade="all, delete-orphan",
    )

class FindingEvidence(Base):
    """Links a specific finding to a source record and exact compared field."""
    __tablename__ = "finding_evidence"

    finding_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("findings.id", ondelete="CASCADE"),
        primary_key=True,
    )
    source_record_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("source_records.id", ondelete="RESTRICT"),
        primary_key=True,
        index=True,
    )
    field_name: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    observed_value: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    reference_label: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
    )

    # Relationships
    finding: Mapped["Finding"] = relationship("Finding", back_populates="evidence")
    source_record: Mapped["SourceRecord"] = relationship(
        "SourceRecord",
        back_populates="evidence_citations",
    )
