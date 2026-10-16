"""Plot crosswalk model for cross-survey series correspondence."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import SurveySeries

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class PlotCrosswalk(Base):
    """Maps plot/dag references across different survey generations (e.g., RS dag 140 to BS dag 285)."""
    __tablename__ = "plot_crosswalk"

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
    series_a: Mapped[SurveySeries] = mapped_column(
        Enum(SurveySeries),
        nullable=False,
    )
    dag_a: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    series_b: Mapped[SurveySeries] = mapped_column(
        Enum(SurveySeries),
        nullable=False,
    )
    dag_b: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    basis_note: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    confirmed_by_reviewer: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship("VerificationCase", back_populates="crosswalks")
