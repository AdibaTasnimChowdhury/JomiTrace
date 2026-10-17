"""Pydantic schemas for Fictional Demo Scenarios."""
from typing import List, Optional
from pydantic import BaseModel

class ScenarioInfo(BaseModel):
    id: str
    case_code: str
    title: str
    description: str
    expected_outcome: str
    district: Optional[str] = None
    upazila: Optional[str] = None
    mouza: Optional[str] = None

class ScenarioListResponse(BaseModel):
    scenarios: List[ScenarioInfo]
    provenance: str = "synthetic"
    notice: str = "Fictional sample data for demonstration • LandTech 2026 track P3 & P5"
