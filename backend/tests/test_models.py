"""Tests for SQLAlchemy models, relationships, and integrity constraints."""
from datetime import date, datetime, timezone
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.enums import (
    CaseStatus,
    Provenance,
    RecordType,
    SurveySeries,
    TransferType,
    FindingCategory,
    FindingStatus,
    ChecklistStatus,
)
from app.models.case import VerificationCase
from app.models.party import Party, PartyAlias
from app.models.source_record import SourceRecord
from app.models.plot_crosswalk import PlotCrosswalk
from app.models.transfer_event import TransferEvent
from app.models.analysis_run import AnalysisRun
from app.models.finding import Finding, FindingEvidence
from app.models.checklist import ChecklistItem

def test_create_verification_case_with_defaults(db_session):
    """Test creating a case with expected default status, provenance, and config."""
    case = VerificationCase(
        case_code="JT-1001",
        title="Dhanmondi Plot 42 Transfer Verification",
        district="Dhaka",
        upazila="Dhanmondi",
        mouza="Dhanmondi",
        jl_number="12",
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)

    assert case.id is not None
    assert len(case.id) == 36
    assert case.case_code == "JT-1001"
    assert case.status == CaseStatus.DRAFT
    assert case.provenance == Provenance.USER_ENTERED
    assert case.config_json["area_tolerance_pct"] == 1.0
    assert case.config_json["rapid_transfer_days"] == 30
    assert case.created_at is not None
    assert case.updated_at is not None

def test_case_code_uniqueness_constraint(db_session):
    """Test that duplicate case codes violate the uniqueness constraint."""
    case1 = VerificationCase(case_code="JT-DUP", title="Case 1")
    db_session.add(case1)
    db_session.commit()

    case2 = VerificationCase(case_code="JT-DUP", title="Case 2")
    db_session.add(case2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_party_and_aliases_relationship(db_session):
    """Test Party creation and PartyAlias linkage and review confirmation."""
    case = VerificationCase(case_code="JT-PARTY", title="Party Test Case")
    db_session.add(case)
    db_session.commit()

    party = Party(case_id=case.id, label="Party P1")
    db_session.add(party)
    db_session.commit()

    alias1 = PartyAlias(
        party_id=party.id,
        alias_text="Md. Rafiqul Islam",
        confirmed_by_reviewer=True,
        confirmed_at=datetime.now(timezone.utc),
    )
    alias2 = PartyAlias(
        party_id=party.id,
        alias_text="Rafiq Islam",
        confirmed_by_reviewer=False,
    )
    db_session.add_all([alias1, alias2])
    db_session.commit()
    db_session.refresh(party)

    assert len(party.aliases) == 2
    assert any(a.confirmed_by_reviewer for a in party.aliases)
    assert any(not a.confirmed_by_reviewer for a in party.aliases)

def test_source_record_area_preservation(db_session):
    """Test that source records preserve original area text and numeric value."""
    case = VerificationCase(case_code="JT-REC", title="Record Test Case")
    db_session.add(case)
    db_session.commit()

    record = SourceRecord(
        case_id=case.id,
        record_type=RecordType.DEED,
        source_reference="Deed D-102",
        survey_series=SurveySeries.RS,
        dag_no="450",
        khatian_no="88",
        deed_no="789/2021",
        record_date=date(2021, 5, 12),
        registration_date=date(2021, 5, 14),
        area_original="30 decimal (shotok)",
        area_value=30.0,
        area_unit="decimal",
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)

    assert record.id is not None
    assert record.source_reference == "Deed D-102"
    assert record.area_original == "30 decimal (shotok)"
    assert record.area_value == 30.0
    assert record.area_unit == "decimal"
    assert record.is_archived is False

def test_plot_crosswalk_mapping(db_session):
    """Test PlotCrosswalk creation for cross-series mapping."""
    case = VerificationCase(case_code="JT-CROSS", title="Crosswalk Case")
    db_session.add(case)
    db_session.commit()

    crosswalk = PlotCrosswalk(
        case_id=case.id,
        series_a=SurveySeries.RS,
        dag_a="140",
        series_b=SurveySeries.BS,
        dag_b="285",
        basis_note="Verified through CS to RS to BS map comparison ledger",
        confirmed_by_reviewer=True,
    )
    db_session.add(crosswalk)
    db_session.commit()
    db_session.refresh(case)

    assert len(case.crosswalks) == 1
    cw = case.crosswalks[0]
    assert cw.series_a == SurveySeries.RS
    assert cw.dag_a == "140"
    assert cw.series_b == SurveySeries.BS
    assert cw.dag_b == "285"
    assert cw.confirmed_by_reviewer is True

def test_transfer_event_derivation(db_session):
    """Test transfer events linked to source record and confirmed parties."""
    case = VerificationCase(case_code="JT-EVENT", title="Event Case")
    db_session.add(case)
    db_session.commit()

    seller = Party(case_id=case.id, label="Party P1 (Seller)")
    buyer = Party(case_id=case.id, label="Party P2 (Buyer)")
    db_session.add_all([seller, buyer])
    db_session.commit()

    record = SourceRecord(
        case_id=case.id,
        record_type=RecordType.DEED,
        source_reference="Deed D-201",
        survey_series=SurveySeries.BS,
        dag_no="101",
        seller_party_id=seller.id,
        buyer_party_id=buyer.id,
    )
    db_session.add(record)
    db_session.commit()

    event = TransferEvent(
        case_id=case.id,
        source_record_id=record.id,
        event_date=date(2022, 1, 10),
        transfer_type=TransferType.SALE,
        from_party_id=seller.id,
        to_party_id=buyer.id,
        area_conveyed_value=25.5,
        area_unit="decimal",
        holding_key="BS:101",
        sequence_index=1,
        derived=True,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    assert event.from_party.label == "Party P1 (Seller)"
    assert event.to_party.label == "Party P2 (Buyer)"
    assert event.source_record.source_reference == "Deed D-201"
    assert event.derived is True

def test_analysis_run_finding_and_evidence(db_session):
    """Test AnalysisRun, Finding, and FindingEvidence composite key linkage."""
    case = VerificationCase(case_code="JT-FIND", title="Finding Test Case")
    db_session.add(case)
    db_session.commit()

    record = SourceRecord(
        case_id=case.id,
        record_type=RecordType.DEED,
        source_reference="Deed D-301",
        dag_no="500",
    )
    db_session.add(record)
    db_session.commit()

    run = AnalysisRun(
        case_id=case.id,
        rule_version="0.2",
        config_snapshot_json={"area_tolerance_pct": 1.0},
        input_hash="hash123456",
        is_stale=False,
    )
    db_session.add(run)
    db_session.commit()

    finding = Finding(
        run_id=run.id,
        case_id=case.id,
        rule_code="JT-R01",
        category=FindingCategory.PLOT_MISMATCH,
        status=FindingStatus.CONFLICT_DETECTED,
        summary="Different plots referenced in same survey series",
        explanation="Deed D-301 references plot 500 while Khatian K-1 references plot 501.",
        compared_fields=["dag_no"],
        observed_values={"Deed D-301": "500", "Khatian K-1": "501"},
        limitations="Checks are as entered; ground boundaries not assessed.",
        recommended_next_step="Confirm dag numbers on certified copies.",
    )
    db_session.add(finding)
    db_session.commit()

    evidence = FindingEvidence(
        finding_id=finding.id,
        source_record_id=record.id,
        field_name="dag_no",
        observed_value="500",
        reference_label="Deed D-301",
    )
    db_session.add(evidence)
    db_session.commit()
    db_session.refresh(finding)

    assert len(finding.evidence) == 1
    assert finding.evidence[0].source_record_id == record.id
    assert finding.evidence[0].field_name == "dag_no"
    assert finding.evidence[0].observed_value == "500"

def test_restrict_delete_on_cited_source_record(db_session):
    """Test that deleting a source record cited in finding_evidence is restricted by FK integrity."""
    case = VerificationCase(case_code="JT-RESTRICT", title="Restrict Test Case")
    db_session.add(case)
    db_session.commit()

    record = SourceRecord(
        case_id=case.id,
        record_type=RecordType.DEED,
        source_reference="Deed Cited",
    )
    db_session.add(record)
    db_session.commit()

    run = AnalysisRun(
        case_id=case.id,
        rule_version="0.2",
        config_snapshot_json={},
        input_hash="hashabc",
    )
    db_session.add(run)
    db_session.commit()

    finding = Finding(
        run_id=run.id,
        case_id=case.id,
        rule_code="JT-R02",
        category=FindingCategory.AREA_MISMATCH,
        status=FindingStatus.REVIEW_REQUIRED,
        summary="Area mismatch",
        explanation="Test explanation",
        compared_fields=["area_value"],
        observed_values={},
        limitations="Test limitation",
        recommended_next_step="Inspect original",
    )
    db_session.add(finding)
    db_session.commit()

    evidence = FindingEvidence(
        finding_id=finding.id,
        source_record_id=record.id,
        field_name="area_value",
    )
    db_session.add(evidence)
    db_session.commit()

    # Attempting to delete the cited source record directly must fail with IntegrityError
    db_session.delete(record)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_checklist_item_creation_and_update(db_session):
    """Test ChecklistItem creation and status progression."""
    case = VerificationCase(case_code="JT-CHECK", title="Checklist Case")
    db_session.add(case)
    db_session.commit()

    item = ChecklistItem(
        case_id=case.id,
        label="Verify original deed through sub-registry office",
        description="Check volume book and deed registration number against sub-registry index",
        status=ChecklistStatus.PENDING,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    assert item.status == ChecklistStatus.PENDING
    assert item.completion_note is None

    # Reviewer marks completed
    item.status = ChecklistStatus.REVIEWER_COMPLETED
    item.completion_note = "Checked with sub-registry index record vol 42 page 89"
    db_session.commit()
    db_session.refresh(item)

    assert item.status == ChecklistStatus.REVIEWER_COMPLETED
    assert "vol 42" in item.completion_note

def test_cascade_delete_verification_case(db_session):
    """Test that deleting a verification case cascades to its parties, records, crosswalks, and checklist."""
    case = VerificationCase(case_code="JT-CASCADE", title="Cascade Test Case")
    db_session.add(case)
    db_session.commit()

    party = Party(case_id=case.id, label="P1")
    db_session.add(party)
    db_session.commit()

    alias = PartyAlias(party_id=party.id, alias_text="P1 Alias")
    item = ChecklistItem(case_id=case.id, label="Check something")
    crosswalk = PlotCrosswalk(
        case_id=case.id,
        series_a=SurveySeries.CS,
        dag_a="1",
        series_b=SurveySeries.SA,
        dag_b="2",
    )
    db_session.add_all([alias, item, crosswalk])
    db_session.commit()

    case_id = case.id
    party_id = party.id

    db_session.delete(case)
    db_session.commit()

    # All related items should be cascaded
    assert db_session.get(VerificationCase, case_id) is None
    assert db_session.get(Party, party_id) is None
    assert db_session.query(PartyAlias).filter_by(party_id=party_id).first() is None
    assert db_session.query(ChecklistItem).filter_by(case_id=case_id).first() is None
    assert db_session.query(PlotCrosswalk).filter_by(case_id=case_id).first() is None

def test_foreign_key_violation_on_invalid_case_id(db_session):
    """Test that inserting a record with non-existent case_id fails foreign key constraint."""
    record = SourceRecord(
        case_id="non-existent-case-id-12345",
        record_type=RecordType.DEED,
        source_reference="Orphan Deed",
    )
    db_session.add(record)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
