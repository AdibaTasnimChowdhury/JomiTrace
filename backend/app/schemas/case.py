"""Pydantic schemas for VerificationCase validation and serialization."""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import CaseStatus, Provenance

class CaseBase(BaseModel):
    case_code: str = Field(..., min_length=2, max_length=64, description="Unique case code, e.g. JT-1001")
    title: str = Field(..., min_length=1, max_length=255, description="Case title or description")
    district: Optional[str] = Field(None, max_length=128)
    upazila: Optional[str] = Field(None, max_length=128)
    mouza: Optional[str] = Field(None, max_length=128)
    jl_number: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = None
    provenance: Provenance = Field(Provenance.USER_ENTERED, description="Data provenance (user_entered, synthetic, organizer, public)")
    config_json: Optional[Dict[str, Any]] = Field(None, description="Tolerance and rule configuration")

    @field_validator("case_code", "title")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field must not be empty or whitespace only")
        return stripped

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    district: Optional[str] = Field(None, max_length=128)
    upazila: Optional[str] = Field(None, max_length=128)
    mouza: Optional[str] = Field(None, max_length=128)
    jl_number: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = None
    status: Optional[CaseStatus] = None
    config_json: Optional[Dict[str, Any]] = None

class CaseResponse(CaseBase):
    id: str
    status: CaseStatus
    config_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
