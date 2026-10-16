"""Verification checklist item model."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ChecklistStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ChecklistItem(Base):
    """External/human verification checklist item tracking pending manual checks."""
    __tablename__ = "checklist_items"

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
    label: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[ChecklistStatus] = mapped_column(
        Enum(ChecklistStatus),
        nullable=False,
        default=ChecklistStatus.PENDING,
    )
    completion_note: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship(
        "VerificationCase",
        back_populates="checklist_items",
    )
