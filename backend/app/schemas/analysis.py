"""Pydantic schemas for Analysis execution, summary, and response."""
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.analysis_run import AnalysisRunResponse

class CaseSummaryResponse(BaseModel):
    banner_status: str
    banner_label: str
    counts: Dict[str, int]
    total_findings: int
    limitations: str
    issue_count: int = 0
    check_count: int = 0

class AnalysisRequest(BaseModel):
    case_id: Optional[str] = None
    config_override: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    run: AnalysisRunResponse
    summary: CaseSummaryResponse
