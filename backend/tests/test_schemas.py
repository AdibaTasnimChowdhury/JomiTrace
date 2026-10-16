"""Tests for Pydantic schema validation, constraints, and serialization."""
from datetime import date
import pytest
from pydantic import ValidationError

from app.models.enums import (
    CaseStatus,
    Provenance,
    RecordType,
    SurveySeries,
    FindingCategory,
    FindingStatus,
    ChecklistStatus,
)
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.schemas.party import PartyCreate, PartyAliasCreate
from app.schemas.source_record import SourceRecordCreate, SourceRecordUpdate
from app.schemas.plot_crosswalk import PlotCrosswalkCreate
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemUpdate
from app.schemas.finding import FindingCreate, FindingEvidenceCreate

def test_case_create_valid():
    """Test valid case creation schema."""
    case_in = CaseCreate(
        case_code="JT-1002",
        title="Mirpur Mouza Verification",
        district="Dhaka",
        provenance=Provenance.SYNTHETIC,
    )
    assert case_in.case_code == "JT-1002"
    assert case_in.title == "Mirpur Mouza Verification"
    assert case_in.provenance == Provenance.SYNTHETIC

def test_case_create_rejects_empty_code_and_title():
    """Test rejection of empty or whitespace strings."""
    with pytest.raises(ValidationError):
        CaseCreate(case_code="   ", title="Valid Title")

    with pytest.raises(ValidationError):
        CaseCreate(case_code="JT-1002", title="   ")

def test_source_record_create_valid():
    """Test valid source record creation."""
    rec_in = SourceRecordCreate(
        record_type=RecordType.DEED,
        source_reference="Deed D-101",
        survey_series=SurveySeries.RS,
        dag_no="142",
        khatian_no="55",
        area_original="20 decimal",
        area_value=20.0,
        area_unit="decimal",
        record_date=date(2020, 1, 1),
    )
    assert rec_in.record_type == RecordType.DEED
    assert rec_in.area_value == 20.0

def test_source_record_rejects_negative_area():
    """Test rejection of negative numeric area value."""
    with pytest.raises(ValidationError):
        SourceRecordCreate(
            record_type=RecordType.DEED,
            source_reference="Deed D-101",
            area_value=-5.0,
        )

def test_source_record_rejects_empty_reference():
    """Test rejection of empty source reference."""
    with pytest.raises(ValidationError):
        SourceRecordCreate(
            record_type=RecordType.DEED,
            source_reference="   ",
        )

def test_party_create_strips_and_validates():
    """Test party creation strips whitespace and rejects blank labels."""
    party_in = PartyCreate(label="  Party P1  ", aliases=["Alias A", "Alias B"])
    assert party_in.label == "Party P1"
    assert len(party_in.aliases) == 2

    with pytest.raises(ValidationError):
        PartyCreate(label="   ")

def test_party_alias_create_rejects_blank():
    """Test party alias rejects blank text."""
    with pytest.raises(ValidationError):
        PartyAliasCreate(alias_text="   ")

def test_plot_crosswalk_validation():
    """Test PlotCrosswalk schema requires valid dags and survey series."""
    cw = PlotCrosswalkCreate(
        series_a=SurveySeries.RS,
        dag_a="140",
        series_b=SurveySeries.BS,
        dag_b="285",
        confirmed_by_reviewer=False,
    )
    assert cw.dag_a == "140"
    assert cw.dag_b == "285"
    assert cw.confirmed_by_reviewer is False

    with pytest.raises(ValidationError):
        PlotCrosswalkCreate(
            series_a=SurveySeries.RS,
            dag_a="   ",
            series_b=SurveySeries.BS,
            dag_b="285",
        )

def test_checklist_item_validation():
    """Test checklist item requires non-empty label and defaults to PENDING."""
    item = ChecklistItemCreate(label="Check certified khatian porcha")
    assert item.status == ChecklistStatus.PENDING

    with pytest.raises(ValidationError):
        ChecklistItemCreate(label="   ")

def test_finding_create_with_evidence():
    """Test creating a finding with linked evidence citations."""
    f = FindingCreate(
        rule_code="JT-R05",
        category=FindingCategory.OVER_CONVEYANCE,
        status=FindingStatus.CONFLICT_DETECTED,
        summary="Conveyed area exceeds holding area",
        explanation="Deeds D-1 and D-2 together convey 62 decimal from 50 decimal holding.",
        compared_fields=["area_value"],
        observed_values={"holding_area": 50.0, "total_conveyed": 62.0},
        limitations="Areas are as entered; ground boundaries not assessed.",
        recommended_next_step="Inspect original deed areas through authorized channels.",
        evidence=[
            FindingEvidenceCreate(
                source_record_id="rec-1",
                field_name="area_value",
                observed_value="30.0",
                reference_label="Deed D-1",
            ),
            FindingEvidenceCreate(
                source_record_id="rec-2",
                field_name="area_value",
                observed_value="32.0",
                reference_label="Deed D-2",
            ),
        ],
    )
    assert f.rule_code == "JT-R05"
    assert len(f.evidence) == 2
    assert f.evidence[0].reference_label == "Deed D-1"
