"""Analysis run model for versioned and auditable rule executions."""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any

from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AnalysisRun(Base):
    """Snapshot of a deterministic rule-engine execution on a case."""
    __tablename__ = "analysis_runs"

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
    rule_version: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="0.2",
    )
    config_snapshot_json: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
    )
    input_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    is_stale: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Relationships
    case: Mapped["VerificationCase"] = relationship("VerificationCase", back_populates="analysis_runs")
    findings: Mapped[List["Finding"]] = relationship(
        "Finding",
        back_populates="run",
        cascade="all, delete-orphan",
    )
