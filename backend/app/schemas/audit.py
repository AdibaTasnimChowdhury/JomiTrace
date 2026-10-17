"""Pydantic schemas for Case Audit Trail."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class CaseAuditEventResponse(BaseModel):
    id: str
    case_id: str
    action: str
    actor: str
    details_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditTrailResponse(BaseModel):
    case_id: str
    case_code: str
    total_events: int
    events: List[CaseAuditEventResponse]
