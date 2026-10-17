"""JomiTrace Rule Engine Orchestrator."""
import hashlib
import json
from datetime import date
from typing import Any, Dict, List, Optional

from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    CrosswalkSnapshot,
    EventSnapshot,
    EvidenceRef,
    Finding,
    PartyAliasSnapshot,
    PartySnapshot,
    RecordSnapshot,
    RuleStatus,
)
from app.rules.r01_plot import check_plot_reference
from app.rules.r02_area import check_recorded_area
from app.rules.r03_chain import check_chain_continuity
from app.rules.r04_competing import check_competing_transfers
from app.rules.r05_over_conveyance import check_over_conveyance
from app.rules.r06_dates import check_date_order
from app.rules.r07_mutation import check_registration_mutation_link
from app.rules.r08_rapid import check_rapid_transfer
from app.rules.r09_missing import check_missing_fields
from app.rules.r10_reuse import check_document_reuse

RULE_REGISTRY = [
    ("JT-R01", check_plot_reference),
    ("JT-R02", check_recorded_area),
    ("JT-R03", check_chain_continuity),
    ("JT-R04", check_competing_transfers),
    ("JT-R05", check_over_conveyance),
    ("JT-R06", check_date_order),
    ("JT-R07", check_registration_mutation_link),
    ("JT-R08", check_rapid_transfer),
    ("JT-R09", check_missing_fields),
    ("JT-R10", check_document_reuse),
]

CASE_LIMITATIONS_NOTICE = (
    "Evaluates supplied record metadata against deterministic screening rules; "
    "does not confirm official legal title or substitute for certified physical records."
)

def run_all(snapshot: CaseSnapshot, config: Optional[CaseConfig] = None) -> List[Finding]:
    """
    Executes all deterministic rules against a case snapshot in a strictly stable order.
    Returns sorted, reproducible findings.
    """
    cfg = config or snapshot.config or CaseConfig()
    all_findings: List[Finding] = []

    for rule_code, rule_fn in RULE_REGISTRY:
        findings = rule_fn(snapshot, cfg)
        for f in findings:
            if not f.rule_code:
                f.rule_code = rule_code
            _ensure_finding_evidence(snapshot, f)
            all_findings.append(f)
        if not findings:
            categories = {
                "JT-R01": "plot_mismatch", "JT-R02": "area_mismatch", "JT-R03": "chain_gap",
                "JT-R04": "possible_duplicate_transfer", "JT-R05": "over_conveyance", "JT-R06": "date_conflict",
                "JT-R07": "reg_mutation_mismatch", "JT-R08": "rapid_transfer", "JT-R09": "missing_data",
                "JT-R10": "document_reuse",
            }
            eligible_deeds = [r for r in snapshot.records if not r.is_archived and r.record_type == "deed"]
            clean_r04 = rule_code == "JT-R04" and len(eligible_deeds) > 1
            summary_text = "No competing transfers found" if clean_r04 else f"{rule_code} not assessed"
            explanation_text = (
                "No competing conveyances by the same seller were identified in the entered records."
                if clean_r04 else "The entered records do not provide an applicable comparison for this check."
            )
            all_findings.append(Finding(
                rule_code=rule_code,
                category=categories[rule_code],
                status=RuleStatus.NO_INCONSISTENCY_FOUND.value if clean_r04 else RuleStatus.NOT_APPLICABLE.value,
                summary=summary_text,
                explanation=explanation_text,
                limitations=("Document reuse can only be screened when document identifiers or hashes are supplied." if rule_code == "JT-R10" else "No outcome is inferred when the entered records do not support this check."),
                recommended_next_step="",
            ))

    # Sort deterministically by (rule_code, status, summary)
    all_findings.sort(key=lambda f: (f.rule_code, f.status, f.summary))
    return all_findings

def _ensure_finding_evidence(snapshot: CaseSnapshot, finding: Finding) -> None:
    """Backfill citations for source records/fields named by a rule result."""
    cited = {(item.source_record_id, item.field_name) for item in finding.evidence}
    for record_id in finding.source_record_ids:
        record = snapshot.get_record(record_id)
        if record is None:
            continue
        fields = finding.compared_fields or ["source_record"]
        for field_name in fields:
            if (record_id, field_name) in cited:
                continue
            value: Any = getattr(record, field_name, None)
            if value is None and record.fields_json:
                value = record.fields_json.get(field_name)
            if field_name in {"seller_party_id", "buyer_party_id", "owner_party_id"} and value:
                party = snapshot.get_party(str(value))
                value = party.label if party else value
            if field_name in {"record_date/registration_date", "date"}:
                value = record.record_date or record.registration_date
            # Missing values belong only in rules that explicitly cite a gap;
            # do not fabricate null citations for unrelated fields on a record.
            if value is None:
                continue
            finding.evidence.append(
                EvidenceRef(
                    source_record_id=record.id,
                    field_name=field_name,
                    observed_value=str(value) if value is not None else None,
                    reference_label=record.source_reference,
                )
            )
            cited.add((record_id, field_name))

def compute_case_summary(findings: List[Finding]) -> Dict[str, Any]:
    """
    Computes case-level discrepancy banner and counts strictly adhering to RULES.md:
    'Conflict detected (n)' if any, else 'Review required (n)' if any, else
    'Insufficient information (n)' if any, else 'No inconsistency found by these checks'.
    """
    counts = {
        RuleStatus.CONFLICT_DETECTED.value: 0,
        RuleStatus.REVIEW_REQUIRED.value: 0,
        RuleStatus.INSUFFICIENT_INFORMATION.value: 0,
        RuleStatus.NO_INCONSISTENCY_FOUND.value: 0,
        RuleStatus.NOT_APPLICABLE.value: 0,
    }

    unique_findings = {}
    for f in findings:
        key = (f.rule_code, f.category, f.status, f.summary, f.recommended_next_step, f.limitations)
        unique_findings.setdefault(key, f)
    for f in unique_findings.values():
        if f.status in counts:
            counts[f.status] += 1

    conflict_count = counts[RuleStatus.CONFLICT_DETECTED.value]
    review_count = counts[RuleStatus.REVIEW_REQUIRED.value]
    insufficient_count = counts[RuleStatus.INSUFFICIENT_INFORMATION.value]

    actionable = [f for f in unique_findings.values() if f.status in {
        RuleStatus.CONFLICT_DETECTED.value,
        RuleStatus.REVIEW_REQUIRED.value,
        RuleStatus.INSUFFICIENT_INFORMATION.value,
    }]
    parents = list(range(len(actionable)))

    def find_root(index: int) -> int:
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    for left in range(len(actionable)):
        left_sources = set(actionable[left].source_record_ids)
        for right in range(left + 1, len(actionable)):
            right_sources = set(actionable[right].source_record_ids)
            if actionable[left].rule_code == actionable[right].rule_code or left_sources.intersection(right_sources):
                left_root, right_root = find_root(left), find_root(right)
                if left_root != right_root:
                    parents[right_root] = left_root
    issue_count = len({find_root(index) for index in range(len(actionable))})

    if conflict_count > 0:
        banner_status = RuleStatus.CONFLICT_DETECTED.value
        banner_label = f"Conflict detected ({conflict_count})"
    elif review_count > 0:
        banner_status = RuleStatus.REVIEW_REQUIRED.value
        banner_label = f"Review required ({review_count})"
    elif insufficient_count > 0:
        banner_status = RuleStatus.INSUFFICIENT_INFORMATION.value
        banner_label = f"Insufficient information ({insufficient_count})"
    else:
        banner_status = RuleStatus.NO_INCONSISTENCY_FOUND.value
        banner_label = "No inconsistency found by these checks"

    return {
        "banner_status": banner_status,
        "banner_label": banner_label,
        "counts": counts,
        "total_findings": len(unique_findings),
        "issue_count": issue_count,
        "check_count": len(actionable),
        "limitations": CASE_LIMITATIONS_NOTICE,
    }

def compute_input_hash(snapshot: CaseSnapshot) -> str:
    """Computes a stable SHA-256 hash representing the case input state."""
    raw = {
        "case_code": snapshot.case_code,
        "records": [
            {
                "id": r.id,
                "type": r.record_type,
                "dag": r.dag_no,
                "area": r.area_value,
                "unit": r.area_unit,
                "seller": r.seller_party_id,
                "buyer": r.buyer_party_id,
                "rec_date": str(r.record_date) if r.record_date else None,
                "reg_date": str(r.registration_date) if r.registration_date else None,
            }
            for r in sorted(snapshot.records, key=lambda x: x.id)
        ],
        "parties": [
            {"id": p.id, "label": p.label}
            for p in sorted(snapshot.parties, key=lambda x: x.id)
        ],
        "crosswalks": [
            {"a": c.dag_a, "b": c.dag_b, "conf": c.confirmed_by_reviewer}
            for c in sorted(snapshot.crosswalks, key=lambda x: x.id)
        ],
    }
    encoded = json.dumps(raw, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

def snapshot_from_dict(data: Dict[str, Any]) -> CaseSnapshot:
    """Constructs a CaseSnapshot from a scenario fixture or raw dictionary."""
    def parse_d(val: Any) -> Optional[date]:
        if not val:
            return None
        if isinstance(val, date):
            return val
        return date.fromisoformat(str(val))

    records = [
        RecordSnapshot(
            id=r.get("id", f"rec-{i}"),
            record_type=r.get("record_type", "deed"),
            source_reference=r.get("source_reference", f"Record-{i}"),
            survey_series=r.get("survey_series"),
            khatian_no=r.get("khatian_no"),
            dag_no=r.get("dag_no"),
            holding_no=r.get("holding_no"),
            deed_no=r.get("deed_no"),
            mutation_case_no=r.get("mutation_case_no"),
            dcr_no=r.get("dcr_no"),
            record_date=parse_d(r.get("record_date")),
            registration_date=parse_d(r.get("registration_date")),
            area_original=r.get("area_original"),
            area_value=float(r["area_value"]) if r.get("area_value") is not None else None,
            area_unit=r.get("area_unit"),
            seller_party_id=r.get("seller_party_id"),
            buyer_party_id=r.get("buyer_party_id"),
            owner_party_id=r.get("owner_party_id"),
            document_sha256=r.get("document_sha256"),
            fields_json=r.get("fields_json"),
            is_archived=bool(r.get("is_archived", False)),
        )
        for i, r in enumerate(data.get("records", []))
    ]

    parties = [
        PartySnapshot(
            id=p.get("id", f"party-{i}"),
            label=p.get("label", f"Party {i}"),
            aliases=[
                PartyAliasSnapshot(
                    id=a.get("id", f"alias-{j}"),
                    alias_text=a.get("alias_text", ""),
                    confirmed_by_reviewer=bool(a.get("confirmed_by_reviewer", False)),
                )
                for j, a in enumerate(p.get("aliases", []))
            ],
        )
        for i, p in enumerate(data.get("parties", []))
    ]

    crosswalks = [
        CrosswalkSnapshot(
            id=c.get("id", f"cw-{i}"),
            series_a=c.get("series_a", "RS"),
            dag_a=c.get("dag_a", ""),
            series_b=c.get("series_b", "BS"),
            dag_b=c.get("dag_b", ""),
            basis_note=c.get("basis_note"),
            confirmed_by_reviewer=bool(c.get("confirmed_by_reviewer", False)),
        )
        for i, c in enumerate(data.get("crosswalks", []))
    ]

    events = [
        EventSnapshot(
            id=e.get("id", f"ev-{i}"),
            source_record_id=e.get("source_record_id"),
            event_date=parse_d(e.get("event_date")),
            transfer_type=e.get("transfer_type", "sale"),
            from_party_id=e.get("from_party_id"),
            to_party_id=e.get("to_party_id"),
            area_conveyed_value=float(e["area_conveyed_value"]) if e.get("area_conveyed_value") is not None else None,
            area_unit=e.get("area_unit"),
            holding_key=e.get("holding_key"),
            sequence_index=int(e.get("sequence_index", i)),
            derived=bool(e.get("derived", True)),
            notes=e.get("notes"),
        )
        for i, e in enumerate(data.get("events", []))
    ]

    cfg = CaseConfig.from_dict(data.get("config"))

    return CaseSnapshot(
        case_id=data.get("case_id", "case-1"),
        case_code=data.get("case_code", "JT-TEST"),
        title=data.get("title", "Test Case"),
        district=data.get("district"),
        upazila=data.get("upazila"),
        mouza=data.get("mouza"),
        records=records,
        parties=parties,
        crosswalks=crosswalks,
        events=events,
        config=cfg,
    )
