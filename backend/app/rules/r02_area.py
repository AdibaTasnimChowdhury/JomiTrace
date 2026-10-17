"""JT-R02: Recorded area discrepancy screening."""
from typing import List
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RuleCategory,
    RuleStatus,
)
from app.rules.area import compare_areas, is_regional_unit, normalize_area_to_sqft

RULE_CODE = "JT-R02"
CATEGORY = RuleCategory.AREA_MISMATCH.value
LIMITATION = "Areas are as entered; ground physical possession and boundary shapefiles are not assessed."
RECOMMENDATION = "Inspect certified copies of deeds and khatians to confirm recorded area."

def check_recorded_area(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Compares normalized recorded areas pairwise across records in the case,
    accounting for unit conversions and allowable area tolerance.
    """
    records = [r for r in snapshot.records if not r.is_archived and r.record_type != "dcr"]
    if len(records) < 2:
        return []

    findings: List[Finding] = []
    compared_pairs = set()

    for i in range(len(records)):
        for j in range(i + 1, len(records)):
            rec_a = records[i]
            rec_b = records[j]
            pair_key = tuple(sorted([rec_a.id, rec_b.id]))
            if pair_key in compared_pairs:
                continue
            compared_pairs.add(pair_key)

            # Check for missing area or unit
            if rec_a.area_value is None or not rec_a.area_unit or rec_b.area_value is None or not rec_b.area_unit:
                missing_records = []
                if rec_a.area_value is None or not rec_a.area_unit:
                    missing_records.append(rec_a.source_reference)
                if rec_b.area_value is None or not rec_b.area_unit:
                    missing_records.append(rec_b.source_reference)

                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                        summary=f"Area or unit missing on {', '.join(missing_records)}",
                        explanation=(
                            f"Area comparison between {rec_a.source_reference} and {rec_b.source_reference} "
                            f"cannot be completed because area value or unit is not supplied on {', '.join(missing_records)}."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["area_value", "area_unit"],
                        observed_values={
                            f"{rec_a.source_reference}_area": f"{rec_a.area_value} {rec_a.area_unit or ''}".strip(),
                            f"{rec_b.source_reference}_area": f"{rec_b.area_value} {rec_b.area_unit or ''}".strip(),
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(rec_a.id, "area_value", str(rec_a.area_value), rec_a.source_reference),
                            EvidenceRef(rec_b.id, "area_value", str(rec_b.area_value), rec_b.source_reference),
                        ],
                    )
                )
                continue

            # Check for regional / ambiguous units without conversion basis
            regional_a = is_regional_unit(rec_a.area_unit) and normalize_area_to_sqft(rec_a.area_value, rec_a.area_unit, config) is None
            regional_b = is_regional_unit(rec_b.area_unit) and normalize_area_to_sqft(rec_b.area_value, rec_b.area_unit, config) is None

            if regional_a or regional_b:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary="Regional area unit requires reviewer conversion basis",
                        explanation=(
                            f"{rec_a.source_reference} ({rec_a.area_value} {rec_a.area_unit}) and "
                            f"{rec_b.source_reference} ({rec_b.area_value} {rec_b.area_unit}) use regional area units. "
                            f"Reviewer must select a regional conversion basis (e.g. katha_sqft) for this upazila."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["area_unit", "area_value"],
                        observed_values={
                            f"{rec_a.source_reference}_unit": rec_a.area_unit,
                            f"{rec_b.source_reference}_unit": rec_b.area_unit,
                        },
                        limitations=LIMITATION,
                        recommended_next_step="Select regional katha/bigha basis in case configuration.",
                        evidence=[
                            EvidenceRef(rec_a.id, "area_unit", rec_a.area_unit, rec_a.source_reference),
                            EvidenceRef(rec_b.id, "area_unit", rec_b.area_unit, rec_b.source_reference),
                        ],
                    )
                )
                continue

            sqft_a, sqft_b, diff_pct, within_tol = compare_areas(
                rec_a.area_value,
                rec_a.area_unit,
                rec_b.area_value,
                rec_b.area_unit,
                config,
            )

            if diff_pct is None or within_tol is None:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                        summary="Unrecognized area unit prevents normalization",
                        explanation=(
                            f"Unable to normalize units '{rec_a.area_unit}' and/or '{rec_b.area_unit}' to square feet."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["area_unit"],
                        observed_values={
                            f"{rec_a.source_reference}_unit": rec_a.area_unit,
                            f"{rec_b.source_reference}_unit": rec_b.area_unit,
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(rec_a.id, "area_unit", rec_a.area_unit, rec_a.source_reference),
                            EvidenceRef(rec_b.id, "area_unit", rec_b.area_unit, rec_b.source_reference),
                        ],
                    )
                )
            elif not within_tol:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.CONFLICT_DETECTED.value,
                        summary=f"Area difference ({diff_pct}%) exceeds {config.area_tolerance_pct}% tolerance",
                        explanation=(
                            f"{rec_a.source_reference} ({rec_a.area_value} {rec_a.area_unit} = {sqft_a:.1f} sq ft) "
                            f"and {rec_b.source_reference} ({rec_b.area_value} {rec_b.area_unit} = {sqft_b:.1f} sq ft) "
                            f"differ by {diff_pct}%, which exceeds allowable tolerance ({config.area_tolerance_pct}%)."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["area_value", "area_unit"],
                        observed_values={
                            f"{rec_a.source_reference}_original": f"{rec_a.area_value} {rec_a.area_unit}",
                            f"{rec_b.source_reference}_original": f"{rec_b.area_value} {rec_b.area_unit}",
                            f"{rec_a.source_reference}_sqft": sqft_a,
                            f"{rec_b.source_reference}_sqft": sqft_b,
                            "diff_pct": diff_pct,
                            "tolerance_pct": config.area_tolerance_pct,
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(rec_a.id, "area_value", str(rec_a.area_value), rec_a.source_reference),
                            EvidenceRef(rec_b.id, "area_value", str(rec_b.area_value), rec_b.source_reference),
                        ],
                    )
                )
            else:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                        summary="Recorded areas agree within tolerance",
                        explanation=(
                            f"Normalized areas match within {config.area_tolerance_pct}% tolerance: "
                            f"{rec_a.source_reference} ({rec_a.area_value} {rec_a.area_unit}) vs "
                            f"{rec_b.source_reference} ({rec_b.area_value} {rec_b.area_unit})."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["area_value", "area_unit"],
                        observed_values={
                            f"{rec_a.source_reference}_original": f"{rec_a.area_value} {rec_a.area_unit}",
                            f"{rec_b.source_reference}_original": f"{rec_b.area_value} {rec_b.area_unit}",
                            "diff_pct": diff_pct,
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(rec_a.id, "area_value", str(rec_a.area_value), rec_a.source_reference),
                            EvidenceRef(rec_b.id, "area_value", str(rec_b.area_value), rec_b.source_reference),
                        ],
                    )
                )

    return findings
