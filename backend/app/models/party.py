"""Party and PartyAlias models for confirmed reviewer identity grouping."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Party(Base):
    """Represents a reviewer-confirmed party/identity within a verification case."""
    __tablename__ = "parties"

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
        String(128),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship("VerificationCase", back_populates="parties")
    aliases: Mapped[List["PartyAlias"]] = relationship(
        "PartyAlias",
        back_populates="party",
        cascade="all, delete-orphan",
    )

class PartyAlias(Base):
    """Free-text name variant found on records, linked to a confirmed party."""
    __tablename__ = "party_aliases"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    party_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("parties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alias_text: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    confirmed_by_reviewer: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    party: Mapped["Party"] = relationship("Party", back_populates="aliases")
