"""JT-R07: Registration-mutation link screening."""
from datetime import date
from typing import List, Optional
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RecordSnapshot,
    RuleCategory,
    RuleStatus,
)
from app.rules.area import compare_areas

RULE_CODE = "JT-R07"
CATEGORY = RuleCategory.REG_MUTATION_MISMATCH.value
LIMITATION = "AC Land e-mutation records and Sub-Registry e-registration records are maintained in separate administrative systems; automated synchronization is not assumed."
RECOMMENDATION = "Cross-check mutation khatian with the AC Land office mutation case file (নামজারি মিস কেস নথি)."

def check_registration_mutation_link(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Screens registration-mutation links:
    (a) Deed without mutation after reference interval (review required)
    (b) Mutation beneficiary != deed buyer (conflict detected)
    (c) Mutation area != deed area beyond tolerance (conflict detected)
    (d) Mutation cites deed not in case (review required)
    """
    records = [r for r in snapshot.records if not r.is_archived]
    deeds = [r for r in records if r.record_type == "deed"]
    mutations = [r for r in records if r.record_type == "mutation"]

    findings: List[Finding] = []
    now_date = config.reference_date or date.today()

    # Case: No deeds and no mutations
    if not deeds and not mutations:
        return []

    # With no mutation data in the case, report one case-level information gap.
    # Per-deed review signals are appropriate only when mutation records exist
    # and some deeds remain unlinked while others have a comparison available.
    if deeds and not mutations:
        findings.append(Finding(
            rule_code=RULE_CODE,
            category=CATEGORY,
            status=RuleStatus.INSUFFICIENT_INFORMATION.value,
            summary="No mutation records supplied for registration comparison",
            explanation="No mutation record was entered in this case, so registration-to-mutation consistency cannot be assessed.",
            source_record_ids=[d.id for d in deeds],
            compared_fields=["mutation_record"],
            observed_values={"deeds_without_mutation_records": [d.source_reference for d in deeds]},
            limitations=LIMITATION,
            recommended_next_step="Enter available mutation records to assess registration-to-mutation consistency.",
            evidence=[EvidenceRef(d.id, "deed_no", d.deed_no, d.source_reference) for d in deeds],
        ))
        return findings

    # Case: Mutation present but no deeds supplied
    if mutations and not deeds:
        for m in mutations:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                    summary=f"Underlying deed record not supplied for {m.source_reference}",
                    explanation=f"Mutation {m.source_reference} is present, but underlying title deed was not supplied.",
                    source_record_ids=[m.id],
                    compared_fields=["record_type"],
                    observed_values={},
                    limitations=LIMITATION,
                    recommended_next_step="Supply underlying deed to verify mutation continuity.",
                )
            )
        return findings

    # Both deeds and mutations exist: pair by deed number where possible.
    all_deed_numbers = {d.deed_no.strip() for d in deeds if d.deed_no}
    linked_deed_numbers = {m.deed_no.strip() for m in mutations if m.deed_no and m.deed_no.strip() in all_deed_numbers}
    if linked_deed_numbers and len(linked_deed_numbers) < len(deeds):
        for d in deeds:
            if d.deed_no and d.deed_no.strip() not in linked_deed_numbers:
                d_date = d.registration_date or d.record_date
                days_since = (now_date - d_date).days if d_date else None
                findings.append(Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.REVIEW_REQUIRED.value,
                    summary=f"No mutation linked to {d.source_reference} while other deeds have mutation records",
                    explanation=(
                        f"Mutation records are present for other deeds in this case, but none is linked to {d.source_reference}. "
                        + (f"Its registration date was {days_since} days ago." if days_since is not None else "")
                    ),
                    source_record_ids=[d.id],
                    compared_fields=["deed_no", "mutation_record"],
                    observed_values={"deed_no": d.deed_no, "days_since_registration": days_since},
                    limitations=LIMITATION,
                    recommended_next_step="Check whether a mutation record exists for this deed.",
                    evidence=[EvidenceRef(d.id, "deed_no", d.deed_no, d.source_reference)],
                ))

    for m in mutations:
        # Check (d): Mutation cites deed not in case
        if m.deed_no and m.deed_no.strip() not in all_deed_numbers:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.REVIEW_REQUIRED.value,
                    summary=f"Mutation cites deed {m.deed_no} not present in case",
                    explanation=(
                        f"Mutation {m.source_reference} explicitly cites deed number '{m.deed_no}', "
                        f"which does not match any deed record entered in this case."
                    ),
                    source_record_ids=[m.id],
                    compared_fields=["deed_no"],
                    observed_values={"cited_deed_no": m.deed_no, "available_deeds": list(all_deed_numbers)},
                    limitations=LIMITATION,
                    recommended_next_step="Obtain and enter certified copy of cited deed.",
                    evidence=[EvidenceRef(m.id, "deed_no", m.deed_no, m.source_reference)],
                )
            )

        # Match mutation to relevant deed (by cited deed_no or pairwise)
        matched_deeds = []
        if m.deed_no:
            matched_deeds = [d for d in deeds if d.deed_no and d.deed_no.strip() == m.deed_no.strip()]
        if not matched_deeds and not m.deed_no and len(deeds) == 1:
            matched_deeds = deeds
        if not matched_deeds:
            findings.append(Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                summary=f"Mutation {m.source_reference} is not linked to a specific deed",
                explanation="A deed number is needed to compare this mutation with one deed when multiple deeds are present.",
                source_record_ids=[m.id],
                compared_fields=["deed_no"],
                observed_values={"mutation_deed_no": m.deed_no, "available_deeds": sorted(all_deed_numbers)},
                limitations=LIMITATION,
                recommended_next_step="Enter the deed number cited by this mutation record.",
                evidence=[EvidenceRef(m.id, "deed_no", m.deed_no, m.source_reference)],
            ))
            continue

        for d in matched_deeds:
            m_beneficiary_id = m.owner_party_id or m.buyer_party_id
            d_buyer_id = d.buyer_party_id

            # (b) Beneficiary check
            if m_beneficiary_id and d_buyer_id:
                if m_beneficiary_id != d_buyer_id:
                    m_party = snapshot.get_party(m_beneficiary_id)
                    d_party = snapshot.get_party(d_buyer_id)
                    m_label = m_party.label if m_party else "Unknown Mutation Beneficiary"
                    d_label = d_party.label if d_party else "Unknown Deed Buyer"

                    findings.append(
                        Finding(
                            rule_code=RULE_CODE,
                            category=CATEGORY,
                            status=RuleStatus.CONFLICT_DETECTED.value,
                            summary=f"Mutation beneficiary mismatch ({m_label} != {d_label})",
                            explanation=(
                                f"Mutation beneficiary on {m.source_reference} ({m_label}) does not match "
                                f"the purchaser named in registered deed {d.source_reference} ({d_label})."
                            ),
                            source_record_ids=[d.id, m.id],
                            compared_fields=["buyer_party_id", "owner_party_id"],
                            observed_values={
                                "mutation_beneficiary": m_label,
                                "deed_buyer": d_label,
                            },
                            limitations=LIMITATION,
                            recommended_next_step=RECOMMENDATION,
                            evidence=[
                                EvidenceRef(d.id, "buyer_party_id", d_label, d.source_reference),
                                EvidenceRef(m.id, "owner_party_id", m_label, m.source_reference),
                            ],
                        )
                    )
                else:
                    findings.append(
                        Finding(
                            rule_code=RULE_CODE,
                            category=CATEGORY,
                            status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                            summary=f"Mutation beneficiary matches deed buyer ({m.source_reference} and {d.source_reference})",
                            explanation=(
                                f"Beneficiary on {m.source_reference} matches purchaser on registered deed {d.source_reference}."
                            ),
                            source_record_ids=[d.id, m.id],
                            compared_fields=["buyer_party_id", "owner_party_id"],
                            observed_values={},
                            limitations=LIMITATION,
                            recommended_next_step=RECOMMENDATION,
                        )
                    )
            elif not m_beneficiary_id or not d_buyer_id:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                        summary=f"Parties missing for mutation beneficiary check ({m.source_reference})",
                        explanation=f"Cannot compare mutation beneficiary because party assignment is missing on deed or mutation.",
                        source_record_ids=[d.id, m.id],
                        compared_fields=["buyer_party_id", "owner_party_id"],
                        observed_values={},
                        limitations=LIMITATION,
                        recommended_next_step="Assign confirmed parties to deed and mutation records.",
                    )
                )

            # (c) Area check
            if d.area_value is not None and d.area_unit and m.area_value is not None and m.area_unit:
                sqft_d, sqft_m, diff_pct, within_tol = compare_areas(
                    d.area_value, d.area_unit, m.area_value, m.area_unit, config
                )
                if diff_pct is not None and not within_tol:
                    findings.append(
                        Finding(
                            rule_code=RULE_CODE,
                            category=CATEGORY,
                            status=RuleStatus.CONFLICT_DETECTED.value,
                            summary=f"Mutation area ({m.area_value} {m.area_unit}) differs from deed ({d.area_value} {d.area_unit})",
                            explanation=(
                                f"Mutation area ({m.area_value} {m.area_unit}) differs from deed area "
                                f"({d.area_value} {d.area_unit}) by {diff_pct}%, exceeding tolerance of {config.area_tolerance_pct}%."
                            ),
                            source_record_ids=[d.id, m.id],
                            compared_fields=["area_value", "area_unit"],
                            observed_values={
                                "deed_area": f"{d.area_value} {d.area_unit}",
                                "mutation_area": f"{m.area_value} {m.area_unit}",
                                "diff_pct": diff_pct,
                            },
                            limitations=LIMITATION,
                            recommended_next_step=RECOMMENDATION,
                            evidence=[
                                EvidenceRef(d.id, "area_value", str(d.area_value), d.source_reference),
                                EvidenceRef(m.id, "area_value", str(m.area_value), m.source_reference),
                            ],
                        )
                    )

    return findings
