"""JT-R09: Missing fields and record completeness screening rule."""
from typing import List
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RecordSnapshot,
    RuleCategory,
    RuleStatus,
)

RULE_CODE = "JT-R09"
CATEGORY = RuleCategory.MISSING_DATA.value
LIMITATION = "Reflects only completeness of metadata entered into the case; does not verify whether entered values are authentic."
RECOMMENDATION = "Obtain complete certified copies of missing records to fill required fields."

def check_missing_fields(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Checks each record against per-record-type required fields and reports
    missing metadata without claiming downstream rules were blocked. NEVER
    produces conflict_detected.
    """
    records = [r for r in snapshot.records if not r.is_archived]
    if not records:
        return [
            Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                summary="No records entered in case",
                explanation="The case contains no source records to screen.",
                limitations=LIMITATION,
                recommended_next_step="Add initial deed or khatian record.",
            )
        ]

    findings: List[Finding] = []
    has_any_missing = False
    field_labels = {
        "deed_no": "deed number", "dag_no": "plot number", "area_value": "recorded area",
        "area_unit": "area unit", "seller_party_id": "seller", "buyer_party_id": "buyer",
        "owner_party_id": "owner / beneficiary", "record_date/registration_date": "record or registration date",
        "record_date": "record date", "survey_series": "survey series", "khatian_no": "khatian number",
        "dcr_no": "DCR number",
    }

    for r in records:
        missing_fields: List[str] = []

        # Check by record type
        if r.record_type == "deed":
            if not r.deed_no:
                missing_fields.append("deed_no")
            if not r.dag_no:
                missing_fields.append("dag_no")
            if r.area_value is None:
                missing_fields.append("area_value")
            if not r.area_unit:
                missing_fields.append("area_unit")
            if not r.seller_party_id:
                missing_fields.append("seller_party_id")
            if not r.buyer_party_id:
                missing_fields.append("buyer_party_id")
            if not r.registration_date:
                missing_fields.append("record_date/registration_date")

        elif r.record_type == "khatian":
            if not (r.record_date or r.registration_date):
                missing_fields.append("record_date/registration_date")
            if not r.survey_series:
                missing_fields.append("survey_series")
            if not r.dag_no:
                missing_fields.append("dag_no")
            if not r.khatian_no:
                missing_fields.append("khatian_no")
            if r.area_value is None:
                missing_fields.append("area_value")
            if not r.area_unit:
                missing_fields.append("area_unit")

        elif r.record_type == "mutation":
            if not r.dag_no:
                missing_fields.append("dag_no")
            if r.area_value is None:
                missing_fields.append("area_value")
            if not r.area_unit:
                missing_fields.append("area_unit")
            if not (r.owner_party_id or r.buyer_party_id):
                missing_fields.append("owner_party_id")
            if not r.registration_date:
                missing_fields.append("record_date")

        elif r.record_type == "dcr":
            if not r.dcr_no:
                missing_fields.append("dcr_no")
            if not r.record_date:
                missing_fields.append("record_date")

        if missing_fields:
            has_any_missing = True
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                    summary=f"Required fields missing on {r.source_reference}",
                    explanation=(
                        f"{r.source_reference} ({r.record_type}) is missing required field(s): {', '.join(field_labels.get(field, field) for field in missing_fields)}. "
                        "These omissions limit completeness; see the individual rule results for checks that could not be fully assessed."
                    ),
                    source_record_ids=[r.id],
                    compared_fields=missing_fields,
                    observed_values={
                        "missing_fields": missing_fields,
                    },
                    limitations=LIMITATION,
                    recommended_next_step=f"Supply missing fields for {r.source_reference}.",
                    evidence=[EvidenceRef(r.id, f, None, r.source_reference) for f in missing_fields],
                )
            )

    if not has_any_missing:
        findings.append(
            Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                summary="Required fields complete across all entered records",
                explanation="All deed, khatian, and mutation records have necessary plot, party, date, and area fields populated.",
                source_record_ids=[r.id for r in records],
                compared_fields=["source_records"],
                observed_values={"record_count": len(records)},
                limitations=LIMITATION,
                recommended_next_step="",
                evidence=[EvidenceRef(r.id, "record_type", r.record_type, r.source_reference) for r in records],
            )
        )

    return findings
