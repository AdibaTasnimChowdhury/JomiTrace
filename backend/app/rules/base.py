"""Base dataclasses, status definitions, and snapshot models for JomiTrace rule engine."""
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from enum import Enum

class RuleStatus(str, Enum):
    CONFLICT_DETECTED = "conflict_detected"
    REVIEW_REQUIRED = "review_required"
    INSUFFICIENT_INFORMATION = "insufficient_information"
    NO_INCONSISTENCY_FOUND = "no_inconsistency_found"
    NOT_APPLICABLE = "not_applicable"

class RuleCategory(str, Enum):
    PLOT_MISMATCH = "plot_mismatch"
    AREA_MISMATCH = "area_mismatch"
    CHAIN_GAP = "chain_gap"
    POSSIBLE_DUPLICATE_TRANSFER = "possible_duplicate_transfer"
    OVER_CONVEYANCE = "over_conveyance"
    DATE_CONFLICT = "date_conflict"
    REG_MUTATION_MISMATCH = "reg_mutation_mismatch"
    RAPID_TRANSFER = "rapid_transfer"
    MISSING_DATA = "missing_data"
    DOCUMENT_REUSE = "document_reuse"

@dataclass
class EvidenceRef:
    source_record_id: str
    field_name: str
    observed_value: Optional[str] = None
    reference_label: Optional[str] = None

@dataclass
class Finding:
    rule_code: str
    category: str
    status: str
    summary: str
    explanation: str
    source_record_ids: List[str] = field(default_factory=list)
    compared_fields: List[str] = field(default_factory=list)
    observed_values: Dict[str, Any] = field(default_factory=dict)
    limitations: str = ""
    recommended_next_step: str = ""
    evidence: List[EvidenceRef] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_code": self.rule_code,
            "category": self.category,
            "status": self.status,
            "summary": self.summary,
            "explanation": self.explanation,
            "source_record_ids": list(self.source_record_ids),
            "compared_fields": list(self.compared_fields),
            "observed_values": dict(self.observed_values),
            "limitations": self.limitations,
            "recommended_next_step": self.recommended_next_step,
            "evidence": [
                {
                    "source_record_id": e.source_record_id,
                    "field_name": e.field_name,
                    "observed_value": e.observed_value,
                    "reference_label": e.reference_label,
                }
                for e in self.evidence
            ],
        }

@dataclass
class RecordSnapshot:
    id: str
    record_type: str
    source_reference: str
    survey_series: Optional[str] = None
    khatian_no: Optional[str] = None
    dag_no: Optional[str] = None
    holding_no: Optional[str] = None
    deed_no: Optional[str] = None
    mutation_case_no: Optional[str] = None
    dcr_no: Optional[str] = None
    record_date: Optional[date] = None
    registration_date: Optional[date] = None
    area_original: Optional[str] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = None
    seller_party_id: Optional[str] = None
    buyer_party_id: Optional[str] = None
    owner_party_id: Optional[str] = None
    document_sha256: Optional[str] = None
    fields_json: Optional[Dict[str, Any]] = None
    is_archived: bool = False

@dataclass
class PartyAliasSnapshot:
    id: str
    alias_text: str
    confirmed_by_reviewer: bool = False

@dataclass
class PartySnapshot:
    id: str
    label: str
    aliases: List[PartyAliasSnapshot] = field(default_factory=list)

@dataclass
class CrosswalkSnapshot:
    id: str
    series_a: str
    dag_a: str
    series_b: str
    dag_b: str
    basis_note: Optional[str] = None
    confirmed_by_reviewer: bool = False

@dataclass
class EventSnapshot:
    id: str
    source_record_id: Optional[str] = None
    event_date: Optional[date] = None
    transfer_type: str = "sale"
    from_party_id: Optional[str] = None
    to_party_id: Optional[str] = None
    area_conveyed_value: Optional[float] = None
    area_unit: Optional[str] = None
    holding_key: Optional[str] = None
    sequence_index: int = 0
    derived: bool = True
    notes: Optional[str] = None

@dataclass
class CaseConfig:
    area_tolerance_pct: float = 1.0
    rapid_transfer_days: int = 30
    mutation_reference_days: int = 45
    katha_sqft: Optional[float] = None
    bigha_sqft: Optional[float] = None
    reference_date: Optional[date] = None

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> "CaseConfig":
        if not data:
            return cls()
        ref_d = data.get("reference_date")
        if isinstance(ref_d, str):
            ref_d = date.fromisoformat(ref_d)
        return cls(
            area_tolerance_pct=float(data.get("area_tolerance_pct", 1.0)),
            rapid_transfer_days=int(data.get("rapid_transfer_days", 30)),
            mutation_reference_days=int(data.get("mutation_reference_days", 45)),
            katha_sqft=float(data["katha_sqft"]) if data.get("katha_sqft") is not None else None,
            bigha_sqft=float(data["bigha_sqft"]) if data.get("bigha_sqft") is not None else None,
            reference_date=ref_d,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "area_tolerance_pct": self.area_tolerance_pct,
            "rapid_transfer_days": self.rapid_transfer_days,
            "mutation_reference_days": self.mutation_reference_days,
            "katha_sqft": self.katha_sqft,
            "bigha_sqft": self.bigha_sqft,
            "reference_date": self.reference_date.isoformat() if self.reference_date else None,
        }

@dataclass
class CaseSnapshot:
    case_id: str
    case_code: str
    title: str = ""
    district: Optional[str] = None
    upazila: Optional[str] = None
    mouza: Optional[str] = None
    records: List[RecordSnapshot] = field(default_factory=list)
    parties: List[PartySnapshot] = field(default_factory=list)
    crosswalks: List[CrosswalkSnapshot] = field(default_factory=list)
    events: List[EventSnapshot] = field(default_factory=list)
    config: CaseConfig = field(default_factory=CaseConfig)

    def get_party(self, party_id: Optional[str]) -> Optional[PartySnapshot]:
        if not party_id:
            return None
        for p in self.parties:
            if p.id == party_id:
                return p
        return None

    def get_record(self, record_id: Optional[str]) -> Optional[RecordSnapshot]:
        if not record_id:
            return None
        for r in self.records:
            if r.id == record_id:
                return r
        return None
