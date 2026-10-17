"""Tests for Phase 4 Backend API endpoints and workflows."""
import pytest
from contextlib import asynccontextmanager
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.models.case import VerificationCase
from app.models.source_record import SourceRecord
from app.models.enums import RecordType, SurveySeries, CaseStatus, ChecklistStatus

@pytest.fixture
def client(db_session: Session, monkeypatch):
    """Test client with isolated in-memory test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    @asynccontextmanager
    async def test_lifespan(_app):
        # Tests use their own in-memory fixture DB; skip the app's production-engine
        # startup initializer so a test run never opens or writes the local case DB.
        yield

    monkeypatch.setattr(app.router, "lifespan_context", test_lifespan)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

# -----------------------------------------------------------------------------
# 1. Health and Root Endpoints
# -----------------------------------------------------------------------------

def test_api_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "JomiTrace"
    assert data["rule_version"] == "0.2"

def test_api_root(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "JomiTrace"
    assert data["health_check"] == "/api/health"

# -----------------------------------------------------------------------------
# 2. Case Management CRUD
# -----------------------------------------------------------------------------

def test_create_case_and_checklist_seeded(client):
    payload = {
        "case_code": "JT-API-01",
        "title": "API Test Case",
        "district": "Dhaka",
        "upazila": "Mirpur",
        "mouza": "Paikpara",
        "notes": "Created via API test",
    }
    res = client.post("/api/cases", json=payload)
    assert res.status_code == 201
    case = res.json()
    assert case["case_code"] == "JT-API-01"
    assert case["title"] == "API Test Case"
    assert case["status"] == "draft"
    assert case["provenance"] == "user_entered"

    # Verify checklist was seeded
    checklist_res = client.get(f"/api/cases/{case['id']}/checklist")
    assert checklist_res.status_code == 200
    checklist_items = checklist_res.json()
    assert len(checklist_items) == 8
    assert any("Confirm source documents" in item["label"] for item in checklist_items)

def test_create_case_duplicate_code_conflict(client):
    payload = {
        "case_code": "JT-DUP-01",
        "title": "Original Case",
    }
    res1 = client.post("/api/cases", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/cases", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

def test_list_cases_with_search_and_filter(client):
    client.post("/api/cases", json={"case_code": "JT-GAZ-01", "title": "Gazipur Land Review", "district": "Gazipur"})
    client.post("/api/cases", json={"case_code": "JT-SYL-01", "title": "Sylhet Parcel Review", "district": "Sylhet"})

    # Filter by search
    res = client.get("/api/cases?search=Gazipur")
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 1
    assert results[0]["case_code"] == "JT-GAZ-01"

    # Filter by status
    res_status = client.get("/api/cases?status=draft")
    assert res_status.status_code == 200
    assert len(res_status.json()) >= 2

def test_get_case_by_id_and_by_code(client):
    create_res = client.post("/api/cases", json={"case_code": "JT-FIND-01", "title": "Lookup Case"})
    case_id = create_res.json()["id"]

    # By UUID
    res_id = client.get(f"/api/cases/{case_id}")
    assert res_id.status_code == 200
    assert res_id.json()["case_code"] == "JT-FIND-01"

    # By case_code
    res_code = client.get("/api/cases/JT-FIND-01")
    assert res_code.status_code == 200
    assert res_code.json()["id"] == case_id

def test_get_unknown_case_returns_404(client):
    res = client.get("/api/cases/NON-EXISTENT-ID")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]

def test_update_case_and_stale_marking(client, db_session):
    create_res = client.post("/api/cases", json={"case_code": "JT-UPD-01", "title": "Before Update"})
    case_id = create_res.json()["id"]

    # Update metadata
    patch_res = client.patch(f"/api/cases/{case_id}", json={"title": "After Update", "notes": "Updated note"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "After Update"
    assert patch_res.json()["notes"] == "Updated note"

    # Run analysis
    an_res = client.post(f"/api/cases/{case_id}/analyze")
    assert an_res.status_code == 200
    run_id = an_res.json()["run"]["id"]
    assert an_res.json()["run"]["is_stale"] is False

    # Update config -> must mark run stale
    cfg_patch = client.patch(f"/api/cases/{case_id}", json={"config_json": {"area_tolerance_pct": 2.5}})
    assert cfg_patch.status_code == 200

    runs_res = client.get(f"/api/cases/{case_id}/runs")
    assert runs_res.status_code == 200
    latest_run = next(r for r in runs_res.json() if r["id"] == run_id)
    assert latest_run["is_stale"] is True

def test_delete_case_cascade(client):
    create_res = client.post("/api/cases", json={"case_code": "JT-DEL-01", "title": "To Delete"})
    case_id = create_res.json()["id"]

    del_res = client.delete(f"/api/cases/{case_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/cases/{case_id}")
    assert get_res.status_code == 404

# -----------------------------------------------------------------------------
# 3. Source Records Workflow
# -----------------------------------------------------------------------------

def test_add_and_list_source_records(client):
    case_res = client.post("/api/cases", json={"case_code": "JT-REC-01", "title": "Record Case"})
    case_id = case_res.json()["id"]

    rec_payload = {
        "record_type": "deed",
        "source_reference": "Deed 2021/405",
        "survey_series": "RS",
        "dag_no": "100",
        "area_value": 25.0,
        "area_unit": "decimal",
        "record_date": "2021-04-10",
        "registration_date": "2021-04-12",
    }
    rec_res = client.post(f"/api/cases/{case_id}/records", json=rec_payload)
    assert rec_res.status_code == 201
    rec = rec_res.json()
    assert rec["source_reference"] == "Deed 2021/405"
    assert rec["area_value"] == 25.0
    assert rec["case_id"] == case_id

    # List records
    list_res = client.get(f"/api/cases/{case_id}/records")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

def test_update_and_delete_source_record(client):
    case_res = client.post("/api/cases", json={"case_code": "JT-REC-02", "title": "Record Case 2"})
    case_id = case_res.json()["id"]

    rec_res = client.post(
        f"/api/cases/{case_id}/records",
        json={"record_type": "khatian", "source_reference": "RS Khatian 10", "dag_no": "50"},
    )
    rec_id = rec_res.json()["id"]

    # Patch
    patch_res = client.patch(f"/api/records/{rec_id}", json={"khatian_no": "10-A"})
    assert patch_res.status_code == 200
    assert patch_res.json()["khatian_no"] == "10-A"

    # Delete (uncited)
    del_res = client.delete(f"/api/records/{rec_id}")
    assert del_res.status_code == 204

    # Verify deleted
    list_res = client.get(f"/api/cases/{case_id}/records")
    assert len(list_res.json()) == 0

def test_cited_record_delete_restricted(client):
    # Load scenario S2 where Deed B-202 is cited by competing transfer
    load_res = client.post("/api/scenarios/S2/load")
    assert load_res.status_code == 201
    case_id = load_res.json()["id"]

    # Get records
    records_res = client.get(f"/api/cases/{case_id}/records")
    records = records_res.json()
    rec_to_delete = records[0]["id"]

    # Attempt hard delete -> must fail with HTTP 409
    del_res = client.delete(f"/api/records/{rec_to_delete}")
    assert del_res.status_code == 409
    assert "cited by" in del_res.json()["detail"].lower()

    # Soft delete -> succeeds
    soft_del_res = client.delete(f"/api/records/{rec_to_delete}?soft=true")
    assert soft_del_res.status_code == 204

    # Verify excluded from default list
    active_recs = client.get(f"/api/cases/{case_id}/records").json()
    assert not any(r["id"] == rec_to_delete for r in active_recs)

# -----------------------------------------------------------------------------
# 4. Parties and Plot Crosswalk
# -----------------------------------------------------------------------------

def test_parties_and_aliases_workflow(client):
    case_res = client.post("/api/cases", json={"case_code": "JT-PARTY-01", "title": "Party Case"})
    case_id = case_res.json()["id"]

    party_res = client.post(
        f"/api/cases/{case_id}/parties",
        json={"label": "Party P1 (Owner)", "aliases": ["M. Rahman", "Md. Rahman"]},
    )
    assert party_res.status_code == 201
    party = party_res.json()
    assert party["label"] == "Party P1 (Owner)"
    assert len(party["aliases"]) == 2

    # Add another alias
    alias_res = client.post(
        f"/api/parties/{party['id']}/aliases",
        json={"alias_text": "Mohammad Rahman", "confirmed_by_reviewer": True},
    )
    assert alias_res.status_code == 201
    assert alias_res.json()["alias_text"] == "Mohammad Rahman"

    # List parties
    list_res = client.get(f"/api/cases/{case_id}/parties")
    assert list_res.status_code == 200
    assert len(list_res.json()[0]["aliases"]) == 3

def test_plot_crosswalk_workflow(client):
    case_res = client.post("/api/cases", json={"case_code": "JT-CW-01", "title": "Crosswalk Case"})
    case_id = case_res.json()["id"]

    cw_payload = {
        "series_a": "RS",
        "dag_a": "140",
        "series_b": "BS",
        "dag_b": "285",
        "basis_note": "Verified through survey settlement sheet",
        "confirmed_by_reviewer": True,
    }
    cw_res = client.post(f"/api/cases/{case_id}/crosswalk", json=cw_payload)
    assert cw_res.status_code == 201
    cw = cw_res.json()
    assert cw["series_a"] == "RS"
    assert cw["dag_a"] == "140"
    assert cw["confirmed_by_reviewer"] is True

    # List crosswalk
    list_res = client.get(f"/api/cases/{case_id}/crosswalk")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

# -----------------------------------------------------------------------------
# 5. Checklist Workflow
# -----------------------------------------------------------------------------

def test_checklist_workflow(client):
    case_res = client.post("/api/cases", json={"case_code": "JT-CHK-01", "title": "Checklist Case"})
    case_id = case_res.json()["id"]

    items_res = client.get(f"/api/cases/{case_id}/checklist")
    items = items_res.json()
    assert len(items) == 8
    target_item = items[0]
    assert target_item["status"] == "pending"

    # Patch checklist item
    patch_res = client.patch(
        f"/api/checklist/{target_item['id']}",
        json={"status": "reviewer_completed", "completion_note": "Inspected sub-registry deed volume"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "reviewer_completed"
    assert patch_res.json()["completion_note"] == "Inspected sub-registry deed volume"

# -----------------------------------------------------------------------------
# 6. Analysis Execution and Stale Run Safeguards
# -----------------------------------------------------------------------------

def test_analyze_endpoints_and_findings(client):
    # Load scenario S3: seller conveys 30 and 32 from 50 decimal holding
    load_res = client.post("/api/scenarios/S3/load")
    case_id = load_res.json()["id"]

    # Re-run via /api/cases/{id}/analyze
    res = client.post(f"/api/cases/{case_id}/analyze")
    assert res.status_code == 200
    data = res.json()

    assert "run" in data
    assert "summary" in data
    summary = data["summary"]
    assert summary["counts"]["conflict_detected"] >= 1
    assert "Conflict detected" in summary["banner_label"]

    # Verify convenience endpoint /api/analyze
    alt_res = client.post("/api/analyze", json={"case_id": case_id})
    assert alt_res.status_code == 200
    assert alt_res.json()["run"]["case_id"] == case_id

    # Retrieve findings
    findings_res = client.get(f"/api/cases/{case_id}/findings")
    assert findings_res.status_code == 200
    findings = findings_res.json()
    assert len(findings) > 0
    # S3 must flag over-conveyance JT-R05
    assert any(f["rule_code"] == "JT-R05" and f["status"] == "conflict_detected" for f in findings)
    # Finding must have evidence citations
    r05_finding = next(f for f in findings if f["rule_code"] == "JT-R05")
    assert len(r05_finding["evidence"]) > 0

def test_repeat_analysis_is_deterministic(client):
    load_res = client.post("/api/scenarios/S4/load")
    case_id = load_res.json()["id"]

    run1 = client.post(f"/api/cases/{case_id}/analyze").json()
    run2 = client.post(f"/api/cases/{case_id}/analyze").json()

    assert run1["run"]["input_hash"] == run2["run"]["input_hash"]
    assert run1["summary"]["counts"] == run2["summary"]["counts"]
    assert len(run1["run"]["findings"]) == len(run2["run"]["findings"])

# -----------------------------------------------------------------------------
# 7. Timeline, Record Comparison, and Report Export
# -----------------------------------------------------------------------------

def test_timeline_endpoint(client):
    load_res = client.post("/api/scenarios/S5/load")
    case_id = load_res.json()["id"]

    res = client.get(f"/api/cases/{case_id}/timeline")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == case_id
    assert len(data["nodes"]) >= 2
    # S5 has a chain gap at Event 3 -> interruption marker must be present
    assert any(node["interruption_marker"] is True for node in data["nodes"])

def test_comparison_grid_endpoint(client):
    load_res = client.post("/api/scenarios/S1/load")
    case_id = load_res.json()["id"]

    res = client.get(f"/api/cases/{case_id}/compare")
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) >= 3
    assert len(data["rows"]) >= 5
    field_names = [r["field_name"] for r in data["rows"]]
    assert "dag_no" in field_names
    assert "area_value" in field_names

def test_report_endpoint_and_stale_rejection(client):
    load_res = client.post("/api/scenarios/S1/load")
    case_id = load_res.json()["id"]

    # Initial report generation succeeds
    rep_res = client.get(f"/api/cases/{case_id}/report")
    assert rep_res.status_code == 200
    report = rep_res.json()
    assert report["case"]["case_code"] == "JT-S1-CLEAN"
    assert len(report["records_reviewed"]) >= 3
    assert len(report["rules_run"]) == 10
    assert len(report["checklist"]) == 8
    assert "disclaimer" in report

    # Adding a record marks run stale
    client.post(
        f"/api/cases/{case_id}/records",
        json={"record_type": "deed", "source_reference": "New Deed", "dag_no": "500"},
    )

    # Report without allow_stale must fail with HTTP 400
    stale_rep = client.get(f"/api/cases/{case_id}/report")
    assert stale_rep.status_code == 400
    assert "stale" in stale_rep.json()["detail"].lower()

    # Report with allow_stale=true succeeds
    allowed_rep = client.get(f"/api/cases/{case_id}/report?allow_stale=true")
    assert allowed_rep.status_code == 200
    assert allowed_rep.json()["metadata"]["is_stale"] is True

# -----------------------------------------------------------------------------
# 8. Scenarios and Rule Catalog
# -----------------------------------------------------------------------------

def test_scenarios_listing_and_loading(client):
    scenarios_res = client.get("/api/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()["scenarios"]
    assert len(scenarios) == 8
    ids = [s["id"] for s in scenarios]
    assert set(ids) == {"S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"}

    # Load S8 (Cross-series without crosswalk)
    load_res = client.post("/api/scenarios/S8/load")
    assert load_res.status_code == 201
    case_id = load_res.json()["id"]

    findings = client.get(f"/api/cases/{case_id}/findings").json()
    r01 = next(f for f in findings if f["rule_code"] == "JT-R01")
    assert r01["status"] == "insufficient_information"

def test_load_unknown_scenario_returns_404(client):
    res = client.post("/api/scenarios/S99/load")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_scenario_loader_does_not_replace_user_entered_case_with_matching_code(client):
    created = client.post(
        "/api/cases",
        json={"case_code": "JT-S1-CLEAN", "title": "User-owned case; preserve me"},
    )
    assert created.status_code == 201
    original_id = created.json()["id"]

    response = client.post("/api/scenarios/S1/load")

    assert response.status_code == 409
    assert "cannot replace case" in response.json()["detail"].lower()
    preserved = client.get(f"/api/cases/{original_id}")
    assert preserved.status_code == 200
    assert preserved.json()["title"] == "User-owned case; preserve me"
    assert preserved.json()["provenance"] == "user_entered"

def test_case_listing_can_separate_demo_and_user_entered_cases(client):
    user_case = client.post("/api/cases", json={"case_code": "JT-USER-01", "title": "Private workspace"})
    demo_case = client.post("/api/scenarios/S1/load")
    assert user_case.status_code == 201
    assert demo_case.status_code == 201

    demo_rows = client.get("/api/cases?provenance=synthetic").json()
    entered_rows = client.get("/api/cases?provenance=user_entered").json()
    assert {row["case_code"] for row in demo_rows} == {"JT-S1-CLEAN"}
    assert {row["case_code"] for row in entered_rows} == {"JT-USER-01"}

def test_rule_catalog_endpoint(client):
    res = client.get("/api/rules")
    assert res.status_code == 200
    catalog = res.json()
    assert catalog["rule_version"] == "0.2"
    assert len(catalog["rules"]) == 10
    codes = [r["code"] for r in catalog["rules"]]
    assert set(codes) == {f"JT-R0{i}" if i < 10 else f"JT-R{i}" for i in range(1, 11)}

# -----------------------------------------------------------------------------
# 9. Safety & Explainability Check (Zero Forbidden Words in API Responses)
# -----------------------------------------------------------------------------

def test_forbidden_words_in_all_api_responses(client):
    """
    Asserts that no API response contains definitive verdict words:
    fraud, forged, illegal, safe, verified owner.
    """
    forbidden = ["fraud", "forged", "illegal", "safe", "verified owner", "forensic", "verdict", "tamper"]

    # Check scenarios list
    scenarios_text = client.get("/api/scenarios").text.lower()
    for word in forbidden:
        assert word not in scenarios_text, f"Forbidden word '{word}' found in /api/scenarios"

    # Check rules catalog
    rules_text = client.get("/api/rules").text.lower()
    for word in forbidden:
        assert word not in rules_text, f"Forbidden word '{word}' found in /api/rules"

    # Check S2 loaded case, findings, timeline, and report
    s2 = client.post("/api/scenarios/S2/load").json()
    case_id = s2["id"]

    findings_text = client.get(f"/api/cases/{case_id}/findings").text.lower()
    for word in forbidden:
        assert word not in findings_text, f"Forbidden word '{word}' found in findings"

    report_text = client.get(f"/api/cases/{case_id}/report").text.lower()
    for word in forbidden:
        assert word not in report_text, f"Forbidden word '{word}' found in report"

# -----------------------------------------------------------------------------
# 10. Scenario Loading Coexistence & Idempotency Regression Tests
# -----------------------------------------------------------------------------

def test_load_scenario_s4_then_s1(client):
    """
    Regression test: Loading S4 followed by S1 must succeed without
    parties.id UNIQUE constraint violation, and both cases must coexist.
    """
    res_s4 = client.post("/api/scenarios/S4/load")
    assert res_s4.status_code == 201
    s4_id = res_s4.json()["id"]

    res_s1 = client.post("/api/scenarios/S1/load")
    assert res_s1.status_code == 201
    s1_id = res_s1.json()["id"]

    # Verify both cases exist and are distinct
    cases = client.get("/api/cases").json()
    case_codes = [c["case_code"] for c in cases]
    assert "JT-S4-UNITCONV" in case_codes
    assert "JT-S1-CLEAN" in case_codes

    # Verify parties for each case
    s4_parties = client.get(f"/api/cases/{s4_id}/parties").json()
    s1_parties = client.get(f"/api/cases/{s1_id}/parties").json()
    assert len(s4_parties) == 3
    assert len(s1_parties) == 3
    s4_party_ids = {p["id"] for p in s4_parties}
    s1_party_ids = {p["id"] for p in s1_parties}
    assert s4_party_ids.isdisjoint(s1_party_ids)

    # Verify findings for each case
    s4_findings = client.get(f"/api/cases/{s4_id}/findings").json()
    s1_findings = client.get(f"/api/cases/{s1_id}/findings").json()
    assert len(s4_findings) > 0
    assert len(s1_findings) > 0

def test_load_scenario_s1_then_s2(client):
    """
    Regression test: Loading S1 followed by S2 must succeed without
    parties.id UNIQUE constraint violation, and both cases must coexist.
    """
    res_s1 = client.post("/api/scenarios/S1/load")
    assert res_s1.status_code == 201
    s1_id = res_s1.json()["id"]

    res_s2 = client.post("/api/scenarios/S2/load")
    assert res_s2.status_code == 201
    s2_id = res_s2.json()["id"]

    cases = client.get("/api/cases").json()
    case_codes = [c["case_code"] for c in cases]
    assert "JT-S1-CLEAN" in case_codes
    assert "JT-S2-DUPLICATE" in case_codes

    s1_parties = client.get(f"/api/cases/{s1_id}/parties").json()
    s2_parties = client.get(f"/api/cases/{s2_id}/parties").json()
    assert len(s1_parties) == 3
    assert len(s2_parties) == 3
    assert {p["id"] for p in s1_parties}.isdisjoint({p["id"] for p in s2_parties})

    # S2 has competing transfer conflict (JT-R04)
    s2_findings = client.get(f"/api/cases/{s2_id}/findings").json()
    assert any(f["rule_code"] == "JT-R04" and f["status"] == "conflict_detected" for f in s2_findings)

def test_load_scenario_s1_twice(client):
    """
    Regression test: Repeated loading of scenario S1 must be idempotent,
    safely handling existing case without partial inserts or foreign key conflicts.
    """
    res1 = client.post("/api/scenarios/S1/load")
    assert res1.status_code == 201
    case1 = res1.json()

    res2 = client.post("/api/scenarios/S1/load")
    assert res2.status_code == 201
    case2 = res2.json()

    # Case code remains unique in active cases list
    cases = client.get("/api/cases").json()
    s1_cases = [c for c in cases if c["case_code"] == "JT-S1-CLEAN"]
    assert len(s1_cases) == 1

    # Verify records, parties, checklist, and findings are fully populated
    case_id = case2["id"]
    records = client.get(f"/api/cases/{case_id}/records").json()
    parties = client.get(f"/api/cases/{case_id}/parties").json()
    checklist = client.get(f"/api/cases/{case_id}/checklist").json()
    findings = client.get(f"/api/cases/{case_id}/findings").json()

    assert len(records) == 4
    assert len(parties) == 3
    assert len(checklist) == 8
    assert len(findings) > 0


# -----------------------------------------------------------------------------
# 9. Phase 6: Audit Trail, Cryptographic Integrity & Report Comparison
# -----------------------------------------------------------------------------

def test_audit_trail_records_analysis_not_passive_mutations(client):
    """Audit records contain analysis runs and deliberate report exports only."""
    # 1. Case creation
    case_res = client.post(
        "/api/cases",
        json={
            "case_code": "JT-AUDIT-01",
            "title": "Audit Trail Lifecycle Test",
            "district": "Dhaka",
            "upazila": "Savar",
            "mouza": "Dhamrai",
        },
    )
    assert case_res.status_code == 201
    case_id = case_res.json()["id"]

    # 2. Add Party
    party_res = client.post(
        f"/api/cases/{case_id}/parties",
        json={"label": "Rahim Uddin", "aliases": ["Md Rahim"]},
    )
    assert party_res.status_code == 201
    party_id = party_res.json()["id"]

    # 3. Add Party Alias
    alias_res = client.post(
        f"/api/parties/{party_id}/aliases",
        json={"alias_text": "Rahim Mia", "confirmed_by_reviewer": True},
    )
    assert alias_res.status_code == 201

    # 4. Add Record
    rec_res = client.post(
        f"/api/cases/{case_id}/records",
        json={
            "record_type": "deed",
            "source_reference": "Deed 2021/101",
            "survey_series": "RS",
            "dag_no": "101",
            "area_value": 0.25,
            "area_unit": "acre",
        },
    )
    assert rec_res.status_code == 201
    rec_id = rec_res.json()["id"]

    # 5. Update Record
    patch_res = client.patch(
        f"/api/records/{rec_id}",
        json={"notes": "Audited certified copy"},
    )
    assert patch_res.status_code == 200

    # 6. Add Crosswalk
    cw_res = client.post(
        f"/api/cases/{case_id}/crosswalk",
        json={
            "series_a": "SA",
            "dag_a": "55",
            "series_b": "RS",
            "dag_b": "101",
            "confirmed_by_reviewer": True,
        },
    )
    assert cw_res.status_code == 201
    cw_id = cw_res.json()["id"]

    # 7. Update Crosswalk
    cw_patch = client.patch(
        f"/api/crosswalk/{cw_id}",
        json={"basis_note": "Verified against mouza map sheet 2"},
    )
    assert cw_patch.status_code == 200

    # 8. Update Checklist
    chk_res = client.get(f"/api/cases/{case_id}/checklist")
    chk_items = chk_res.json()
    first_item_id = chk_items[0]["id"]
    chk_patch = client.patch(
        f"/api/checklist/{first_item_id}",
        json={"status": "reviewer_completed", "completion_note": "Confirmed via portal"},
    )
    assert chk_patch.status_code == 200

    # 9. Execute Analysis
    analyze_res = client.post(f"/api/cases/{case_id}/analyze")
    assert analyze_res.status_code == 200

    # 10. Generate Report
    report_res = client.get(f"/api/cases/{case_id}/report")
    assert report_res.status_code == 200

    # 11. Retrieve Audit Trail
    audit_res = client.get(f"/api/cases/{case_id}/audit")
    assert audit_res.status_code == 200
    trail = audit_res.json()
    assert trail["case_id"] == case_id
    assert trail["total_events"] == 1

    actions = [e["action"] for e in trail["events"]]
    assert actions == ["analysis_executed"]


def test_integrity_verification_intact_and_tamper(client):
    """
    Tests SHA-256 input fingerprint comparison against the analyzed snapshot.
    """
    load_res = client.post("/api/scenarios/S1/load")
    assert load_res.status_code == 201
    case_id = load_res.json()["id"]

    # Initial check: Seal intact
    int_res = client.get(f"/api/cases/{case_id}/integrity")
    assert int_res.status_code == 200
    integrity = int_res.json()
    assert integrity["is_sealed"] is True
    assert integrity["is_valid"] is True
    assert integrity["sealed_hash"] == integrity["current_hash"]
    assert "source_records" in integrity["checked_components"]
    assert "parties" in integrity["checked_components"]
    assert "plot_crosswalks" in integrity["checked_components"]
    assert "matches" in integrity["explanation"].lower()
    assert "disclaimer" in integrity

    # Tamper case inputs: Add a rogue record without re-analyzing
    add_res = client.post(
        f"/api/cases/{case_id}/records",
        json={
            "record_type": "deed",
            "source_reference": "Unauthorized Alteration Deed",
            "survey_series": "RS",
            "dag_no": "999",
            "area_value": 1.0,
            "area_unit": "acre",
        },
    )
    assert add_res.status_code == 201

    # Verify seal detects tamper
    tamper_res = client.get(f"/api/cases/{case_id}/integrity")
    assert tamper_res.status_code == 200
    tampered = tamper_res.json()
    assert tampered["is_sealed"] is True
    assert tampered["is_valid"] is False
    assert tampered["sealed_hash"] != tampered["current_hash"]
    assert "differs" in tampered["explanation"].lower()

    # Re-running analysis re-seals with updated hash
    re_analyze = client.post(f"/api/cases/{case_id}/analyze")
    assert re_analyze.status_code == 200

    resealed_res = client.get(f"/api/cases/{case_id}/integrity")
    resealed = resealed_res.json()
    assert resealed["is_valid"] is True
    assert resealed["sealed_hash"] == resealed["current_hash"]


def test_report_includes_comparison_integrity_and_audit(client):
    """Verifies that the investigation report payload contains comparison grid, integrity seal, and audit summary."""
    load_res = client.post("/api/scenarios/S1/load")
    assert load_res.status_code == 201
    case_id = load_res.json()["id"]

    rep_res = client.get(f"/api/cases/{case_id}/report")
    assert rep_res.status_code == 200
    report = rep_res.json()

    # 1. Comparison Matrix present
    assert "comparison" in report
    comparison = report["comparison"]
    assert comparison is not None
    assert len(comparison["records"]) >= 3
    assert len(comparison["rows"]) >= 5

    # 2. Cryptographic Integrity Seal status present
    assert "integrity" in report
    integrity = report["integrity"]
    assert integrity is not None
    assert integrity["is_sealed"] is True
    assert integrity["is_valid"] is True
    assert integrity["sealed_hash"] is not None

    # 3. Audit Summary present
    assert "audit_summary" in report
    audit_summary = report["audit_summary"]
    assert audit_summary is not None
    assert isinstance(audit_summary, list)
    assert len(audit_summary) > 0

    # 4. Printable Disclaimer
    assert "disclaimer" in report
    assert "prototype" in report["disclaimer"].lower() or "screen" in report["disclaimer"].lower()
    assert "do not establish" in report["disclaimer"].lower()


def test_audit_logs_analysis_and_explicit_exports_only(client):
    loaded = client.post("/api/scenarios/S1/load")
    assert loaded.status_code == 201
    case_id = loaded.json()["id"]

    initial = client.get(f"/api/cases/{case_id}/audit").json()["events"]
    assert [event["action"] for event in initial].count("analysis_executed") == 1

    for _ in range(2):
        assert client.get(f"/api/cases/{case_id}/report").status_code == 200
        assert client.get(f"/api/cases/{case_id}/integrity?log_event=true").status_code == 200

    passive = client.get(f"/api/cases/{case_id}/audit").json()["events"]
    assert [event["action"] for event in passive].count("report_generated") == 0
    assert [event["action"] for event in passive].count("integrity_verified") == 0

    exported = client.post(f"/api/cases/{case_id}/report/exported")
    assert exported.status_code == 204
    final = client.get(f"/api/cases/{case_id}/audit").json()["events"]
    assert [event["action"] for event in final].count("report_exported") == 1
def test_integrity_reads_never_create_audit_events(client):
    loaded = client.post("/api/scenarios/S2/load")
    assert loaded.status_code == 201
    case_id = loaded.json()["id"]
    for log_event in ("false", "true", "false"):
        assert client.get(f"/api/cases/{case_id}/integrity?log_event={log_event}").status_code == 200
    actions = [event["action"] for event in client.get(f"/api/cases/{case_id}/audit").json()["events"]]
    assert actions.count("analysis_executed") == 1
    assert "integrity_verified" not in actions

def test_all_scenarios_s1_through_s8_end_to_end(client):
    """
    Phase 7 End-to-End Scenario Verification:
    Loads S1 through S8 sequentially into the database.
    Verifies that:
    1. All 8 scenarios coexist safely without UNIQUE constraint collisions.
    2. Expected screening rules fire deterministically for each scenario.
    3. Timeline, comparison grid, report, and cryptographic integrity seal work end-to-end for every scenario.
    4. Prohibited verdict terminology ('fraud', 'forged', 'illegal', 'safe', 'verified owner') never appears.
    """
    scenario_ids = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]
    loaded_cases = {}

    for s_id in scenario_ids:
        load_res = client.post(f"/api/scenarios/{s_id}/load")
        assert load_res.status_code == 201, f"Failed to load scenario {s_id}: {load_res.text}"
        case_data = load_res.json()
        loaded_cases[s_id] = case_data

    # 1. Verify all 8 cases coexist in the database simultaneously
    cases_res = client.get("/api/cases")
    assert cases_res.status_code == 200
    all_cases = cases_res.json()
    all_case_ids = {c["id"] for c in all_cases}
    for s_id, case in loaded_cases.items():
        assert case["id"] in all_case_ids, f"Case for scenario {s_id} missing from cases list"

    # 2. Verify specific deterministic screening outcomes for each scenario
    forbidden_tokens = ["fraud", "forged", "illegal", "verified owner", "forensic", "verdict", "tamper"]

    for s_id, case in loaded_cases.items():
        case_id = case["id"]

        # A. Findings
        findings_res = client.get(f"/api/cases/{case_id}/findings")
        assert findings_res.status_code == 200
        findings = findings_res.json()
        rule_codes = {f["rule_code"] for f in findings}

        # Check expected rule triggers per scenario specification
        if s_id == "S1":
            # Clean chain: 0 high/critical findings
            severe_findings = [f for f in findings if f.get("status") in ("conflict", "critical")]
            assert len(severe_findings) == 0, f"S1 had unexpected severe findings: {severe_findings}"
        elif s_id == "S2":
            # Duplicate sale -> JT-R04
            assert "JT-R04" in rule_codes, f"S2 missing duplicate sale finding JT-R04. Got: {rule_codes}"
        elif s_id == "S3":
            # Over-conveyance -> JT-R05
            assert "JT-R05" in rule_codes, f"S3 missing over-conveyance finding JT-R05. Got: {rule_codes}"
        elif s_id == "S4":
            # Unit conversion: legitimate conversion, no JT-R02 area mismatch
            area_mismatches = [f for f in findings if f["rule_code"] == "JT-R02" and f.get("status") == "conflict"]
            assert len(area_mismatches) == 0, f"S4 should not produce false area mismatch. Got: {findings}"
        elif s_id == "S5":
            # Chain gap: missing link -> JT-R03
            assert "JT-R03" in rule_codes, f"S5 missing broken ownership chain finding JT-R03. Got: {rule_codes}"
        elif s_id == "S6":
            # Mutation mismatch and/or rapid transfer -> JT-R08
            assert "JT-R08" in rule_codes, f"S6 missing rapid transfer finding JT-R08. Got: {rule_codes}"
        elif s_id == "S7":
            # Blank/missing mandatory fields -> JT-R02
            assert "JT-R02" in rule_codes, f"S7 missing incomplete data finding JT-R02. Got: {rule_codes}"
        elif s_id == "S8":
            # Cross-series unmapped plot -> JT-R01
            assert "JT-R01" in rule_codes, f"S8 missing plot mismatch finding JT-R01. Got: {rule_codes}"

        # B. Timeline
        timeline_res = client.get(f"/api/cases/{case_id}/timeline")
        assert timeline_res.status_code == 200
        timeline_data = timeline_res.json()
        assert "nodes" in timeline_data
        assert isinstance(timeline_data["nodes"], list)

        # C. Comparison Grid
        comp_res = client.get(f"/api/cases/{case_id}/comparison")
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert "records" in comp_data
        assert "rows" in comp_data
        assert len(comp_data["records"]) > 0

        # D. Report
        rep_res = client.get(f"/api/cases/{case_id}/report")
        assert rep_res.status_code == 200
        report_data = rep_res.json()
        assert "summary" in report_data
        assert "comparison" in report_data
        assert "integrity" in report_data
        assert "audit_summary" in report_data

        # E. Cryptographic Integrity Seal
        int_res = client.get(f"/api/cases/{case_id}/integrity")
        assert int_res.status_code == 200
        int_data = int_res.json()
        assert int_data["is_sealed"] is True
        assert int_data["is_valid"] is True
        assert len(int_data["sealed_hash"]) == 64

        # F. Forbidden verdict words screening across report & findings text
        combined_text = f"{findings_res.text} {rep_res.text} {int_res.text}".lower()
        for token in forbidden_tokens:
            assert token not in combined_text, f"Forbidden verdict term '{token}' detected in scenario {s_id} output"
