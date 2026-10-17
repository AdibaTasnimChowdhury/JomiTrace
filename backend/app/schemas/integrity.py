"""Pydantic schemas for input fingerprint comparisons."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class IntegrityCheckResponse(BaseModel):
    case_id: str
    case_code: str
    run_id: Optional[str] = None
    sealed_hash: Optional[str] = None
    current_hash: str
    is_sealed: bool
    is_valid: bool
    checked_components: List[str]
    explanation: str
    disclaimer: str
    checked_at: datetime
