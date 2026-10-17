"""JT-R05: Aggregate conveyed area and over-conveyance screening."""
from typing import List, Dict
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RecordSnapshot,
    RuleCategory,
    RuleStatus,
)
from app.rules.area import normalize_area_to_sqft

RULE_CODE = "JT-R05"
CATEGORY = RuleCategory.OVER_CONVEYANCE.value
LIMITATION = "Areas are as entered; boundaries and partial-plot descriptions are not assessed."
RECOMMENDATION = "Confirm cumulative area and remaining unsold balance in the mutation ledger (নামজারি খতিয়ান) at the AC Land office."

def check_over_conveyance(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Sums the total area conveyed by a seller across all deeds and compares against
    the seller's recorded holding baseline area, respecting tolerance.
    """
    deeds = [r for r in snapshot.records if not r.is_archived and r.record_type == "deed"]
    if not deeds:
        return []

    # Find holding baseline record (khatian or survey reference)
    khatians = [
        r for r in snapshot.records
        if not r.is_archived and r.record_type in ("khatian", "survey_reference")
    ]
    if not khatians:
        return [
            Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                summary="Holding baseline area missing",
                explanation="No khatian or root holding record supplied to establish total holding area capacity.",
                source_record_ids=[d.id for d in deeds],
                compared_fields=["area_value"],
                observed_values={},
                limitations=LIMITATION,
                recommended_next_step="Supply root khatian record to establish baseline plot area.",
            )
        ]

    # Use primary khatian area
    primary_khatian = khatians[0]
    holding_sqft = normalize_area_to_sqft(primary_khatian.area_value, primary_khatian.area_unit, config)
    if holding_sqft is None:
        return [
            Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                summary="Holding baseline area missing or unparseable",
                explanation=f"Holding area on {primary_khatian.source_reference} could not be normalized to square feet.",
                source_record_ids=[primary_khatian.id],
                compared_fields=["area_value", "area_unit"],
                observed_values={primary_khatian.source_reference: f"{primary_khatian.area_value} {primary_khatian.area_unit}"},
                limitations=LIMITATION,
                recommended_next_step="Confirm holding area on certified khatian.",
                evidence=[EvidenceRef(primary_khatian.id, "area_value", str(primary_khatian.area_value), primary_khatian.source_reference)],
            )
        ]

    # Group deeds by seller
    by_seller: Dict[str, List[RecordSnapshot]] = {}
    for d in deeds:
        s_id = d.seller_party_id or "unassigned_seller"
        by_seller.setdefault(s_id, []).append(d)

    findings: List[Finding] = []

    for s_id, seller_deeds in by_seller.items():
        seller = snapshot.get_party(s_id) if s_id != "unassigned_seller" else None
        seller_label = seller.label if seller else "Seller"

        # Check if any deed lacks area
        lacks_area = [d for d in seller_deeds if d.area_value is None or not d.area_unit]
        if lacks_area:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.REVIEW_REQUIRED.value,
                    summary=f"One or more deeds lack numeric area ({seller_label})",
                    explanation=(
                        f"Cumulative conveyance for {seller_label} cannot be fully verified because "
                        f"{', '.join(d.source_reference for d in lacks_area)} lack numeric area."
                    ),
                    source_record_ids=[d.id for d in seller_deeds],
                    compared_fields=["area_value"],
                    observed_values={"deeds_missing_area": [d.source_reference for d in lacks_area]},
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[EvidenceRef(d.id, "area_value", str(d.area_value), d.source_reference) for d in lacks_area],
                )
            )
            continue

        # Calculate sum of conveyed areas in sq ft
        total_sqft = 0.0
        conveyed_refs = []
        for d in seller_deeds:
            sq = normalize_area_to_sqft(d.area_value, d.area_unit, config) or 0.0
            total_sqft += sq
            conveyed_refs.append(f"{d.source_reference} ({d.area_value} {d.area_unit})")

        # Convert back to decimal for readable display (1 decimal = 435.6 sq ft)
        total_dec = round(total_sqft / 435.6, 2)
        holding_dec = round(holding_sqft / 435.6, 2)
        tol_pct = config.area_tolerance_pct
        tol_limit = holding_sqft * (1.0 + (tol_pct / 100.0))

        ref_list = " and ".join(d.source_reference for d in seller_deeds)
        src_ids = [primary_khatian.id] + [d.id for d in seller_deeds]

        if total_sqft > tol_limit:
            # Over-conveyance detected (Conflict)
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.CONFLICT_DETECTED.value,
                    summary=f"Aggregate conveyed area exceeds recorded holding ({total_dec} vs {holding_dec} decimal)",
                    explanation=(
                        f"{ref_list} together convey {total_dec} decimal out of a recorded holding of "
                        f"{holding_dec} decimal (tolerance {tol_pct}%). Confirm areas "
                        f"on the original deeds through an authorized source."
                    ),
                    source_record_ids=src_ids,
                    compared_fields=["area_value", "area_unit"],
                    observed_values={
                        "holding_area_decimal": holding_dec,
                        "conveyed_total_decimal": total_dec,
                        "tolerance_pct": tol_pct,
                        "deeds": conveyed_refs,
                    },
                    limitations=LIMITATION,
                    recommended_next_step="Confirm areas on the original deeds through an authorized source.",
                    evidence=[
                        EvidenceRef(primary_khatian.id, "area_value", str(primary_khatian.area_value), primary_khatian.source_reference)
                    ] + [
                        EvidenceRef(d.id, "area_value", str(d.area_value), d.source_reference)
                        for d in seller_deeds
                    ],
                )
            )
        elif total_sqft > holding_sqft:
            # Slightly exceeds holding area but within tolerance margin
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.REVIEW_REQUIRED.value,
                    summary=f"Conveyed area exceeds holding area but within tolerance margin ({total_dec} vs {holding_dec} decimal)",
                    explanation=(
                        f"{ref_list} together convey {total_dec} decimal, slightly exceeding recorded holding "
                        f"of {holding_dec} decimal, but within the allowed {tol_pct}% tolerance margin. Review recommended."
                    ),
                    source_record_ids=src_ids,
                    compared_fields=["area_value"],
                    observed_values={
                        "holding_area_decimal": holding_dec,
                        "conveyed_total_decimal": total_dec,
                    },
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(d.id, "area_value", str(d.area_value), d.source_reference)
                        for d in seller_deeds
                    ],
                )
            )
        else:
            # Within holding area (no over-conveyance)
            transfer_label = "transfer" if len(seller_deeds) == 1 else "transfers"
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                    summary=f"{seller_label} conveyed {total_dec:.1f} of {holding_dec:.1f} decimal ({len(seller_deeds)} {transfer_label})",
                    explanation="The entered transfer area does not exceed the holding area (≤).",
                    source_record_ids=src_ids,
                    compared_fields=["area_value"],
                    observed_values={
                        "holding_area_decimal": holding_dec,
                        "conveyed_total_decimal": total_dec,
                    },
                    limitations=LIMITATION,
                    recommended_next_step="",
                    evidence=[
                        EvidenceRef(d.id, "area_value", str(d.area_value), d.source_reference)
                        for d in seller_deeds
                    ],
                )
            )

    return findings
