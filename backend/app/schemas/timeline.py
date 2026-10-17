"""Pydantic schemas for Chronological Ownership Timeline."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TimelineNode(BaseModel):
    event_id: Optional[str] = None
    date: Optional[str] = None
    date_display: str = Field("Date not supplied", description="Formatted date or 'Date not supplied'")
    transfer_type: str = "sale"
    from_party_label: Optional[str] = None
    from_party_id: Optional[str] = None
    to_party_label: Optional[str] = None
    to_party_id: Optional[str] = None
    area_display: Optional[str] = None
    plot_reference: Optional[str] = None
    holding_key: Optional[str] = None
    source_reference: Optional[str] = None
    source_record_id: Optional[str] = None
    interruption_marker: bool = False
    interruption_label: Optional[str] = None
    potential_overlap: bool = False
    associated_findings: List[Dict[str, Any]] = Field(default_factory=list)

class TimelineResponse(BaseModel):
    case_id: str
    case_code: str
    title: str
    nodes: List[TimelineNode] = Field(default_factory=list)
    unlinked_records: List[Dict[str, Any]] = Field(default_factory=list)
