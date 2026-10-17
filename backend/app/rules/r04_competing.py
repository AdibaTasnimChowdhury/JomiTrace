"""JT-R04: Competing and duplicate transfer screening."""
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

RULE_CODE = "JT-R04"
CATEGORY = RuleCategory.POSSIBLE_DUPLICATE_TRANSFER.value
LIMITATION = "Does not determine legal priority; court decrees, pending civil suits, and unregistered agreements are not tracked."
RECOMMENDATION = "Examine Sub-Registry Volume Books (বালাম বহি) for prior registered conveyances."

def check_competing_transfers(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Screens for competing transfers from the same seller of the same holding to different buyers.
    Distinguishes full-holding double conveyances from partial sales requiring capacity review.
    """
    deeds = [
        r for r in snapshot.records
        if not r.is_archived and r.record_type == "deed"
    ]
    if len(deeds) < 2:
        return []

    # Find baseline holding area from khatian if available
    holding_sqft = None
    khatians = [r for r in snapshot.records if not r.is_archived and r.record_type == "khatian"]
    for k in khatians:
        sq = normalize_area_to_sqft(k.area_value, k.area_unit, config)
        if sq is not None:
            holding_sqft = sq
            break

    # Group deeds by seller_party_id
    by_seller: Dict[str, List[RecordSnapshot]] = {}
    for d in deeds:
        if d.seller_party_id:
            by_seller.setdefault(d.seller_party_id, []).append(d)

    findings: List[Finding] = []

    for seller_id, seller_deeds in by_seller.items():
        if len(seller_deeds) < 2:
            continue

        seller = snapshot.get_party(seller_id)
        seller_label = seller.label if seller else "Unknown Seller"

        # Check for different buyers
        unique_buyers = set(d.buyer_party_id for d in seller_deeds if d.buyer_party_id)
        buyer_labels = {
            party_id: (snapshot.get_party(party_id).label if snapshot.get_party(party_id) else "Unknown Buyer")
            for party_id in sorted(unique_buyers)
        }
        if len(unique_buyers) < 2:
            # All deeds are to the same buyer or buyers unassigned
            continue

        # Check if dates or areas are missing
        has_missing_dates = any(not (d.record_date or d.registration_date) for d in seller_deeds)
        has_missing_areas = any(d.area_value is None or not d.area_unit for d in seller_deeds)

        if has_missing_dates or has_missing_areas:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                    summary=f"Dates or areas missing for competing transfer evaluation ({seller_label})",
                    explanation=(
                        f"Multiple deeds from {seller_label} to different buyers cannot be conclusively assessed "
                        f"because dates or area values are missing on one or more deeds."
                    ),
                    source_record_ids=[d.id for d in seller_deeds],
                    compared_fields=["record_date", "area_value", "buyer_party_id"],
                    observed_values={"seller": seller_label, "deeds": [d.source_reference for d in seller_deeds]},
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(d.id, "buyer_party_id", buyer_labels.get(d.buyer_party_id, "Not supplied"), d.source_reference)
                        for d in seller_deeds
                    ],
                )
            )
            continue

        # Check if both deeds represent full-holding transfers
        # If holding_sqft is known, compare each deed's area to holding_sqft
        # If holding_sqft is unknown, check if each deed conveys the entire declared plot without partial designation
        all_are_full_transfers = False
        if holding_sqft is not None:
            tol_factor = 1.0 - (config.area_tolerance_pct / 100.0)
            deed_sqfts = [normalize_area_to_sqft(d.area_value, d.area_unit, config) for d in seller_deeds]
            # If two or more deeds EACH convey >= 99% of the holding area
            full_count = sum(1 for sq in deed_sqfts if sq is not None and sq >= (holding_sqft * tol_factor))
            if full_count >= 2:
                all_are_full_transfers = True
        else:
            # If no khatian, check if deeds explicitly indicate full plot or have equal full area
            areas = [normalize_area_to_sqft(d.area_value, d.area_unit, config) for d in seller_deeds]
            if len(set(areas)) == 1 and areas[0] is not None:
                # Same area conveyances to multiple buyers
                all_are_full_transfers = True

        ref_list = ", ".join(d.source_reference for d in seller_deeds)
        if all_are_full_transfers:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.CONFLICT_DETECTED.value,
                    summary=f"Potential duplicate conveyance: multiple full-holding transfers by {seller_label}",
                    explanation=(
                        f"Seller {seller_label} executed multiple deeds ({ref_list}) conveying full holding "
                        f"interests to different purchasers."
                    ),
                    source_record_ids=[d.id for d in seller_deeds],
                    compared_fields=["seller_party_id", "buyer_party_id", "area_value"],
                    observed_values={
                        "seller": seller_label,
                        "deeds": [d.source_reference for d in seller_deeds],
                        "buyers": list(buyer_labels.values()),
                    },
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(d.id, "buyer_party_id", buyer_labels.get(d.buyer_party_id, "Not supplied"), d.source_reference)
                        for d in seller_deeds
                    ],
                )
            )
        else:
            # At least one transfer is partial
            # Check total conveyed vs holding
            total_sqft = sum(normalize_area_to_sqft(d.area_value, d.area_unit, config) or 0.0 for d in seller_deeds)
            if holding_sqft is not None and total_sqft > holding_sqft * (1.0 + config.area_tolerance_pct / 100.0):
                # S3 case: partial sales exceed holding -> R04 is review_required (not conflict, R05 handles conflict)
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary=f"Multiple partial transfers by {seller_label} require remaining balance check",
                        explanation=(
                            f"Seller {seller_label} executed multiple transfers ({ref_list}) to different buyers. "
                            f"Individual transfers are partial portions; verification of remaining land balance is required."
                        ),
                        source_record_ids=[d.id for d in seller_deeds],
                        compared_fields=["seller_party_id", "buyer_party_id", "area_value"],
                        observed_values={
                            "seller": seller_label,
                            "deeds": [d.source_reference for d in seller_deeds],
                            "partial_transfer": True,
                        },
                        limitations=LIMITATION,
                        recommended_next_step="Verify remaining unsold area in the seller's mutation khatian.",
                        evidence=[
                            EvidenceRef(d.id, "buyer_party_id", buyer_labels.get(d.buyer_party_id, "Not supplied"), d.source_reference)
                            for d in seller_deeds
                        ],
                    )
                )
            else:
                # Legitimate partial sales within holding area -> no inconsistency found!
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                        summary=f"Legitimate partial transfers within holding area ({seller_label})",
                        explanation=(
                            f"Seller {seller_label} transferred separate portions in deeds ({ref_list}) to different buyers. "
                            f"No duplicate full conveyance detected."
                        ),
                        source_record_ids=[d.id for d in seller_deeds],
                        compared_fields=["seller_party_id", "buyer_party_id", "area_value"],
                        observed_values={
                            "seller": seller_label,
                            "deeds": [d.source_reference for d in seller_deeds],
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(d.id, "buyer_party_id", buyer_labels.get(d.buyer_party_id, "Not supplied"), d.source_reference)
                            for d in seller_deeds
                        ],
                    )
                )

    return findings
