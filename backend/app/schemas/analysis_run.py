"""Pydantic schemas for AnalysisRun validation and serialization."""
from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.finding import FindingResponse

class AnalysisRunBase(BaseModel):
    rule_version: str = Field("0.2", min_length=1, max_length=32)
    config_snapshot_json: Dict[str, Any] = Field(default_factory=dict)
    input_hash: str = Field(..., min_length=1, max_length=64)

class AnalysisRunCreate(AnalysisRunBase):
    pass

class AnalysisRunResponse(AnalysisRunBase):
    id: str
    case_id: str
    started_at: datetime
    is_stale: bool
    findings: List[FindingResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
