"""Pydantic schemas for SourceRecord validation and serialization."""
from datetime import date, datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import RecordType, SurveySeries

class SourceRecordBase(BaseModel):
    record_type: RecordType
    source_reference: str = Field(..., min_length=1, max_length=128, description="Display label, e.g. Deed A-102")
    survey_series: Optional[SurveySeries] = None
    khatian_no: Optional[str] = Field(None, max_length=64)
    dag_no: Optional[str] = Field(None, max_length=64)
    holding_no: Optional[str] = Field(None, max_length=64)
    deed_no: Optional[str] = Field(None, max_length=64)
    mutation_case_no: Optional[str] = Field(None, max_length=64)
    dcr_no: Optional[str] = Field(None, max_length=64)
    record_date: Optional[date] = None
    registration_date: Optional[date] = None
    area_original: Optional[str] = Field(None, description="Original area string as written in document")
    area_value: Optional[float] = Field(None, ge=0.0, description="Extracted numeric area value")
    area_unit: Optional[str] = Field(None, max_length=64)
    seller_party_id: Optional[str] = None
    buyer_party_id: Optional[str] = None
    owner_party_id: Optional[str] = None
    document_sha256: Optional[str] = Field(None, max_length=64)
    fields_json: Optional[Dict[str, Any]] = None
    review_notes: Optional[str] = None

    @field_validator("source_reference")
    @classmethod
    def strip_ref(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("source_reference cannot be empty")
        return s

class SourceRecordCreate(SourceRecordBase):
    pass

class SourceRecordUpdate(BaseModel):
    record_type: Optional[RecordType] = None
    source_reference: Optional[str] = Field(None, max_length=128)
    survey_series: Optional[SurveySeries] = None
    khatian_no: Optional[str] = Field(None, max_length=64)
    dag_no: Optional[str] = Field(None, max_length=64)
    holding_no: Optional[str] = Field(None, max_length=64)
    deed_no: Optional[str] = Field(None, max_length=64)
    mutation_case_no: Optional[str] = Field(None, max_length=64)
    dcr_no: Optional[str] = Field(None, max_length=64)
    record_date: Optional[date] = None
    registration_date: Optional[date] = None
    area_original: Optional[str] = None
    area_value: Optional[float] = Field(None, ge=0.0)
    area_unit: Optional[str] = Field(None, max_length=64)
    seller_party_id: Optional[str] = None
    buyer_party_id: Optional[str] = None
    owner_party_id: Optional[str] = None
    document_sha256: Optional[str] = Field(None, max_length=64)
    fields_json: Optional[Dict[str, Any]] = None
    review_notes: Optional[str] = None
    is_archived: Optional[bool] = None

class SourceRecordResponse(SourceRecordBase):
    id: str
    case_id: str
    is_archived: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
