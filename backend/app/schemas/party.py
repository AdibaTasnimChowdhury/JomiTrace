"""Pydantic schemas for Party and PartyAlias validation and serialization."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

class PartyAliasBase(BaseModel):
    alias_text: str = Field(..., min_length=1, max_length=255)
    confirmed_by_reviewer: bool = Field(False)

    @field_validator("alias_text")
    @classmethod
    def strip_alias(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Alias text cannot be empty")
        return s

class PartyAliasCreate(PartyAliasBase):
    pass

class PartyAliasResponse(PartyAliasBase):
    id: str
    party_id: str
    confirmed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PartyBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=128, description="Canonical synthetic label, e.g. Party P1")

    @field_validator("label")
    @classmethod
    def strip_label(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Party label cannot be empty")
        return s

class PartyCreate(PartyBase):
    aliases: Optional[List[str]] = Field(default_factory=list, description="Initial raw name strings to link")

class PartyResponse(PartyBase):
    id: str
    case_id: str
    created_at: datetime
    aliases: List[PartyAliasResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
