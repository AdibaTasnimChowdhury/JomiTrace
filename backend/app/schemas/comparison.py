"""Pydantic schemas for Record Comparison Grid."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ComparisonCell(BaseModel):
    record_id: str
    source_reference: str
    value: Optional[str] = None

class ComparisonRow(BaseModel):
    field_name: str
    field_label: str
    status: str = Field("match", description="match, mismatch, unverified, or not_applicable")
    has_conflict: bool = False
    details: Optional[str] = None
    cells: List[ComparisonCell] = Field(default_factory=list)

class ComparisonResponse(BaseModel):
    case_id: str
    case_code: str
    records: List[Dict[str, Any]] = Field(default_factory=list)
    rows: List[ComparisonRow] = Field(default_factory=list)
