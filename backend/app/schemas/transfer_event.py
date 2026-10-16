"""Pydantic schemas for TransferEvent validation and serialization."""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import TransferType

class TransferEventBase(BaseModel):
    source_record_id: Optional[str] = None
    event_date: Optional[date] = None
    transfer_type: TransferType = TransferType.SALE
    from_party_id: Optional[str] = None
    to_party_id: Optional[str] = None
    area_conveyed_value: Optional[float] = Field(None, ge=0.0)
    area_unit: Optional[str] = Field(None, max_length=64)
    holding_key: Optional[str] = Field(None, max_length=128)
    sequence_index: int = Field(0, ge=0)
    derived: bool = Field(True, description="True if auto-derived from deed/mutation; False if manually entered")
    notes: Optional[str] = None

class TransferEventCreate(TransferEventBase):
    pass

class TransferEventResponse(TransferEventBase):
    id: str
    case_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
