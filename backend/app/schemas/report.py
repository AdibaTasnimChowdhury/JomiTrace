"""Pydantic schemas for Printable Investigation Report."""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.case import CaseResponse
from app.schemas.finding import FindingResponse
from app.schemas.checklist import ChecklistItemResponse
from app.schemas.timeline import TimelineNode
from app.schemas.comparison import ComparisonResponse

class ReportMetadata(BaseModel):
    generated_at: datetime
    rule_version: str
    run_id: str
    input_hash: str
    as_of_date: str
    reviewer: str
    config_snapshot: Dict[str, Any]
    is_stale: bool
    provenance: str = "synthetic"
    sample_data_notice: str = "Fictional sample data for demonstration • LandTech 2026 track P3 & P5"

class ReportResponse(BaseModel):
    metadata: ReportMetadata
    case: CaseResponse
    summary: Dict[str, Any]
    records_reviewed: List[Dict[str, Any]]
    parties_reviewed: List[Dict[str, Any]] = Field(default_factory=list)
    crosswalks_reviewed: List[Dict[str, Any]] = Field(default_factory=list)
    rules_run: List[Dict[str, Any]]
    findings: List[FindingResponse]
    timeline: List[TimelineNode]
    comparison: Optional[ComparisonResponse] = None
    checklist: List[ChecklistItemResponse]
    integrity: Optional[Dict[str, Any]] = None
    audit_summary: Optional[List[Dict[str, Any]]] = None
    disclaimer: str
