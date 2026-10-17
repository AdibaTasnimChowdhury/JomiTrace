"""JT-R06: Registration-date chronology screening."""
from datetime import date
from typing import List

from app.rules.base import CaseConfig, CaseSnapshot, EvidenceRef, Finding, RuleCategory, RuleStatus

RULE_CODE = "JT-R06"
CATEGORY = RuleCategory.DATE_CONFLICT.value
LIMITATION = "Checks entered registration dates only; original document dates and physical stamps are not authenticated."
RECOMMENDATION = "Verify registration dates and volume-index entries through an authorized records office."


def check_date_order(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """Check registration dates for future values and linked deed/mutation ordering."""
    records = [r for r in snapshot.records if not r.is_archived]
    if not records:
        return []

    findings: List[Finding] = []
    today = config.reference_date or date.today()
    for record in records:
        registered = record.registration_date
        if registered and registered > today:
            findings.append(Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.CONFLICT_DETECTED.value,
                summary=f"Future registration date on {record.source_reference} ({registered})",
                explanation=f"The entered registration date for {record.source_reference} is later than the configured reference date ({today}).",
                source_record_ids=[record.id],
                compared_fields=["registration_date"],
                observed_values={"registration_date": str(registered), "reference_date": str(today)},
                limitations=LIMITATION,
                recommended_next_step=RECOMMENDATION,
                evidence=[EvidenceRef(record.id, "registration_date", str(registered), record.source_reference)],
            ))

    deeds = [r for r in records if r.record_type == "deed" and r.deed_no]
    mutations = [r for r in records if r.record_type == "mutation" and r.deed_no]
    for mutation in mutations:
        mutation_date = mutation.registration_date
        if not mutation_date:
            continue
        for deed in deeds:
            if deed.deed_no != mutation.deed_no or not deed.registration_date:
                continue
            if mutation_date < deed.registration_date:
                findings.append(Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.CONFLICT_DETECTED.value,
                    summary=f"Mutation registration precedes cited deed registration ({mutation.source_reference})",
                    explanation=(
                        f"Mutation {mutation.source_reference} was registered on {mutation_date}, before cited deed "
                        f"{deed.source_reference} was registered on {deed.registration_date}."
                    ),
                    source_record_ids=[deed.id, mutation.id],
                    compared_fields=["registration_date"],
                    observed_values={"deed_registration_date": str(deed.registration_date), "mutation_registration_date": str(mutation_date)},
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(deed.id, "registration_date", str(deed.registration_date), deed.source_reference),
                        EvidenceRef(mutation.id, "registration_date", str(mutation_date), mutation.source_reference),
                    ],
                ))

    dated = [r for r in records if r.registration_date]
    if len(dated) >= 2 and not any(f.status == RuleStatus.CONFLICT_DETECTED.value for f in findings):
        findings.append(Finding(
            rule_code=RULE_CODE,
            category=CATEGORY,
            status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
            summary="Entered registration dates contain no future or reversed linked dates",
            explanation="The supplied registration dates contain no future value or linked mutation registered before its cited deed.",
            source_record_ids=[r.id for r in dated],
            compared_fields=["registration_date"],
            observed_values={"dated_record_count": len(dated)},
            limitations=LIMITATION,
            recommended_next_step="",
        ))
    elif not dated:
        findings.append(Finding(
            rule_code=RULE_CODE,
            category=CATEGORY,
            status=RuleStatus.INSUFFICIENT_INFORMATION.value,
            summary="Registration dates missing across case records",
            explanation="No registration dates were supplied, so registration chronology cannot be evaluated.",
            source_record_ids=[r.id for r in records],
            compared_fields=["registration_date"],
            observed_values={},
            limitations=LIMITATION,
            recommended_next_step="Enter registration dates from the supplied records.",
            evidence=[EvidenceRef(r.id, "registration_date", None, r.source_reference) for r in records],
        ))
    return findings
