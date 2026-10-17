"""Comprehensive unit tests for JomiTrace deterministic rule engine and scenarios S1-S8."""
import json
import os
from datetime import date
from pathlib import Path
import pytest

from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    CrosswalkSnapshot,
    EventSnapshot,
    Finding,
    PartyAliasSnapshot,
    PartySnapshot,
    RecordSnapshot,
    RuleCategory,
    RuleStatus,
)
from app.rules.area import (
    compare_areas,
    is_regional_unit,
    normalize_area_to_sqft,
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
from app.rules.engine import (
    compute_case_summary,
    compute_input_hash,
    run_all,
    snapshot_from_dict,
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def load_fixture(name: str) -> CaseSnapshot:
    path = FIXTURES_DIR / f"{name}.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return snapshot_from_dict(data)

# -----------------------------------------------------------------------------
# 1. Area Normalization Unit Tests
# -----------------------------------------------------------------------------

def test_area_exact_normalization():
    """Verify exact unit factors: decimal, acre, sq ft, sq m, hectare."""
    # 1 decimal = 435.6 sq ft
    assert normalize_area_to_sqft(1.0, "decimal") == 435.6
    assert normalize_area_to_sqft(10.0, "shotok") == 4356.0
    # 1 acre = 43560 sq ft
    assert normalize_area_to_sqft(1.0, "acre") == 43560.0
    # 1 sq ft = 1.0 sq ft
    assert normalize_area_to_sqft(100.0, "sq ft") == 100.0
    # 1 sq m = 10.7639 sq ft
    assert normalize_area_to_sqft(10.0, "sq m") == 107.639
    # 1 hectare = 107,639.1 sq ft
    assert normalize_area_to_sqft(1.0, "hectare") == 107639.1

def test_area_regional_unit_requires_basis():
    """Regional units (katha, bigha) must return None unless basis is explicitly configured."""
    assert is_regional_unit("katha") is True
    assert is_regional_unit("bigha") is True
    assert is_regional_unit("decimal") is False

    # Unset config -> None
    cfg_unset = CaseConfig(katha_sqft=None, bigha_sqft=None)
    assert normalize_area_to_sqft(5.0, "katha", cfg_unset) is None
    assert normalize_area_to_sqft(1.0, "bigha", cfg_unset) is None

    # Config set with regional basis: 1 katha = 720 sq ft (standard Dhaka basis)
    cfg_set = CaseConfig(katha_sqft=720.0)
    assert normalize_area_to_sqft(2.0, "katha", cfg_set) == 1440.0
    # 1 bigha = 20 katha = 14400 sq ft
    assert normalize_area_to_sqft(1.0, "bigha", cfg_set) == 14400.0

def test_compare_areas_tolerance():
    """Verify pairwise area comparison and percentage difference calculation."""
    # 30 decimal = 13068.0 sq ft. Compare against 13068.0 sq ft -> 0% diff
    sq_a, sq_b, diff_pct, within = compare_areas(30.0, "decimal", 13068.0, "sq ft")
    assert diff_pct == 0.0
    assert within is True

    # 30 decimal vs 33.6 decimal -> diff_pct = (3.6 / 33.6) * 100 = 10.71%
    cfg = CaseConfig(area_tolerance_pct=1.0)
    _, _, diff_pct, within = compare_areas(30.0, "decimal", 33.6, "decimal", cfg)
    assert diff_pct > 10.0
    assert within is False

# -----------------------------------------------------------------------------
# 2. Rule JT-R01: Plot Reference Unit Tests
# -----------------------------------------------------------------------------

def test_r01_same_series_different_dag_conflict():
    rec1 = RecordSnapshot(id="r1", record_type="deed", source_reference="Deed 1", survey_series="RS", dag_no="100")
    rec2 = RecordSnapshot(id="r2", record_type="deed", source_reference="Deed 2", survey_series="RS", dag_no="101")
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec1, rec2])
    findings = check_plot_reference(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.CONFLICT_DETECTED.value
    assert "100" in findings[0].explanation and "101" in findings[0].explanation

def test_r01_cross_series_with_unconfirmed_crosswalk():
    rec1 = RecordSnapshot(id="r1", record_type="khatian", source_reference="Khatian 1", survey_series="RS", dag_no="140")
    rec2 = RecordSnapshot(id="r2", record_type="deed", source_reference="Deed 1", survey_series="BS", dag_no="285")
    cw = CrosswalkSnapshot(id="cw1", series_a="RS", dag_a="140", series_b="BS", dag_b="285", confirmed_by_reviewer=False)
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec1, rec2], crosswalks=[cw])
    findings = check_plot_reference(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.REVIEW_REQUIRED.value
    assert "awaiting reviewer confirmation" in findings[0].explanation

def test_r01_cross_series_with_confirmed_crosswalk():
    rec1 = RecordSnapshot(id="r1", record_type="khatian", source_reference="Khatian 1", survey_series="RS", dag_no="140")
    rec2 = RecordSnapshot(id="r2", record_type="deed", source_reference="Deed 1", survey_series="BS", dag_no="285")
    cw = CrosswalkSnapshot(id="cw1", series_a="RS", dag_a="140", series_b="BS", dag_b="285", confirmed_by_reviewer=True)
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec1, rec2], crosswalks=[cw])
    findings = check_plot_reference(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.NO_INCONSISTENCY_FOUND.value

# -----------------------------------------------------------------------------
# 3. Rule JT-R02: Recorded Area Unit Tests
# -----------------------------------------------------------------------------

def test_r02_missing_area_is_insufficient():
    rec1 = RecordSnapshot(id="r1", record_type="deed", source_reference="Deed 1", area_value=None, area_unit=None)
    rec2 = RecordSnapshot(id="r2", record_type="deed", source_reference="Deed 2", area_value=20.0, area_unit="decimal")
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec1, rec2])
    findings = check_recorded_area(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.INSUFFICIENT_INFORMATION.value

# -----------------------------------------------------------------------------
# 4. Rule JT-R03: Chain Continuity Unit Tests
# -----------------------------------------------------------------------------

def test_r03_first_event_gap_marker():
    ev = EventSnapshot(id="e1", source_record_id="r1", sequence_index=0, from_party_id="p1", to_party_id="p2")
    p1 = PartySnapshot(id="p1", label="P1")
    p2 = PartySnapshot(id="p2", label="P2")
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", events=[ev], parties=[p1, p2])
    findings = check_chain_continuity(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.REVIEW_REQUIRED.value
    assert "predecessor" in findings[0].summary.lower()

# -----------------------------------------------------------------------------
# 5. Rule JT-R06: Date Order Unit Tests
# -----------------------------------------------------------------------------

def test_r06_ignores_document_date_when_only_registration_dates_are_screened():
    rec = RecordSnapshot(
        id="r1",
        record_type="deed",
        source_reference="Deed 1",
        record_date=date(2021, 5, 20),
        registration_date=date(2021, 5, 10),  # the rule intentionally ignores document-date comparison
    )
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec])
    findings = check_date_order(snap, CaseConfig())

    assert not any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in findings)
    assert all("registration date" in f.limitations.lower() for f in findings)

def test_r06_future_date_conflict():
    rec = RecordSnapshot(
        id="r1",
        record_type="deed",
        source_reference="Deed 1",
        registration_date=date(2035, 1, 1),
    )
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec], config=CaseConfig(reference_date=date(2026, 1, 1)))
    findings = check_date_order(snap, snap.config)

    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in findings)
    assert any("future" in f.summary.lower() for f in findings)

def test_r07_no_mutation_records_is_one_insufficient_result():
    deeds = [
        RecordSnapshot(id="d1", record_type="deed", source_reference="Deed 1", deed_no="1", registration_date=date(2020, 1, 1)),
        RecordSnapshot(id="d2", record_type="deed", source_reference="Deed 2", deed_no="2", registration_date=date(2020, 2, 1)),
    ]
    snapshot = CaseSnapshot(case_id="c1", case_code="JT-1", records=deeds)
    findings = check_registration_mutation_link(snapshot, CaseConfig(reference_date=date(2026, 1, 1)))
    assert len(findings) == 1
    assert findings[0].status == RuleStatus.INSUFFICIENT_INFORMATION.value

def test_r07_missing_link_is_review_only_when_other_mutation_is_linked():
    deeds = [
        RecordSnapshot(id="d1", record_type="deed", source_reference="Deed 1", deed_no="1", registration_date=date(2020, 1, 1)),
        RecordSnapshot(id="d2", record_type="deed", source_reference="Deed 2", deed_no="2", registration_date=date(2020, 2, 1)),
    ]
    mutation = RecordSnapshot(
        id="m1", record_type="mutation", source_reference="Mutation 1", deed_no="1",
        registration_date=date(2020, 3, 1), owner_party_id="p1",
    )
    snapshot = CaseSnapshot(case_id="c1", case_code="JT-1", records=deeds + [mutation])
    findings = check_registration_mutation_link(snapshot, CaseConfig(reference_date=date(2026, 1, 1)))
    unlinked = [f for f in findings if f.status == RuleStatus.REVIEW_REQUIRED.value]
    assert len(unlinked) == 1
    assert "Deed 2" in unlinked[0].summary

# -----------------------------------------------------------------------------
# 6. Rule JT-R08: Rapid Re-Transfer Unit Tests
# -----------------------------------------------------------------------------

def test_r08_rapid_transfer_never_conflict():
    ev1 = EventSnapshot(id="e1", sequence_index=0, event_date=date(2021, 1, 1), from_party_id="p1", to_party_id="p2")
    ev2 = EventSnapshot(id="e2", sequence_index=1, event_date=date(2021, 1, 15), from_party_id="p2", to_party_id="p3")
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", events=[ev1, ev2])
    findings = check_rapid_transfer(snap, CaseConfig(rapid_transfer_days=30))

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.REVIEW_REQUIRED.value
    # Assert R08 never produces conflict_detected
    assert findings[0].status != RuleStatus.CONFLICT_DETECTED.value

@pytest.mark.parametrize(
    ("interval_days", "expected_status"),
    [
        (0, RuleStatus.REVIEW_REQUIRED.value),
        (30, RuleStatus.REVIEW_REQUIRED.value),
        (31, RuleStatus.NO_INCONSISTENCY_FOUND.value),
    ],
)
def test_r08_rapid_transfer_window_boundaries(interval_days, expected_status):
    start = date(2024, 1, 1)
    end = date.fromordinal(start.toordinal() + interval_days)
    snap = CaseSnapshot(
        case_id="c1",
        case_code="JT-BOUNDARY",
        events=[
            EventSnapshot(id="e1", sequence_index=0, event_date=start, from_party_id="p1", to_party_id="p2"),
            EventSnapshot(id="e2", sequence_index=1, event_date=end, from_party_id="p2", to_party_id="p3"),
        ],
    )

    findings = check_rapid_transfer(snap, CaseConfig(rapid_transfer_days=30))

    assert findings[0].status == expected_status
    assert findings[0].status != RuleStatus.CONFLICT_DETECTED.value

def test_rule_engine_backfills_citations_for_every_source_record():
    """All fixture findings tied to records must cite a source record and compared field."""
    for scenario_id in ("S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"):
        findings = run_all(load_fixture(scenario_id))
        for finding in findings:
            if not finding.source_record_ids:
                continue
            cited_ids = {e.source_record_id for e in finding.evidence}
            assert set(finding.source_record_ids).issubset(cited_ids), (scenario_id, finding.rule_code, finding.summary)
            assert all(e.field_name for e in finding.evidence)

# -----------------------------------------------------------------------------
# 7. Rule JT-R10: Document Reuse Unit Tests
# -----------------------------------------------------------------------------

def test_r10_same_hash_different_parties_conflict():
    rec1 = RecordSnapshot(id="r1", record_type="deed", source_reference="Deed 1", document_sha256="abc123hash", seller_party_id="p1", buyer_party_id="p2")
    rec2 = RecordSnapshot(id="r2", record_type="deed", source_reference="Deed 2", document_sha256="abc123hash", seller_party_id="p3", buyer_party_id="p4")
    snap = CaseSnapshot(case_id="c1", case_code="JT-1", records=[rec1, rec2])
    findings = check_document_reuse(snap, CaseConfig())

    assert len(findings) == 1
    assert findings[0].status == RuleStatus.CONFLICT_DETECTED.value
    assert "identical document hash" in findings[0].summary.lower()

# -----------------------------------------------------------------------------
# 8. Scenario Fixtures S1 through S8 Test Suite
# -----------------------------------------------------------------------------

def test_scenario_s1_chain_with_missing_mutation_record():
    """No mutation records produce one case-level insufficient R07 result, not per-deed reviews."""
    snap = load_fixture("S1")
    snap.records = [record for record in snap.records if record.record_type != "mutation"]
    findings = run_all(snap)

    summary = compute_case_summary(findings)
    assert summary["counts"][RuleStatus.CONFLICT_DETECTED.value] == 0
    r07 = [f for f in findings if f.rule_code == "JT-R07"]
    assert len(r07) == 1
    assert r07[0].status == RuleStatus.INSUFFICIENT_INFORMATION.value
    assert not any(f.rule_code == "JT-R09" and "mutation" in f.summary.lower() for f in findings)
    assert summary["banner_status"] == RuleStatus.INSUFFICIENT_INFORMATION.value

def test_scenario_s2_duplicate_sale():
    """S2 isolates duplicate full-holding sales; three related conflict checks describe one issue."""
    snap = load_fixture("S2")
    findings = run_all(snap)

    r04_findings = [f for f in findings if f.rule_code == "JT-R04"]
    r03_findings = [f for f in findings if f.rule_code == "JT-R03"]

    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in r04_findings)
    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in r03_findings)
    assert not any(f.status == RuleStatus.INSUFFICIENT_INFORMATION.value for f in findings)
    summary = compute_case_summary(findings)
    conflict_checks = [f for f in findings if f.status == RuleStatus.CONFLICT_DETECTED.value]
    assert {f.rule_code for f in conflict_checks} == {"JT-R03", "JT-R04", "JT-R05"}
    assert summary["issue_count"] == 1
    assert summary["check_count"] == 3
    initial_chain_pass = next(f for f in r03_findings if f.status == RuleStatus.NO_INCONSISTENCY_FOUND.value)
    assert any(e.field_name == "owner_party_id" and e.reference_label == "SA Khatian 42" for e in initial_chain_pass.evidence)

def test_scenario_s3_over_conveyance_and_partial_sale():
    """S3: Seller owns 50 decimal; deeds convey 30 and 32. Expected: R05 conflict; R04 review required (not conflict); partial sale respected."""
    snap = load_fixture("S3")
    findings = run_all(snap)

    r05_findings = [f for f in findings if f.rule_code == "JT-R05"]
    r04_findings = [f for f in findings if f.rule_code == "JT-R04"]

    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in r05_findings)
    # R04 must be REVIEW_REQUIRED, NOT conflict_detected!
    assert all(f.status != RuleStatus.CONFLICT_DETECTED.value for f in r04_findings)
    assert any(f.status == RuleStatus.REVIEW_REQUIRED.value for f in r04_findings)

def test_scenario_s4_unit_conversion():
    """S4: Decimal vs sq ft equal; second deed differs by 12%. Expected: R02 no_inconsistency for first pair, conflict for second."""
    snap = load_fixture("S4")
    findings = run_all(snap)

    r02_findings = [f for f in findings if f.rule_code == "JT-R02"]
    assert any(f.status == RuleStatus.NO_INCONSISTENCY_FOUND.value for f in r02_findings)
    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in r02_findings)
    assert not any(f.status == RuleStatus.INSUFFICIENT_INFORMATION.value for f in findings)

def test_scenario_s5_chain_gap():
    """S5: Event 3 seller never appears as buyer earlier. Expected: R03 review required (gap marker on timeline)."""
    snap = load_fixture("S5")
    findings = run_all(snap)

    r03_findings = [f for f in findings if f.rule_code == "JT-R03"]
    # Check that the gap seller produces review_required
    gap_findings = [f for f in r03_findings if "no documented prior acquisition" in f.summary.lower()]
    assert len(gap_findings) >= 1
    assert gap_findings[0].status == RuleStatus.REVIEW_REQUIRED.value

def test_scenario_s6_mutation_mismatch_and_rapid_transfer():
    """S6: Mutation names different buyer, 20 days later re-transferred. Expected: R07(b) conflict; R08 review required."""
    snap = load_fixture("S6")
    findings = run_all(snap)

    r07_findings = [f for f in findings if f.rule_code == "JT-R07"]
    r08_findings = [f for f in findings if f.rule_code == "JT-R08"]

    assert any(f.status == RuleStatus.CONFLICT_DETECTED.value and "beneficiary mismatch" in f.summary.lower() for f in r07_findings)
    assert any(f.status == RuleStatus.REVIEW_REQUIRED.value and "rapid re-transfer" in f.summary.lower() for f in r08_findings)

def test_scenario_s7_blank_fields():
    """S7: Fields blank. Expected: R09 explains completeness limits; no blank is treated as a match."""
    snap = load_fixture("S7")
    findings = run_all(snap)

    r09_findings = [f for f in findings if f.rule_code == "JT-R09"]
    assert any(f.status == RuleStatus.INSUFFICIENT_INFORMATION.value for f in r09_findings)
    assert any("limit completeness" in f.explanation.lower() for f in r09_findings)
    assert all("blocked_rules" not in f.observed_values for f in r09_findings)
    # Ensure no rule treats blank fields as a positive match
    assert not any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in findings)

def test_scenario_s8_cross_series_unmapped():
    """S8: RS khatian vs BS deed, no crosswalk. Expected: R01 insufficient (not conflict)."""
    snap = load_fixture("S8")
    findings = run_all(snap)

    r01_findings = [f for f in findings if f.rule_code == "JT-R01"]
    assert any(f.status == RuleStatus.INSUFFICIENT_INFORMATION.value for f in r01_findings)
    # Must NOT produce conflict
    assert all(f.status != RuleStatus.CONFLICT_DETECTED.value for f in r01_findings)

# -----------------------------------------------------------------------------
# 9. Determinism and Reproducibility Test
# -----------------------------------------------------------------------------

def test_engine_determinism_across_scenarios():
    """Executing the engine twice on identical inputs must produce byte-for-byte identical findings."""
    for fixture_name in ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]:
        snap1 = load_fixture(fixture_name)
        snap2 = load_fixture(fixture_name)

        findings1 = run_all(snap1)
        findings2 = run_all(snap2)

        json1 = json.dumps([f.to_dict() for f in findings1], sort_keys=True)
        json2 = json.dumps([f.to_dict() for f in findings2], sort_keys=True)

        assert json1 == json2, f"Engine non-deterministic on {fixture_name}"

# -----------------------------------------------------------------------------
# 10. Forbidden Words Safety Scan
# -----------------------------------------------------------------------------

FORBIDDEN_WORDS = ["fraud", "forged", "illegal", "safe", "verified owner", "forensic", "verdict", "tamper"]

def test_forbidden_words_in_all_findings():
    """Ensure no rule output or finding explanation contains prohibited legal verdict terms."""
    for fixture_name in ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]:
        snap = load_fixture(fixture_name)
        findings = run_all(snap)

        for f in findings:
            combined_text = f"{f.summary} {f.explanation} {f.limitations} {f.recommended_next_step}".lower()
            for forbidden in FORBIDDEN_WORDS:
                assert forbidden not in combined_text, (
                    f"Forbidden word '{forbidden}' detected in finding [{f.rule_code}] {f.summary} "
                    f"for fixture {fixture_name}"
                )
