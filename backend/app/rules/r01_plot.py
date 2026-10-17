"""JT-R01: Plot reference discrepancy screening."""
from typing import List, Tuple
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RecordSnapshot,
    RuleCategory,
    RuleStatus,
)

RULE_CODE = "JT-R01"
CATEGORY = RuleCategory.PLOT_MISMATCH.value
LIMITATION = "Checks are as entered; ground boundaries, map sheet distortions, and physical plot coordinates are not assessed."
RECOMMENDATION = "Verify plot numbers on certified mouza map sheets and khatians through the Upazila Land Office (AC Land)."

def check_plot_reference(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Compares plot/dag references between records in the same survey series,
    or across different survey series via reviewer-confirmed crosswalk entries.
    """
    records = [r for r in snapshot.records if not r.is_archived]
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

            # Check if dag_no is missing
            if not rec_a.dag_no or not rec_b.dag_no:
                missing_names = []
                if not rec_a.dag_no:
                    missing_names.append(rec_a.source_reference)
                if not rec_b.dag_no:
                    missing_names.append(rec_b.source_reference)
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                        summary=f"Plot reference missing on {', '.join(missing_names)}",
                        explanation=(
                            f"{rec_a.source_reference} and {rec_b.source_reference} cannot be compared "
                            f"because plot reference (dag) is not supplied on {', '.join(missing_names)}."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["dag_no"],
                        observed_values={
                            f"{rec_a.source_reference}_dag": rec_a.dag_no,
                            f"{rec_b.source_reference}_dag": rec_b.dag_no,
                        },
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                            EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                        ],
                    )
                )
                continue

            # Compare within the SAME survey series
            same_series = (
                rec_a.survey_series
                and rec_b.survey_series
                and rec_a.survey_series.upper() == rec_b.survey_series.upper()
            )

            if same_series:
                if rec_a.dag_no.strip() == rec_b.dag_no.strip():
                    findings.append(
                        Finding(
                            rule_code=RULE_CODE,
                            category=CATEGORY,
                            status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                            summary="Plot references agree within same survey series",
                            explanation=(
                                f"{rec_a.source_reference} and {rec_b.source_reference} both cite plot "
                                f"{rec_a.dag_no} in survey series {rec_a.survey_series}."
                            ),
                            source_record_ids=[rec_a.id, rec_b.id],
                            compared_fields=["dag_no", "survey_series"],
                            observed_values={
                                f"{rec_a.source_reference}_dag": rec_a.dag_no,
                                f"{rec_b.source_reference}_dag": rec_b.dag_no,
                                "survey_series": rec_a.survey_series,
                            },
                            limitations=LIMITATION,
                            recommended_next_step=RECOMMENDATION,
                            evidence=[
                                EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                                EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                            ],
                        )
                    )
                else:
                    findings.append(
                        Finding(
                            rule_code=RULE_CODE,
                            category=CATEGORY,
                            status=RuleStatus.CONFLICT_DETECTED.value,
                            summary="Conflicting plot numbers in same survey series",
                            explanation=(
                                f"{rec_a.source_reference} cites dag {rec_a.dag_no} while {rec_b.source_reference} "
                                f"cites dag {rec_b.dag_no} within the same {rec_a.survey_series} survey series."
                            ),
                            source_record_ids=[rec_a.id, rec_b.id],
                            compared_fields=["dag_no", "survey_series"],
                            observed_values={
                                f"{rec_a.source_reference}_dag": rec_a.dag_no,
                                f"{rec_b.source_reference}_dag": rec_b.dag_no,
                                "survey_series": rec_a.survey_series,
                            },
                            limitations=LIMITATION,
                            recommended_next_step=RECOMMENDATION,
                            evidence=[
                                EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                                EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                            ],
                        )
                    )
                continue

            # Cross-series comparison: check if survey series differs or is unspecified
            # Look up crosswalk mapping
            mapping_found = False
            for cw in snapshot.crosswalks:
                s_a, d_a = cw.series_a.upper(), cw.dag_a.strip()
                s_b, d_b = cw.series_b.upper(), cw.dag_b.strip()
                r_a_series = (rec_a.survey_series or "").upper()
                r_b_series = (rec_b.survey_series or "").upper()
                r_a_dag = rec_a.dag_no.strip()
                r_b_dag = rec_b.dag_no.strip()

                is_match = (
                    (s_a == r_a_series and d_a == r_a_dag and s_b == r_b_series and d_b == r_b_dag)
                    or (s_a == r_b_series and d_a == r_b_dag and s_b == r_a_series and d_b == r_a_dag)
                )

                if is_match:
                    mapping_found = True
                    if not cw.confirmed_by_reviewer:
                        findings.append(
                            Finding(
                                rule_code=RULE_CODE,
                                category=CATEGORY,
                                status=RuleStatus.REVIEW_REQUIRED.value,
                                summary="Cross-series plot mapping awaiting reviewer confirmation",
                                explanation=(
                                    f"A crosswalk mapping exists connecting {rec_a.source_reference} "
                                    f"({rec_a.survey_series} dag {rec_a.dag_no}) and {rec_b.source_reference} "
                                    f"({rec_b.survey_series} dag {rec_b.dag_no}), but is awaiting reviewer confirmation."
                                ),
                                source_record_ids=[rec_a.id, rec_b.id],
                                compared_fields=["dag_no", "survey_series"],
                                observed_values={
                                    "series_a": rec_a.survey_series,
                                    "dag_a": rec_a.dag_no,
                                    "series_b": rec_b.survey_series,
                                    "dag_b": rec_b.dag_no,
                                    "crosswalk_confirmed": False,
                                },
                                limitations=LIMITATION,
                                recommended_next_step="Confirm cross-series plot mapping in the plot crosswalk screen.",
                                evidence=[
                                    EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                                    EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                                ],
                            )
                        )
                    else:
                        findings.append(
                            Finding(
                                rule_code=RULE_CODE,
                                category=CATEGORY,
                                status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                                summary="Cross-series plot references verified via confirmed crosswalk",
                                explanation=(
                                    f"{rec_a.source_reference} ({rec_a.survey_series} dag {rec_a.dag_no}) and "
                                    f"{rec_b.source_reference} ({rec_b.survey_series} dag {rec_b.dag_no}) correspond "
                                    f"through a reviewer-confirmed survey crosswalk."
                                ),
                                source_record_ids=[rec_a.id, rec_b.id],
                                compared_fields=["dag_no", "survey_series"],
                                observed_values={
                                    "series_a": rec_a.survey_series,
                                    "dag_a": rec_a.dag_no,
                                    "series_b": rec_b.survey_series,
                                    "dag_b": rec_b.dag_no,
                                    "crosswalk_confirmed": True,
                                },
                                limitations=LIMITATION,
                                recommended_next_step=RECOMMENDATION,
                                evidence=[
                                    EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                                    EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                                ],
                            )
                        )
                    break

            if not mapping_found:
                # No crosswalk entered -> insufficient information (per RULES.md line 28 & 44)
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                        summary="Cross-series plot comparison unassessable without crosswalk",
                        explanation=(
                            f"{rec_a.source_reference} ({rec_a.survey_series or 'unknown series'}) and "
                            f"{rec_b.source_reference} ({rec_b.survey_series or 'unknown series'}) cite plots in different survey series. "
                            f"No crosswalk entered, so plot equality cannot be assessed."
                        ),
                        source_record_ids=[rec_a.id, rec_b.id],
                        compared_fields=["dag_no", "survey_series"],
                        observed_values={
                            f"{rec_a.source_reference}_series": rec_a.survey_series,
                            f"{rec_a.source_reference}_dag": rec_a.dag_no,
                            f"{rec_b.source_reference}_series": rec_b.survey_series,
                            f"{rec_b.source_reference}_dag": rec_b.dag_no,
                        },
                        limitations=LIMITATION,
                        recommended_next_step="Add a crosswalk entry linking the earlier and later survey dags.",
                        evidence=[
                            EvidenceRef(rec_a.id, "dag_no", rec_a.dag_no, rec_a.source_reference),
                            EvidenceRef(rec_b.id, "dag_no", rec_b.dag_no, rec_b.source_reference),
                        ],
                    )
                )

    return findings
