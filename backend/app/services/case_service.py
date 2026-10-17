"""Case management, event derivation, rule execution, and report services."""
import json
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.analysis_run import AnalysisRun
from app.models.audit_event import CaseAuditEvent
from app.models.case import VerificationCase
from app.models.checklist import ChecklistItem
from app.models.enums import (
    CaseStatus,
    ChecklistStatus,
    FindingCategory,
    FindingStatus,
    Provenance,
    RecordType,
    SurveySeries,
    TransferType,
)
from app.models.finding import Finding, FindingEvidence
from app.models.party import Party, PartyAlias
from app.models.plot_crosswalk import PlotCrosswalk
from app.models.source_record import SourceRecord
from app.models.transfer_event import TransferEvent
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    CrosswalkSnapshot,
    EventSnapshot,
    PartyAliasSnapshot,
    PartySnapshot,
    RecordSnapshot,
    RuleStatus,
)
from app.rules.engine import (
    CASE_LIMITATIONS_NOTICE,
    compute_case_summary,
    compute_input_hash,
    run_all,
)
from app.schemas.audit import AuditTrailResponse
from app.schemas.comparison import ComparisonCell, ComparisonResponse, ComparisonRow
from app.schemas.integrity import IntegrityCheckResponse
from app.schemas.report import ReportMetadata, ReportResponse
from app.schemas.timeline import TimelineNode, TimelineResponse

FIXTURES_DIR = Path(__file__).parent.parent.parent / "tests" / "fixtures"

class ScenarioCaseCollisionError(Exception):
    """Raised when a fictional scenario would overwrite non-demo case data."""

DEFAULT_CHECKLIST_TEMPLATE = [
    {
        "label": "Confirm source documents through authorized channels",
        "description": "Verify each source document and reference through the sub-registry office or authorized portal.",
    },
    {
        "label": "Verify plot continuity across survey series",
        "description": "Confirm whether plot numbers across CS, SA, RS, and BS refer to the same physical parcel using certified mouza map crosswalk.",
    },
    {
        "label": "Confirm recorded area on original certified records",
        "description": "Inspect certified copies of deeds and khatians to confirm recorded area and unit match the entered metadata.",
    },
    {
        "label": "Review transfer sequence for missing links",
        "description": "Review successive title transfers to ensure no unrecorded heirship, partition, or gap exists between successive owners.",
    },
    {
        "label": "Check mutation entry and disposal status",
        "description": "Check the mutation case entry and DCR disposal status through the Upazila Land Office or official e-mutation portal.",
    },
    {
        "label": "Review land development tax receipts",
        "description": "Verify that land development tax (dakhila) receipts are up to date and paid under the relevant holding number.",
    },
    {
        "label": "Check khas, acquisition, and dispute status",
        "description": "Confirm through authorized records that the land is not vested, khas, acquired for public purpose, or subject to pending civil injunction.",
    },
    {
        "label": "Seek qualified legal or demarcation survey review",
        "description": "Engage a qualified legal professional or licensed surveyor where complex inheritance, parcel partition, or boundary demarcations apply.",
    },
]

SCENARIOS_CATALOG = [
    {
        "id": "S1",
        "case_code": "JT-S1-CLEAN",
        "title": "Clean continuous ownership chain",
        "description": "Clean 3-link continuous chain with consistent deed, mutation, and DCR records.",
        "expected_outcome": "No inconsistency found by these checks",
        "district": "Gazipur",
        "upazila": "Sreepur",
        "mouza": "Telihati",
    },
    {
        "id": "S2",
        "case_code": "JT-S2-DUPLICATE",
        "title": "Competing duplicate transfer",
        "description": "Same seller conveys the same full holding to two separate purchasers; other metadata is complete.",
        "expected_outcome": "One duplicate-sale issue, linked across JT-R03, JT-R04, and JT-R05 checks",
        "district": "Dhaka",
        "upazila": "Savar",
        "mouza": "Birulia",
    },
    {
        "id": "S3",
        "case_code": "JT-S3-OVERCONVEY",
        "title": "Potential over-conveyance & legitimate partial sale",
        "description": "Seller owns 50 decimal; conveys 30 decimal and 32 decimal across successive deeds.",
        "expected_outcome": "Conflict detected on aggregate area (JT-R05); partial transfer flagged review required (JT-R04)",
        "district": "Narayanganj",
        "upazila": "Rupganj",
        "mouza": "Murapara",
    },
    {
        "id": "S4",
        "case_code": "JT-S4-CONVERT",
        "title": "Mixed units conversion with area discrepancy",
        "description": "Decimal vs sq ft conversion equal on first deed; second deed exceeds tolerance by 12%.",
        "expected_outcome": "No inconsistency on converted pair; conflict detected on 12% discrepancy (JT-R02)",
        "district": "Cumilla",
        "upazila": "Kotwali",
        "mouza": "Durgapur",
    },
    {
        "id": "S5",
        "case_code": "JT-S5-GAP",
        "title": "Unlinked ownership chain gap",
        "description": "Event 3 seller never appeared as a buyer in any prior deed or certified record.",
        "expected_outcome": "Review required on chain continuity (JT-R03) with gap marker on timeline",
        "district": "Mymensingh",
        "upazila": "Trishal",
        "mouza": "Boilor",
    },
    {
        "id": "S6",
        "case_code": "JT-S6-MUTATION",
        "title": "Registration-mutation mismatch and rapid re-transfer",
        "description": "Mutation names a different buyer than registered deed; holding re-transferred within 20 days.",
        "expected_outcome": "Conflict detected on mutation beneficiary (JT-R07); review required on rapid re-transfer (JT-R08)",
        "district": "Tangail",
        "upazila": "Mirzapur",
        "mouza": "Gorai",
    },
    {
        "id": "S7",
        "case_code": "JT-S7-BLANK",
        "title": "Incomplete records missing required fields",
        "description": "Critical fields blank; screening engine reports missing metadata without treating blanks as matches.",
        "expected_outcome": "Insufficient information on missing data (JT-R09); downstream rule outcomes remain explicit",
        "district": "Gazipur",
        "upazila": "Kaliakair",
        "mouza": "Mouchak",
    },
    {
        "id": "S8",
        "case_code": "JT-S8-UNMAPPED",
        "title": "Cross-survey series without plot crosswalk",
        "description": "RS khatian compared against BS deed with no reviewer crosswalk mapping entered.",
        "expected_outcome": "Insufficient information on cross-series plot equality (JT-R01)",
        "district": "Bogura",
        "upazila": "Sadar",
        "mouza": "Nishindara",
    },
]

RULES_CATALOG = [
    {
        "code": "JT-R01",
        "name": "Plot reference comparison",
        "category": "plot_mismatch",
        "logic": "Compares dag (plot) numbers between records within the same survey series, or across series through a reviewer-confirmed crosswalk entry.",
        "conflict_condition": "Same survey series, different plot numbers citing same holding.",
        "review_required_condition": "Cross-series mapping entered but awaiting reviewer confirmation.",
        "insufficient_condition": "Cross-series comparison with no crosswalk entered, or plot number missing.",
        "limitations": "Evaluates dag references as entered; does not inspect physical ground boundaries.",
    },
    {
        "code": "JT-R02",
        "name": "Recorded area pairwise comparison",
        "category": "area_mismatch",
        "logic": "Normalizes areas to square feet and compares values pairwise within the allowed tolerance percentage.",
        "conflict_condition": "Area difference exceeds configured tolerance percentage.",
        "review_required_condition": "Regional or ambiguous units present without confirmed basis.",
        "insufficient_condition": "Area value or unit missing on one or both compared records.",
        "limitations": "Compares stated numeric values; does not account for physical ground accretion or erosion.",
    },
    {
        "code": "JT-R03",
        "name": "Chain of ownership continuity",
        "category": "chain_gap",
        "logic": "Verifies that seller of event N equals the buyer or confirmed owner of event N-1 by confirmed party ID.",
        "conflict_condition": "Seller of transfer N is a confirmed party different from owner of transfer N-1.",
        "review_required_condition": "Initial transfer without predecessor, or predecessor party unconfirmed.",
        "insufficient_condition": "Party information is unassigned or incomplete.",
        "limitations": "Traces recorded transfers; unrecorded heirship, gift, or oral partition requires manual verification.",
    },
    {
        "code": "JT-R04",
        "name": "Competing transfers screening",
        "category": "possible_duplicate_transfer",
        "logic": "Screens deeds grouped by seller and compares buyer identities and conveyed areas with the recorded holding.",
        "conflict_condition": "Two or more deeds each convey the full holding to different buyers.",
        "review_required_condition": "Partial conveyances exceed the holding, or cannot be assessed because dates or areas are missing.",
        "insufficient_condition": "Required dates or areas are missing for comparison.",
        "limitations": "Screening indicator only; does not adjudicate priority of competing registered deeds.",
    },
    {
        "code": "JT-R05",
        "name": "Aggregate conveyed area screening",
        "category": "over_conveyance",
        "logic": "Sums entered deed areas by seller and compares the total with the recorded holding area.",
        "conflict_condition": "Cumulative conveyed area exceeds the recorded holding area beyond allowed tolerance.",
        "review_required_condition": "Conveyed total exceeds holding area but remains within tolerance margin, or deed lacks area.",
        "insufficient_condition": "Holding baseline area missing or unparseable.",
        "limitations": "Sums entered numeric areas; boundary configurations and partial-plot shapes are not assessed.",
    },
    {
        "code": "JT-R06",
        "name": "Chronological date order validation",
        "category": "date_conflict",
        "logic": "Checks entered registration dates for future values and linked mutation-before-deed ordering.",
        "conflict_condition": "A registration date is in the future or a linked mutation predates its cited deed registration.",
        "review_required_condition": "None.",
        "insufficient_condition": "No registration dates are supplied.",
        "limitations": "Checks entered registration dates only; original document dates and physical stamps are not authenticated.",
    },
    {
        "code": "JT-R07",
        "name": "Registration-mutation consistency link",
        "category": "reg_mutation_mismatch",
        "logic": "Verifies that mutation beneficiary matches deed purchaser, and mutation area agrees with deed area.",
        "conflict_condition": "Mutation beneficiary differs from deed buyer, or mutation area differs beyond tolerance.",
        "review_required_condition": "Mutation records exist for other deeds, but a deed remains unlinked; or a mutation cites a deed not in case.",
        "insufficient_condition": "No mutation records are supplied, or a mutation cannot be linked to one deed among several.",
        "limitations": "Compares entered metadata; does not substitute for checking Upazila Land Office disposal registers.",
    },
    {
        "code": "JT-R08",
        "name": "Rapid re-transfer monitoring",
        "category": "rapid_transfer",
        "logic": "Flags when a holding is re-transferred within configured rapid transfer window (default 30 days).",
        "conflict_condition": "None (rapid re-transfer is an operational review signal and never a conflict by itself).",
        "review_required_condition": "Subsequent transfer occurs within configured threshold window.",
        "insufficient_condition": "Transfer dates missing.",
        "limitations": "Identifies transaction frequency; rapid transfers may reflect urgent commercial necessity.",
    },
    {
        "code": "JT-R09",
        "name": "Missing fields and completeness audit",
        "category": "missing_data",
        "logic": "Checks each record against per-record-type required fields and reports missing metadata without inferring downstream rule outcomes.",
        "conflict_condition": "None (missing data is a completeness signal only).",
        "review_required_condition": "None.",
        "insufficient_condition": "Any required plot, date, area, or party field blank on an entered record.",
        "limitations": "Reflects only completeness of metadata entered; does not verify authenticity of entered values.",
    },
    {
        "code": "JT-R10",
        "name": "Document reuse screening",
        "category": "document_reuse",
        "logic": "Detects same SHA-256 hash or document number used across different parties or holdings.",
        "conflict_condition": "Identical document SHA-256 hash cited under different parties or holdings.",
        "review_required_condition": "Same deed or mutation number with differing dates or parties.",
        "insufficient_condition": "Document hash not supplied.",
        "limitations": "Screens entered hash metadata; physical document examination requires authorized review.",
    },
]

def mark_case_runs_stale(db: Session, case_id: str, auto_commit: bool = True) -> None:
    """Marks all non-stale analysis runs for a case as stale when records change."""
    active_runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.case_id == case_id, AnalysisRun.is_stale.is_(False))
        .all()
    )
    for run in active_runs:
        run.is_stale = True
    if active_runs:
        if auto_commit:
            db.commit()
        else:
            db.flush()

def seed_default_checklist(db: Session, case_id: str, auto_commit: bool = True) -> List[ChecklistItem]:
    """Seeds the 8 standard verification checklist items for a case if not already present."""
    existing = db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).count()
    if existing > 0:
        return db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).all()

    items: List[ChecklistItem] = []
    for item_data in DEFAULT_CHECKLIST_TEMPLATE:
        item = ChecklistItem(
            case_id=case_id,
            label=item_data["label"],
            description=item_data["description"],
            status=ChecklistStatus.PENDING,
            completion_note=None,
        )
        db.add(item)
        items.append(item)
    if auto_commit:
        db.commit()
    else:
        db.flush()
    return items

def derive_events_from_records(records: List[SourceRecord]) -> List[EventSnapshot]:
    """
    Auto-derives chronological ownership transfer events from deed and mutation records.
    Sorts events deterministically by date and source reference.
    """
    transfer_records = [
        r for r in records
        if not r.is_archived and r.record_type in (RecordType.DEED, RecordType.MUTATION)
    ]

    def record_sort_key(r: SourceRecord) -> Tuple[date, str]:
        d = r.registration_date or r.record_date or date(1900, 1, 1)
        return (d, r.source_reference)

    sorted_records = sorted(transfer_records, key=record_sort_key)
    events: List[EventSnapshot] = []

    for idx, r in enumerate(sorted_records):
        tt = "sale"
        if r.record_type == RecordType.MUTATION:
            tt = "mutation"
        elif r.fields_json and r.fields_json.get("transfer_type"):
            tt = str(r.fields_json["transfer_type"]).lower()

        from_party = r.seller_party_id
        to_party = r.buyer_party_id or r.owner_party_id

        holding_key = None
        if r.survey_series and r.dag_no:
            series_str = r.survey_series.value if hasattr(r.survey_series, "value") else str(r.survey_series)
            holding_key = f"{series_str}:{r.dag_no.strip()}"

        ev = EventSnapshot(
            id=f"derived-ev-{r.id}",
            source_record_id=r.id,
            event_date=r.registration_date or r.record_date,
            transfer_type=tt,
            from_party_id=from_party,
            to_party_id=to_party,
            area_conveyed_value=r.area_value,
            area_unit=r.area_unit,
            holding_key=holding_key,
            sequence_index=idx,
            derived=True,
            notes=f"Derived from {r.source_reference}",
        )
        events.append(ev)

    return events

def build_case_snapshot_from_db(case: VerificationCase) -> CaseSnapshot:
    """Builds an isolated CaseSnapshot dataclass from database models for rule execution."""
    active_records = [r for r in case.records if not r.is_archived]

    records = [
        RecordSnapshot(
            id=r.id,
            record_type=r.record_type.value if hasattr(r.record_type, "value") else str(r.record_type),
            source_reference=r.source_reference,
            survey_series=r.survey_series.value if r.survey_series and hasattr(r.survey_series, "value") else (str(r.survey_series) if r.survey_series else None),
            khatian_no=r.khatian_no,
            dag_no=r.dag_no,
            holding_no=r.holding_no,
            deed_no=r.deed_no,
            mutation_case_no=r.mutation_case_no,
            dcr_no=r.dcr_no,
            record_date=r.record_date,
            registration_date=r.registration_date,
            area_original=r.area_original,
            area_value=r.area_value,
            area_unit=r.area_unit,
            seller_party_id=r.seller_party_id,
            buyer_party_id=r.buyer_party_id,
            owner_party_id=r.owner_party_id,
            document_sha256=r.document_sha256,
            fields_json=r.fields_json,
            is_archived=r.is_archived,
        )
        for r in active_records
    ]

    parties = [
        PartySnapshot(
            id=p.id,
            label=p.label,
            aliases=[
                PartyAliasSnapshot(
                    id=a.id,
                    alias_text=a.alias_text,
                    confirmed_by_reviewer=a.confirmed_by_reviewer,
                )
                for a in p.aliases
            ],
        )
        for p in case.parties
    ]

    crosswalks = [
        CrosswalkSnapshot(
            id=c.id,
            series_a=c.series_a.value if hasattr(c.series_a, "value") else str(c.series_a),
            dag_a=c.dag_a,
            series_b=c.series_b.value if hasattr(c.series_b, "value") else str(c.series_b),
            dag_b=c.dag_b,
            basis_note=c.basis_note,
            confirmed_by_reviewer=c.confirmed_by_reviewer,
        )
        for c in case.crosswalks
    ]

    # Convert existing TransferEvent records, or auto-derive if none stored
    if case.events:
        events = [
            EventSnapshot(
                id=e.id,
                source_record_id=e.source_record_id,
                event_date=e.event_date,
                transfer_type=e.transfer_type.value if hasattr(e.transfer_type, "value") else str(e.transfer_type),
                from_party_id=e.from_party_id,
                to_party_id=e.to_party_id,
                area_conveyed_value=e.area_conveyed_value,
                area_unit=e.area_unit,
                holding_key=e.holding_key,
                sequence_index=e.sequence_index,
                derived=e.derived,
                notes=e.notes,
            )
            for e in case.events
        ]
    else:
        events = derive_events_from_records(case.records)

    config = CaseConfig.from_dict(case.config_json)

    return CaseSnapshot(
        case_id=case.id,
        case_code=case.case_code,
        title=case.title,
        district=case.district,
        upazila=case.upazila,
        mouza=case.mouza,
        records=records,
        parties=parties,
        crosswalks=crosswalks,
        events=events,
        config=config,
    )

def run_analysis_for_case(
    db: Session,
    case: VerificationCase,
    config_override: Optional[Dict[str, Any]] = None,
    auto_commit: bool = True,
) -> Tuple[AnalysisRun, Dict[str, Any]]:
    """
    Executes the deterministic rule engine against a case, persists the run and findings,
    and returns the AnalysisRun model with its computed summary.
    """
    snapshot = build_case_snapshot_from_db(case)

    # Merge config override if supplied
    merged_cfg = dict(case.config_json or settings.DEFAULT_CASE_CONFIG)
    if config_override:
        merged_cfg.update(config_override)
    cfg = CaseConfig.from_dict(merged_cfg)

    # Execute deterministic rules
    rule_findings = run_all(snapshot, cfg)
    summary = compute_case_summary(rule_findings)
    inp_hash = compute_input_hash(snapshot)

    # Mark prior runs as stale
    mark_case_runs_stale(db, case.id, auto_commit=auto_commit)

    # Create new analysis run
    run = AnalysisRun(
        case_id=case.id,
        rule_version=settings.RULE_VERSION,
        config_snapshot_json=cfg.to_dict(),
        input_hash=inp_hash,
        is_stale=False,
    )
    db.add(run)
    db.flush()

    # Track DB record IDs to enforce evidence foreign-key integrity
    db_record_ids = {r.id for r in case.records}

    for rf in rule_findings:
        # Convert category string to enum
        try:
            cat_enum = FindingCategory(rf.category)
        except ValueError:
            cat_enum = FindingCategory.PLOT_MISMATCH

        # Convert status string to enum
        try:
            status_enum = FindingStatus(rf.status)
        except ValueError:
            status_enum = FindingStatus.REVIEW_REQUIRED

        db_finding = Finding(
            run_id=run.id,
            case_id=case.id,
            rule_code=rf.rule_code,
            category=cat_enum,
            status=status_enum,
            summary=rf.summary,
            explanation=rf.explanation,
            compared_fields=rf.compared_fields,
            observed_values=rf.observed_values,
            limitations=rf.limitations,
            recommended_next_step=rf.recommended_next_step,
        )
        db.add(db_finding)
        db.flush()

        # Link evidence (deduplicating composite PK: (finding_id, source_record_id, field_name))
        seen_evidence_keys = set()
        for ev in rf.evidence:
            if ev.source_record_id in db_record_ids:
                field_name_safe = ev.field_name or "unspecified"
                ev_key = (db_finding.id, ev.source_record_id, field_name_safe)
                if ev_key not in seen_evidence_keys:
                    seen_evidence_keys.add(ev_key)
                    db_ev = FindingEvidence(
                        finding_id=db_finding.id,
                        source_record_id=ev.source_record_id,
                        field_name=field_name_safe,
                        observed_value=str(ev.observed_value) if ev.observed_value is not None else None,
                        reference_label=ev.reference_label,
                    )
                    db.add(db_ev)

    # Update case operational status
    if summary["counts"][RuleStatus.CONFLICT_DETECTED.value] > 0:
        # The stored field is operational; API reads project the canonical screening status.
        case.status = CaseStatus.REVIEW_REQUIRED
    elif summary["counts"][RuleStatus.REVIEW_REQUIRED.value] > 0:
        case.status = CaseStatus.REVIEW_REQUIRED
    elif summary["counts"][RuleStatus.INSUFFICIENT_INFORMATION.value] > 0:
        case.status = CaseStatus.IN_REVIEW
    else:
        case.status = CaseStatus.REPORT_READY

    # Record analysis_executed audit event
    record_audit_event(
        db,
        case_id=case.id,
        action="analysis_executed",
        actor="reviewer",
        details={
            "run_id": run.id,
            "rule_version": run.rule_version,
            "result": summary["banner_label"],
            "input_hash": inp_hash,
            "findings_count": len(rule_findings),
        },
        auto_commit=False,
    )

    if auto_commit:
        db.commit()
        db.refresh(run)
        db.refresh(case)
    else:
        db.flush()

    return run, summary

def load_scenario_from_fixture(
    db: Session,
    scenario_id: str,
    replace_existing: bool = True,
) -> Tuple[VerificationCase, AnalysisRun, Dict[str, Any]]:
    """
    Loads a fictional scenario fixture (S1-S8), seeds the database, and executes analysis.
    Uses an atomic transaction with rollback on failure.
    Scopes party, record, event, alias, and crosswalk IDs to the case so different scenarios coexist safely.
    """
    norm_id = scenario_id.upper().strip()
    fixture_path = FIXTURES_DIR / f"{norm_id}.json"
    if not fixture_path.exists():
        raise FileNotFoundError(f"Fixture '{norm_id}.json' not found at {fixture_path}")

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    case_code = data.get("case_code", f"JT-{norm_id}")
    raw_case_id = data.get("case_id")
    target_case_id = raw_case_id or f"case-{norm_id.lower()}"

    try:
        # Check for existing case by case_code or target_case_id
        existing = (
            db.query(VerificationCase)
            .filter((VerificationCase.case_code == case_code) | (VerificationCase.id == target_case_id))
            .first()
        )
        if existing:
            if replace_existing:
                existing_provenance = getattr(existing.provenance, "value", existing.provenance)
                existing_scenario_id = (existing.config_json or {}).get("_demo_scenario_id")
                same_fixture_case = existing.id == target_case_id and existing.case_code == case_code
                same_tagged_scenario = existing_provenance == Provenance.SYNTHETIC.value and existing_scenario_id == norm_id
                if existing_provenance != Provenance.SYNTHETIC.value or not (same_fixture_case or same_tagged_scenario):
                    raise ScenarioCaseCollisionError(
                        f"Fictional scenario {norm_id} cannot replace case '{existing.case_code}'. "
                        "Choose a different case code or remove the demo case explicitly."
                    )
                db.delete(existing)
                db.flush()
            else:
                suffix = int(datetime.now().timestamp())
                case_code = f"{case_code}-{suffix}"
                target_case_id = f"{target_case_id}-{suffix}"

        # 1. Create Case
        case = VerificationCase(
            id=target_case_id,
            case_code=case_code,
            title=data.get("title", f"Scenario {norm_id}"),
            district=data.get("district"),
            upazila=data.get("upazila"),
            mouza=data.get("mouza"),
            provenance=Provenance.SYNTHETIC,
            status=CaseStatus.IN_REVIEW,
            config_json={
                **(data.get("config", settings.DEFAULT_CASE_CONFIG) or {}),
                "_demo_scenario_id": norm_id,
            },
        )
        db.add(case)
        db.flush()

        # 2. Add Parties (scoped to case to avoid table-wide UNIQUE constraint collision)
        party_id_map: Dict[str, str] = {}
        for p_data in data.get("parties", []):
            raw_pid = p_data.get("id")
            scoped_pid = f"{case.id}-{raw_pid}" if raw_pid else str(uuid.uuid4())
            if raw_pid:
                party_id_map[raw_pid] = scoped_pid

            party = Party(
                id=scoped_pid,
                case_id=case.id,
                label=p_data["label"],
            )
            db.add(party)
            db.flush()

            for a_data in p_data.get("aliases", []):
                raw_aid = a_data.get("id")
                scoped_aid = f"{case.id}-{raw_aid}" if raw_aid else str(uuid.uuid4())
                alias = PartyAlias(
                    id=scoped_aid,
                    party_id=party.id,
                    alias_text=a_data["alias_text"],
                    confirmed_by_reviewer=bool(a_data.get("confirmed_by_reviewer", False)),
                )
                db.add(alias)

        # 3. Add SourceRecords (scoped to case)
        record_id_map: Dict[str, str] = {}
        for r_data in data.get("records", []):
            raw_rid = r_data.get("id")
            scoped_rid = f"{case.id}-{raw_rid}" if raw_rid else str(uuid.uuid4())
            if raw_rid:
                record_id_map[raw_rid] = scoped_rid

            rt_str = r_data.get("record_type", "deed").lower()
            try:
                rt_enum = RecordType(rt_str)
            except ValueError:
                rt_enum = RecordType.DEED

            ss_val = r_data.get("survey_series")
            ss_enum = None
            if ss_val:
                try:
                    ss_enum = SurveySeries(ss_val)
                except ValueError:
                    ss_enum = SurveySeries.OTHER

            def parse_date(v: Any) -> Optional[date]:
                if not v:
                    return None
                if isinstance(v, date):
                    return v
                return date.fromisoformat(str(v))

            raw_seller = r_data.get("seller_party_id")
            raw_buyer = r_data.get("buyer_party_id")
            raw_owner = r_data.get("owner_party_id")

            seller_id = party_id_map.get(raw_seller, raw_seller)
            buyer_id = party_id_map.get(raw_buyer, raw_buyer)
            owner_id = party_id_map.get(raw_owner, raw_owner)

            record = SourceRecord(
                id=scoped_rid,
                case_id=case.id,
                record_type=rt_enum,
                source_reference=r_data["source_reference"],
                survey_series=ss_enum,
                khatian_no=r_data.get("khatian_no"),
                dag_no=r_data.get("dag_no"),
                holding_no=r_data.get("holding_no"),
                deed_no=r_data.get("deed_no"),
                mutation_case_no=r_data.get("mutation_case_no"),
                dcr_no=r_data.get("dcr_no"),
                record_date=parse_date(r_data.get("record_date")),
                registration_date=parse_date(r_data.get("registration_date")),
                area_original=r_data.get(
                    "area_original",
                    f"{r_data.get('area_value')} {r_data.get('area_unit')}"
                    if r_data.get("area_value") is not None
                    else None,
                ),
                area_value=float(r_data["area_value"]) if r_data.get("area_value") is not None else None,
                area_unit=r_data.get("area_unit"),
                seller_party_id=seller_id,
                buyer_party_id=buyer_id,
                owner_party_id=owner_id,
                document_sha256=r_data.get("document_sha256"),
                fields_json=r_data.get("fields_json"),
            )
            db.add(record)

        # 4. Add Crosswalks (scoped to case)
        for c_data in data.get("crosswalks", []):
            try:
                s_a = SurveySeries(c_data["series_a"])
            except ValueError:
                s_a = SurveySeries.OTHER
            try:
                s_b = SurveySeries(c_data["series_b"])
            except ValueError:
                s_b = SurveySeries.OTHER

            raw_cid = c_data.get("id")
            scoped_cid = f"{case.id}-{raw_cid}" if raw_cid else str(uuid.uuid4())

            cw = PlotCrosswalk(
                id=scoped_cid,
                case_id=case.id,
                series_a=s_a,
                dag_a=c_data["dag_a"],
                series_b=s_b,
                dag_b=c_data["dag_b"],
                basis_note=c_data.get("basis_note"),
                confirmed_by_reviewer=bool(c_data.get("confirmed_by_reviewer", False)),
            )
            db.add(cw)

        # 5. Add Events if provided in fixture (mapping record and party foreign keys)
        for e_data in data.get("events", []):
            try:
                tt_enum = TransferType(e_data.get("transfer_type", "sale").lower())
            except ValueError:
                tt_enum = TransferType.SALE

            raw_eid = e_data.get("id")
            scoped_eid = f"{case.id}-{raw_eid}" if raw_eid else str(uuid.uuid4())

            raw_s_rec = e_data.get("source_record_id")
            mapped_s_rec = record_id_map.get(raw_s_rec, raw_s_rec)

            raw_from = e_data.get("from_party_id")
            mapped_from = party_id_map.get(raw_from, raw_from)

            raw_to = e_data.get("to_party_id")
            mapped_to = party_id_map.get(raw_to, raw_to)

            ev = TransferEvent(
                id=scoped_eid,
                case_id=case.id,
                source_record_id=mapped_s_rec,
                event_date=parse_date(e_data.get("event_date")),
                transfer_type=tt_enum,
                from_party_id=mapped_from,
                to_party_id=mapped_to,
                area_conveyed_value=float(e_data["area_conveyed_value"]) if e_data.get("area_conveyed_value") is not None else None,
                area_unit=e_data.get("area_unit"),
                holding_key=e_data.get("holding_key"),
                sequence_index=int(e_data.get("sequence_index", 0)),
                derived=bool(e_data.get("derived", True)),
                notes=e_data.get("notes"),
            )
            db.add(ev)

        # 6. Seed Checklist
        seed_default_checklist(db, case.id, auto_commit=False)
        db.flush()

        # 7. Run deterministic analysis immediately (without premature commit)
        run, summary = run_analysis_for_case(db, case, auto_commit=False)

        # 8. Single atomic commit for the entire load transaction
        db.commit()
        db.refresh(case)
        db.refresh(run)

        return case, run, summary

    except Exception:
        db.rollback()
        raise

def build_timeline_for_case(case: VerificationCase, run: Optional[AnalysisRun] = None) -> TimelineResponse:
    """Builds chronological ownership timeline nodes and links detected interruptions/overlaps."""
    party_lookup = {p.id: p.label for p in case.parties}
    record_lookup = {r.id: r for r in case.records}

    findings = run.findings if run else []
    r03_findings = [f for f in findings if f.rule_code == "JT-R03" and f.status in (FindingStatus.CONFLICT_DETECTED, FindingStatus.REVIEW_REQUIRED)]
    r04_findings = [f for f in findings if f.rule_code == "JT-R04" and f.status in (FindingStatus.CONFLICT_DETECTED, FindingStatus.REVIEW_REQUIRED)]

    # Collect events: either from case.events or derived from records
    if case.events:
        db_events = sorted(case.events, key=lambda x: (x.event_date or date(1900, 1, 1), x.sequence_index))
        event_items = [
            (
                e.id,
                e.event_date,
                e.transfer_type.value if hasattr(e.transfer_type, "value") else str(e.transfer_type),
                e.from_party_id,
                e.to_party_id,
                e.area_conveyed_value,
                e.area_unit,
                e.holding_key,
                e.source_record_id,
            )
            for e in db_events
        ]
    else:
        derived = derive_events_from_records(case.records)
        event_items = [
            (
                e.id,
                e.event_date,
                e.transfer_type,
                e.from_party_id,
                e.to_party_id,
                e.area_conveyed_value,
                e.area_unit,
                e.holding_key,
                e.source_record_id,
            )
            for e in derived
        ]

    nodes: List[TimelineNode] = []
    used_record_ids = set()

    for idx, (ev_id, ev_date, tt, from_id, to_id, area_val, area_unit, h_key, src_id) in enumerate(event_items):
        if src_id:
            used_record_ids.add(src_id)
        src_rec = record_lookup.get(src_id) if src_id else None
        src_ref = src_rec.source_reference if src_rec else None
        dag_no = src_rec.dag_no if src_rec else None
        series = src_rec.survey_series.value if src_rec and src_rec.survey_series else None

        date_display = ev_date.strftime("%d %b %Y") if ev_date else "Date not supplied"
        area_display = f"{area_val} {area_unit}" if area_val is not None and area_unit else None
        plot_ref = f"{series} {dag_no}" if series and dag_no else (dag_no or h_key)

        from_label = party_lookup.get(from_id, from_id)
        to_label = party_lookup.get(to_id, to_id)

        # Check for chain interruption marker at this node
        interruption = False
        interruption_label = None
        if idx > 0 and r03_findings:
            # Check if any R03 finding cites this source record or matches seller
            for f in r03_findings:
                if any(ev.source_record_id == src_id for ev in f.evidence):
                    interruption = True
                    interruption_label = f.summary
                    break

        # Check for potential overlap annotation
        overlap = False
        if r04_findings:
            for f in r04_findings:
                if any(ev.source_record_id == src_id for ev in f.evidence):
                    overlap = True
                    break

        node_findings_by_code = {}
        severity = {"conflict_detected": 0, "review_required": 1, "insufficient_information": 2, "no_inconsistency_found": 3, "not_applicable": 4}
        for finding in findings:
            if not any(ev.source_record_id == src_id for ev in finding.evidence):
                continue
            status = finding.status.value if hasattr(finding.status, "value") else str(finding.status)
            current = node_findings_by_code.get(finding.rule_code)
            if current is None or severity.get(status, 9) < severity.get(current["status"], 9):
                node_findings_by_code[finding.rule_code] = {"rule_code": finding.rule_code, "status": status, "summary": finding.summary}
        node_findings = list(node_findings_by_code.values())

        nodes.append(
            TimelineNode(
                event_id=ev_id,
                date=ev_date.isoformat() if ev_date else None,
                date_display=date_display,
                transfer_type=tt,
                from_party_label=from_label,
                from_party_id=from_id,
                to_party_label=to_label,
                to_party_id=to_id,
                area_display=area_display,
                plot_reference=plot_ref,
                holding_key=h_key,
                source_reference=src_ref,
                source_record_id=src_id,
                interruption_marker=interruption,
                interruption_label=interruption_label,
                potential_overlap=overlap,
                associated_findings=node_findings,
            )
        )

    # Unlinked records (e.g. baseline khatians not associated with a deed transfer)
    unlinked = [
        {
            "id": r.id,
            "source_reference": r.source_reference,
            "record_type": r.record_type.value if hasattr(r.record_type, "value") else str(r.record_type),
            "survey_series": r.survey_series.value if r.survey_series else None,
            "dag_no": r.dag_no,
            "area": f"{r.area_value} {r.area_unit}" if r.area_value is not None else None,
        }
        for r in case.records
        if not r.is_archived and r.id not in used_record_ids
    ]

    return TimelineResponse(
        case_id=case.id,
        case_code=case.case_code,
        title=case.title,
        nodes=nodes,
        unlinked_records=unlinked,
    )

def build_comparison_for_case(case: VerificationCase, run: Optional[AnalysisRun] = None) -> ComparisonResponse:
    """Builds horizontal record comparison table comparing plot, area, parties, and dates."""
    records = [r for r in case.records if not r.is_archived]
    party_map = {p.id: p.label for p in case.parties}

    records_meta = [
        {
            "id": r.id,
            "source_reference": r.source_reference,
            "record_type": r.record_type.value if hasattr(r.record_type, "value") else str(r.record_type),
            "survey_series": r.survey_series.value if r.survey_series else "N/A",
        }
        for r in records
    ]

    rows: List[ComparisonRow] = []
    latest_run = run or (max(case.analysis_runs, key=lambda item: item.started_at) if case.analysis_runs else None)
    findings = latest_run.findings if latest_run else []

    # 1. Survey Series
    series_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=r.survey_series.value if r.survey_series else "Not specified",
        )
        for r in records
    ]
    unique_series = {c.value for c in series_cells if c.value != "Not specified"}
    rows.append(
        ComparisonRow(
            field_name="survey_series",
            field_label="Survey series",
            status="mismatch" if len(unique_series) > 1 else "match",
            has_conflict=False,
            details="Different survey series requires confirmed plot crosswalk" if len(unique_series) > 1 else None,
            cells=series_cells,
        )
    )

    # 2. Plot Reference (Dag)
    dag_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=r.dag_no or "Not specified",
        )
        for r in records
    ]
    unique_dags = {c.value for c in dag_cells if c.value != "Not specified"}
    dag_conflict = len(unique_dags) > 1 and len(unique_series) == 1
    rows.append(
        ComparisonRow(
            field_name="dag_no",
            field_label="Plot reference (dag)",
            status="mismatch" if len(unique_dags) > 1 else "match",
            has_conflict=dag_conflict,
            details="Conflicting dag numbers within same survey series" if dag_conflict else None,
            cells=dag_cells,
        )
    )

    # 3. Recorded Area
    area_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=f"{r.area_value} {r.area_unit}" if r.area_value is not None and r.area_unit else (r.area_original or "Not specified"),
        )
        for r in records
    ]
    pairwise_area_conflicts = [f for f in findings if f.rule_code == "JT-R02" and f.status == FindingStatus.CONFLICT_DETECTED]
    over_conveyance_findings = [f for f in findings if f.rule_code == "JT-R05" and f.status == FindingStatus.CONFLICT_DETECTED]
    area_findings = pairwise_area_conflicts + over_conveyance_findings
    area_status = "over_conveyance" if over_conveyance_findings and not pairwise_area_conflicts else "mismatch" if area_findings else "match"
    area_details = "Normalized comparison evaluated by JT-R02 and JT-R05"
    if over_conveyance_findings:
        over = over_conveyance_findings[0].observed_values
        pairwise_label = "areas match" if not pairwise_area_conflicts else "pairwise area mismatch also detected"
        area_details = (
            f"Over-conveyance (JT-R05): {pairwise_label}; total conveyed "
            f"{over.get('conveyed_total_decimal', '—')} > {over.get('holding_area_decimal', '—')} decimal."
        )
    rows.append(
        ComparisonRow(
            field_name="area_value",
            field_label="Recorded area",
            status=area_status,
            has_conflict=bool(area_findings),
            details=(", ".join(sorted({f.rule_code for f in area_findings})) if area_findings and not over_conveyance_findings else area_details),
            cells=area_cells,
        )
    )

    # 4. Seller / Owner Reference
    seller_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=party_map.get(r.seller_party_id or r.owner_party_id, "Not specified"),
        )
        for r in records
    ]
    competing_seller_finding = next(
        (f for f in findings if f.rule_code == "JT-R04" and f.status == FindingStatus.CONFLICT_DETECTED),
        None,
    )
    seller_conflict = competing_seller_finding is not None
    seller_details = (
        f"Same seller on {len({e.source_record_id for e in competing_seller_finding.evidence})} full-holding deeds (JT-R04)"
        if competing_seller_finding else "Transfer sequence; party values are expected to change between records."
    )
    rows.append(
        ComparisonRow(
            field_name="seller_party",
            field_label="Owner / Seller reference",
            status="mismatch" if seller_conflict else "unverified",
            has_conflict=seller_conflict,
            details=seller_details,
            cells=seller_cells,
        )
    )

    # 5. Purchaser / Beneficiary Reference
    buyer_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=party_map.get(r.buyer_party_id, "N/A (khatian)" if r.record_type == RecordType.KHATIAN else "Not specified"),
        )
        for r in records
    ]
    rows.append(
        ComparisonRow(
            field_name="buyer_party",
            field_label="Purchaser / Beneficiary reference",
            status="unverified",
            has_conflict=False,
            details="Transfer sequence; purchaser values change by design.",
            cells=buyer_cells,
        )
    )

    # 6. Record & Registration Dates
    date_cells = [
        ComparisonCell(
            record_id=r.id,
            source_reference=r.source_reference,
            value=r.registration_date.strftime("%d %b %Y") if r.registration_date else (r.record_date.strftime("%d %b %Y") if r.record_date else "Not supplied"),
        )
        for r in records
    ]
    rows.append(
        ComparisonRow(
            field_name="dates",
            field_label="Registration date",
            status="unverified",
            has_conflict=False,
            details="Chronological sequence; dates are not expected to match.",
            cells=date_cells,
        )
    )

    return ComparisonResponse(
        case_id=case.id,
        case_code=case.case_code,
        records=records_meta,
        rows=rows,
    )

def _format_record_area(value: Optional[float], unit: Optional[str], original: Optional[str]) -> str:
    if value is None:
        return original or "Not supplied"
    number = f"{value:,.2f}".rstrip("0").rstrip(".")
    unit_text = (unit or "").lower()
    unit_label = "sq ft" if unit_text in {"sq_ft", "sqft", "square_feet"} else (unit or "")
    formatted = f"{number} {unit_label}".strip()
    if unit_text in {"decimal", "shotok", "shotok/decimal"}:
        sqft = value * 435.6
        formatted += f" ({sqft:,.0f} sq ft)"
    elif unit_text in {"sq_ft", "sqft", "square_feet"}:
        decimal_value = value / 435.6
        formatted += f" ({decimal_value:,.2f} decimal)"
    return formatted

def record_audit_event(
    db: Session,
    case_id: str,
    action: str,
    actor: str = "reviewer",
    details: Optional[Dict[str, Any]] = None,
    auto_commit: bool = True,
) -> CaseAuditEvent:
    """Appends a case event; local reviewer tags are explicitly not authenticated identities."""
    audit_actor = "local_unverified_session" if actor in {"reviewer", "local_user"} else actor
    event = CaseAuditEvent(
        case_id=case_id,
        action=action,
        actor=audit_actor,
        details_json=details or {},
    )
    db.add(event)
    if auto_commit:
        db.commit()
        db.refresh(event)
    else:
        db.flush()
    return event

def get_case_audit_trail(db: Session, case_id: str, case_code: Optional[str] = None) -> AuditTrailResponse:
    """Retrieves chronological audit events for a verification case."""
    code = case_code
    if not code:
        c = db.query(VerificationCase).filter(VerificationCase.id == case_id).first()
        code = c.case_code if c else case_id

    events = (
        db.query(CaseAuditEvent)
        .filter(CaseAuditEvent.case_id == case_id)
        .order_by(CaseAuditEvent.created_at.desc(), CaseAuditEvent.id.desc())
        .all()
    )
    return AuditTrailResponse(
        case_id=case_id,
        case_code=code,
        total_events=len(events),
        events=events,
    )

def verify_case_integrity(case: VerificationCase, run: Optional[AnalysisRun] = None) -> IntegrityCheckResponse:
    """
    Compares the current case input fingerprint with the most recent analysis snapshot.
    """
    snapshot = build_case_snapshot_from_db(case)
    current_hash = compute_input_hash(snapshot)
    latest_run = run
    if not latest_run and case.analysis_runs:
        latest_run = sorted(case.analysis_runs, key=lambda r: r.started_at, reverse=True)[0]

    checked_components = ["source_records", "parties", "plot_crosswalks"]
    disclaimer = (
        "The SHA-256 input fingerprint compares entered case metadata with a local analysis snapshot. "
        "It is not signed, can be recalculated if local records change, and does not authenticate source documents or establish title."
    )

    if not latest_run:
        return IntegrityCheckResponse(
            case_id=case.id,
            case_code=case.case_code,
            run_id=None,
            sealed_hash=None,
            current_hash=current_hash,
            is_sealed=False,
            is_valid=False,
            checked_components=checked_components,
            explanation="No analysis snapshot is available yet. Run the checks to create a comparison fingerprint.",
            disclaimer=disclaimer,
            checked_at=datetime.now(timezone.utc),
        )

    sealed_hash = latest_run.input_hash
    is_valid = bool(sealed_hash and sealed_hash == current_hash)
    explanation = (
        "Input fingerprint matches: current case records, parties, and crosswalks match the analyzed snapshot."
        if is_valid
        else "Input fingerprint differs: case records, parties, or crosswalks changed since the analysis snapshot."
    )

    return IntegrityCheckResponse(
        case_id=case.id,
        case_code=case.case_code,
        run_id=latest_run.id,
        sealed_hash=sealed_hash,
        current_hash=current_hash,
        is_sealed=True,
        is_valid=is_valid,
        checked_components=checked_components,
        explanation=explanation,
        disclaimer=disclaimer,
        checked_at=datetime.now(timezone.utc),
    )

def build_report_payload(case: VerificationCase, run: AnalysisRun, summary: Dict[str, Any]) -> ReportResponse:
    """Builds complete printable investigation report structure."""
    timeline = build_timeline_for_case(case, run)
    comparison = build_comparison_for_case(case, run)
    integrity_resp = verify_case_integrity(case, run)
    integrity = integrity_resp.model_dump()

    audit_summary = [
        {
            "id": ev.id,
            "action": ev.action,
            "actor": ev.actor,
            "created_at": ev.created_at.isoformat(),
            "details": ev.details_json,
        }
        for ev in (case.audit_events or [])[:15]
    ]

    records_reviewed = [
        {
            "id": r.id,
            "source_reference": r.source_reference,
            "record_type": r.record_type.value if hasattr(r.record_type, "value") else str(r.record_type),
            "survey_series": r.survey_series.value if r.survey_series else "N/A",
            "dag_no": r.dag_no or "N/A",
            "khatian_no": r.khatian_no or "",
            "deed_no": r.deed_no or "",
            "area": _format_record_area(r.area_value, r.area_unit, r.area_original),
            "date": r.registration_date.isoformat() if r.registration_date else (r.record_date.isoformat() if r.record_date else "Not supplied"),
        }
        for r in case.records
        if not r.is_archived
    ]

    rules_run = [
        {
            "code": r["code"],
            "name": r["name"],
            "category": r["category"],
            "limitations": r["limitations"],
        }
        for r in RULES_CATALOG
    ]

    metadata = ReportMetadata(
        generated_at=datetime.now(timezone.utc),
        rule_version=run.rule_version,
        run_id=run.id,
        input_hash=run.input_hash,
        as_of_date=(case.config_json or {}).get("reference_date") or date.today().isoformat(),
        reviewer="Local session (no login)",
        config_snapshot=run.config_snapshot_json or {},
        is_stale=run.is_stale,
        provenance=case.provenance.value if hasattr(case.provenance, "value") else str(case.provenance),
        sample_data_notice=(
            "Fictional demonstration records; no real parties or parcels are represented."
            if (case.provenance.value if hasattr(case.provenance, "value") else str(case.provenance)) == Provenance.SYNTHETIC.value
            else "User-entered records; values are not independently authenticated. Store and share with care."
        ),
    )

    disclaimer = (
        "JomiTrace screens entered metadata for discrepancies. No official system was queried. "
        "Results do not establish legal title or document authenticity and do not replace certified records or field verification."
    )

    parties_reviewed = [
        {
            "label": p.label,
            "aliases": [{"text": a.alias_text, "confirmed": a.confirmed_by_reviewer} for a in p.aliases],
            "identity_status": "Case-local label; identity is not authenticated by this prototype.",
        }
        for p in case.parties
    ]
    crosswalks_reviewed = [
        {
            "from": f"{c.series_a.value if hasattr(c.series_a, 'value') else c.series_a} {c.dag_a}",
            "to": f"{c.series_b.value if hasattr(c.series_b, 'value') else c.series_b} {c.dag_b}",
            "status": "confirmed" if c.confirmed_by_reviewer else "unconfirmed",
            "basis_note": c.basis_note,
        }
        for c in case.crosswalks
    ]

    return ReportResponse(
        metadata=metadata,
        case=case,  # SQLAlchemy model serialized by Pydantic from_attributes
        summary=summary,
        records_reviewed=records_reviewed,
        parties_reviewed=parties_reviewed,
        crosswalks_reviewed=crosswalks_reviewed,
        rules_run=rules_run,
        findings=run.findings,
        timeline=timeline.nodes,
        checklist=case.checklist_items,
        comparison=comparison,
        integrity=integrity,
        audit_summary=audit_summary,
        disclaimer=disclaimer,
    )
