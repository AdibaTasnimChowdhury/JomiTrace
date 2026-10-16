"""Transfer event model for chronological timeline assembly."""
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import String, Text, Float, Integer, Boolean, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import TransferType

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TransferEvent(Base):
    """Represents a transfer or ownership node in the timeline chain of custody."""
    __tablename__ = "transfer_events"

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
    source_record_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("source_records.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    transfer_type: Mapped[TransferType] = mapped_column(
        Enum(TransferType),
        nullable=False,
        default=TransferType.SALE,
    )
    from_party_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
    )
    to_party_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
    )
    area_conveyed_value: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    area_unit: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )
    holding_key: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
    )
    sequence_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    derived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship("VerificationCase", back_populates="events")
    source_record: Mapped[Optional["SourceRecord"]] = relationship("SourceRecord")
    from_party: Mapped[Optional["Party"]] = relationship("Party", foreign_keys=[from_party_id])
    to_party: Mapped[Optional["Party"]] = relationship("Party", foreign_keys=[to_party_id])
