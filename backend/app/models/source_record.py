"""Source record model."""
import uuid
from datetime import date, datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy import String, Text, Float, Date, DateTime, Boolean, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import RecordType, SurveySeries

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class SourceRecord(Base):
    """Represents a structured land record entered into an investigation case."""
    __tablename__ = "source_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("verification_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_type: Mapped[RecordType] = mapped_column(
        Enum(RecordType),
        nullable=False,
    )
    source_reference: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    survey_series: Mapped[Optional[SurveySeries]] = mapped_column(
        Enum(SurveySeries),
        nullable=True,
    )

    khatian_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    dag_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    holding_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    deed_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    mutation_case_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    dcr_no: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    record_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    registration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Area fields: preserve original text as written alongside normalized numeric value
    area_original: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    area_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    area_unit: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Reviewer-confirmed party links
    seller_party_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
    )
    buyer_party_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
    )
    owner_party_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
    )

    document_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    fields_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Integrity safeguard: records cited in findings are soft-archived rather than deleted
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship("VerificationCase", back_populates="records")
    seller_party: Mapped[Optional["Party"]] = relationship("Party", foreign_keys=[seller_party_id])
    buyer_party: Mapped[Optional["Party"]] = relationship("Party", foreign_keys=[buyer_party_id])
    owner_party: Mapped[Optional["Party"]] = relationship("Party", foreign_keys=[owner_party_id])

    evidence_citations: Mapped[List["FindingEvidence"]] = relationship(
        "FindingEvidence",
        back_populates="source_record",
        passive_deletes=True,
    )
