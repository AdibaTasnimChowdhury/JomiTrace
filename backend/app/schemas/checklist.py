"""Pydantic schemas for ChecklistItem validation and serialization."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import ChecklistStatus

class ChecklistItemBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ChecklistStatus = ChecklistStatus.PENDING
    completion_note: Optional[str] = None

    @field_validator("label")
    @classmethod
    def strip_label(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Checklist item label cannot be empty")
        return s

class ChecklistItemCreate(ChecklistItemBase):
    pass

class ChecklistItemUpdate(BaseModel):
    status: Optional[ChecklistStatus] = None
    completion_note: Optional[str] = None

class ChecklistItemResponse(ChecklistItemBase):
    id: str
    case_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
