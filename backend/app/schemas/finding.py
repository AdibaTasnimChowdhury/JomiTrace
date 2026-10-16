"""Pydantic schemas for Finding and FindingEvidence validation and serialization."""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import FindingCategory, FindingStatus

class FindingEvidenceBase(BaseModel):
    source_record_id: str
    field_name: str = Field(..., min_length=1, max_length=64)
    observed_value: Optional[str] = None
    reference_label: Optional[str] = None

class FindingEvidenceCreate(FindingEvidenceBase):
    pass

class FindingEvidenceResponse(FindingEvidenceBase):
    finding_id: str

    model_config = ConfigDict(from_attributes=True)

class FindingBase(BaseModel):
    rule_code: str = Field(..., min_length=2, max_length=32, description="Rule identifier, e.g. JT-R01")
    category: FindingCategory
    status: FindingStatus
    summary: str = Field(..., min_length=1)
    explanation: str = Field(..., min_length=1)
    compared_fields: List[str] = Field(default_factory=list)
    observed_values: Dict[str, Any] = Field(default_factory=dict)
    limitations: str = Field(..., min_length=1)
    recommended_next_step: str = Field(..., min_length=1)

class FindingCreate(FindingBase):
    evidence: Optional[List[FindingEvidenceCreate]] = Field(default_factory=list)

class FindingResponse(FindingBase):
    id: str
    run_id: str
    case_id: str
    created_at: datetime
    evidence: List[FindingEvidenceResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
