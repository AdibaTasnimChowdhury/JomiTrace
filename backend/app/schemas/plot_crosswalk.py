"""Pydantic schemas for PlotCrosswalk validation and serialization."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import SurveySeries

class PlotCrosswalkBase(BaseModel):
    series_a: SurveySeries
    dag_a: str = Field(..., min_length=1, max_length=64)
    series_b: SurveySeries
    dag_b: str = Field(..., min_length=1, max_length=64)
    basis_note: Optional[str] = None
    confirmed_by_reviewer: bool = Field(False)

    @field_validator("dag_a", "dag_b")
    @classmethod
    def strip_dag(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Plot dag reference cannot be empty")
        return s

class PlotCrosswalkCreate(PlotCrosswalkBase):
    pass

class PlotCrosswalkResponse(PlotCrosswalkBase):
    id: str
    case_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
