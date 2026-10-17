"""JT-R08: Rapid re-transfer screening rule."""
from typing import List
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EvidenceRef,
    Finding,
    RuleCategory,
    RuleStatus,
)
from app.rules.r03_chain import _extract_ordered_events

RULE_CODE = "JT-R08"
CATEGORY = RuleCategory.RAPID_TRANSFER.value
LIMITATION = "Rapid re-transfer is not unlawful per se; emergency liquidations, familial reorganizations, and commercial resales may occur legitimately."
RECOMMENDATION = "Review the registered transfer dates through an authorized records office."

def check_rapid_transfer(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Screens for rapid re-transfers occurring within the configured rapid_transfer_days window.
    NEVER produces conflict_detected: process signal only.
    """
    events = _extract_ordered_events(snapshot)
    if len(events) < 2:
        return []

    findings: List[Finding] = []
    window = config.rapid_transfer_days

    for i in range(1, len(events)):
        prev_ev = events[i - 1]
        curr_ev = events[i]

        prev_rec = snapshot.get_record(prev_ev.source_record_id)
        curr_rec = snapshot.get_record(curr_ev.source_record_id)

        d_prev = prev_ev.event_date
        d_curr = curr_ev.event_date

        if not d_prev or not d_curr:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                    summary="Event dates missing for rapid transfer assessment",
                    explanation="One or more events in the transfer sequence lack dates, preventing interval calculation.",
                    source_record_ids=[r.id for r in [prev_rec, curr_rec] if r],
                    compared_fields=["event_date"],
                    observed_values={
                        "prior_date": str(d_prev) if d_prev else None,
                        "current_date": str(d_curr) if d_curr else None,
                    },
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                )
            )
            continue

        days_diff = (d_curr - d_prev).days
        ref_prev = prev_rec.source_reference if prev_rec else f"Event {i}"
        ref_curr = curr_rec.source_reference if curr_rec else f"Event {i+1}"

        if 0 <= days_diff <= window:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.REVIEW_REQUIRED.value,
                    summary=f"Rapid re-transfer within {days_diff} days (threshold: {window} days)",
                    explanation=(
                        f"Holding transferred in {ref_curr} ({d_curr}) within {days_diff} days of "
                        f"prior transfer in {ref_prev} ({d_prev}). Monitoring threshold is {window} days. "
                        f"Review transfer dates and the supporting records."
                    ),
                    source_record_ids=[r.id for r in [prev_rec, curr_rec] if r],
                    compared_fields=["event_date", "record_date"],
                    observed_values={
                        "prior_event": ref_prev,
                        "current_event": ref_curr,
                        "days_elapsed": days_diff,
                        "threshold_days": window,
                    },
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(prev_rec.id, "event_date", str(d_prev), ref_prev) if prev_rec else None,
                        EvidenceRef(curr_rec.id, "event_date", str(d_curr), ref_curr) if curr_rec else None,
                    ],
                )
            )
        else:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                    summary=f"Transfer interval ({days_diff} days) is outside the {window}-day rapid re-transfer window",
                    explanation=(
                        f"Interval of {days_diff} days between {ref_prev} and {ref_curr} exceeds "
                        f"the {window}-day rapid re-transfer monitoring window."
                    ),
                    source_record_ids=[r.id for r in [prev_rec, curr_rec] if r],
                    compared_fields=["event_date"],
                    observed_values={"days_elapsed": days_diff, "threshold_days": window},
                    limitations=LIMITATION,
                    recommended_next_step="",
                    evidence=[
                        EvidenceRef(prev_rec.id, "registration_date", str(d_prev), ref_prev) if prev_rec else None,
                        EvidenceRef(curr_rec.id, "registration_date", str(d_curr), ref_curr) if curr_rec else None,
                    ],
                )
            )

    # Filter any None in evidence
    for f in findings:
        f.evidence = [e for e in f.evidence if e is not None]

    return findings
