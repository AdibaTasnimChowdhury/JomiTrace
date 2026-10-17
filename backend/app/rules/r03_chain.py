"""JT-R03: Chain continuity and unbroken title screening."""
from datetime import date
from typing import List, Optional
from app.rules.base import (
    CaseConfig,
    CaseSnapshot,
    EventSnapshot,
    EvidenceRef,
    Finding,
    RuleCategory,
    RuleStatus,
)

RULE_CODE = "JT-R03"
CATEGORY = RuleCategory.CHAIN_GAP.value
LIMITATION = "Evaluates only supplied documents within this case; inheritance, unrecorded oral partitions, and external title deeds are not in scope."
RECOMMENDATION = "Verify chain of title (baya deeds / পিট দলিল) backwards to the relevant survey khatian at the Sub-Registry office."

def _extract_ordered_events(snapshot: CaseSnapshot) -> List[EventSnapshot]:
    """Retrieve or construct chronological transfer events from snapshot records."""
    if snapshot.events:
        return sorted(
            snapshot.events,
            key=lambda e: (e.sequence_index, str(e.event_date or "9999-12-31")),
        )

    # If no explicit events, derive from deeds and mutations
    derived: List[EventSnapshot] = []
    records = [
        r for r in snapshot.records
        if not r.is_archived and r.record_type in ("deed", "mutation")
    ]
    records.sort(key=lambda r: (r.record_date or r.registration_date or date.max))

    for idx, r in enumerate(records):
        derived.append(
            EventSnapshot(
                id=f"derived-{r.id}",
                source_record_id=r.id,
                event_date=r.record_date or r.registration_date,
                transfer_type="sale" if r.record_type == "deed" else "mutation",
                from_party_id=r.seller_party_id,
                to_party_id=r.buyer_party_id or r.owner_party_id,
                area_conveyed_value=r.area_value,
                area_unit=r.area_unit,
                sequence_index=idx,
                derived=True,
            )
        )
    return derived

def check_chain_continuity(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Evaluates whether each transfer in the chronological chain derives title from
    the preceding confirmed owner, identifying chain gaps and unexplained sellers.
    """
    events = _extract_ordered_events(snapshot)
    if not events:
        return []

    findings: List[Finding] = []

    # Check for missing parties on records
    records_with_missing_parties = [
        r for r in snapshot.records
        if not r.is_archived
        and r.record_type == "deed"
        and (not r.seller_party_id or not r.buyer_party_id)
    ]
    if records_with_missing_parties:
        ref_names = [r.source_reference for r in records_with_missing_parties]
        findings.append(
            Finding(
                rule_code=RULE_CODE,
                category=CATEGORY,
                status=RuleStatus.INSUFFICIENT_INFORMATION.value,
                summary=f"Parties not entered on {', '.join(ref_names)}",
                explanation=(
                    f"Transfer continuity cannot be verified because buyer or seller parties "
                    f"are not entered on {', '.join(ref_names)}."
                ),
                source_record_ids=[r.id for r in records_with_missing_parties],
                compared_fields=["seller_party_id", "buyer_party_id"],
                observed_values={r.source_reference: "parties missing" for r in records_with_missing_parties},
                limitations=LIMITATION,
                recommended_next_step="Confirm parties and enter party assignments for all deeds.",
                evidence=[
                    EvidenceRef(r.id, "seller_party_id", r.seller_party_id, r.source_reference)
                    for r in records_with_missing_parties
                ],
            )
        )
        return findings

    # Root khatian owners
    khatian_owners = {
        r.owner_party_id for r in snapshot.records
        if not r.is_archived and r.record_type in ("khatian", "survey_reference") and r.owner_party_id
    }

    # Track all participants seen in prior events
    prior_participants = set(khatian_owners)
    prior_buyers = set()

    for i, event in enumerate(events):
        rec = snapshot.get_record(event.source_record_id)
        ref_label = rec.source_reference if rec else f"Event {i+1}"
        from_party = snapshot.get_party(event.from_party_id)
        to_party = snapshot.get_party(event.to_party_id)
        from_label = from_party.label if from_party else "Unknown Seller"
        to_label = to_party.label if to_party else "Unknown Buyer"

        # Check alias confirmation
        if from_party:
            unconfirmed_aliases = [a for a in from_party.aliases if not a.confirmed_by_reviewer]
            if unconfirmed_aliases:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary=f"Party alias for {from_label} unconfirmed",
                        explanation=(
                            f"Seller in {ref_label} ({from_label}) has unconfirmed name aliases awaiting reviewer confirmation."
                        ),
                        source_record_ids=[rec.id] if rec else [],
                        compared_fields=["seller_party_id"],
                        observed_values={"party_label": from_label, "unconfirmed": [a.alias_text for a in unconfirmed_aliases]},
                        limitations=LIMITATION,
                        recommended_next_step="Confirm party aliases on the party confirmation screen.",
                        evidence=[EvidenceRef(rec.id, "seller_party_id", from_label, ref_label)] if rec else [],
                    )
                )

        if i == 0:
            # Check if root seller is documented in khatian or has predecessor
            if event.from_party_id and event.from_party_id in khatian_owners:
                owner_record = next(
                    (r for r in snapshot.records
                     if not r.is_archived
                     and r.record_type in ("khatian", "survey_reference")
                     and r.owner_party_id == event.from_party_id),
                    None,
                )
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                        summary=f"Seller of {ref_label} matches owner named in the khatian",
                        explanation=(
                            f"Seller of {ref_label} ({from_label}) matches the owner named in the supplied khatian record. "
                            "This comparison does not establish legal title."
                        ),
                        source_record_ids=[r.id for r in [rec, owner_record] if r],
                        compared_fields=["seller_party_id", "owner_party_id"],
                        observed_values={"seller": from_label, "khatian_owner": from_label},
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=(
                            [EvidenceRef(rec.id, "seller_party_id", from_label, ref_label)] if rec else []
                        ) + (
                            [EvidenceRef(owner_record.id, "owner_party_id", from_label, owner_record.source_reference)]
                            if owner_record else []
                        ),
                    )
                )
            else:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary=f"Initial transfer {ref_label} has no documented predecessor title",
                        explanation=(
                            f"The first documented event ({ref_label}) conveys property from {from_label} to {to_label}, "
                            f"but no prior root title record or khatian is supplied in the case."
                        ),
                        source_record_ids=[rec.id] if rec else [],
                        compared_fields=["seller_party_id"],
                        observed_values={"seller": from_label, "buyer": to_label},
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[EvidenceRef(rec.id, "seller_party_id", from_label, ref_label)] if rec else [],
                    )
                )
            if event.from_party_id:
                prior_participants.add(event.from_party_id)
            if event.to_party_id:
                prior_participants.add(event.to_party_id)
                prior_buyers.add(event.to_party_id)
            continue

        prev_event = events[i - 1]
        prev_rec = snapshot.get_record(prev_event.source_record_id)
        prev_label = prev_rec.source_reference if prev_rec else f"Event {i}"
        prev_to_party = snapshot.get_party(prev_event.to_party_id)
        prev_to_label = prev_to_party.label if prev_to_party else "Unknown"

        # Seller of N must equal buyer/owner of N-1
        if event.from_party_id and prev_event.to_party_id and event.from_party_id == prev_event.to_party_id:
            findings.append(
                Finding(
                    rule_code=RULE_CODE,
                    category=CATEGORY,
                    status=RuleStatus.NO_INCONSISTENCY_FOUND.value,
                    summary=f"Chain continuous from {prev_label} to {ref_label}",
                    explanation=(
                        f"Seller of {ref_label} ({from_label}) matches the confirmed purchaser "
                        f"of previous record {prev_label} ({prev_to_label})."
                    ),
                    source_record_ids=[r.id for r in [prev_rec, rec] if r],
                    compared_fields=["seller_party_id", "buyer_party_id"],
                    observed_values={"preceding_buyer": prev_to_label, "current_seller": from_label},
                    limitations=LIMITATION,
                    recommended_next_step=RECOMMENDATION,
                    evidence=[
                        EvidenceRef(prev_rec.id, "buyer_party_id", prev_to_label, prev_label) if prev_rec else None,
                        EvidenceRef(rec.id, "seller_party_id", from_label, ref_label) if rec else None,
                    ],
                )
            )
        else:
            # Broken continuity
            # If seller never appeared anywhere in earlier events (like S5 outsider):
            if event.from_party_id not in prior_participants:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary=f"Seller in {ref_label} has no documented prior acquisition in case chain",
                        explanation=(
                            f"Seller of {ref_label} ({from_label}) never appears as a purchaser or recorded owner "
                            f"in any earlier case records. A predecessor link may be missing."
                        ),
                        source_record_ids=[r.id for r in [prev_rec, rec] if r],
                        compared_fields=["seller_party_id"],
                        observed_values={"current_seller": from_label, "preceding_owner": prev_to_label},
                        limitations=LIMITATION,
                        recommended_next_step="Locate intervening baya deed or inheritance document connecting the seller.",
                        evidence=[
                            EvidenceRef(rec.id, "seller_party_id", from_label, ref_label) if rec else None,
                        ],
                    )
                )
            else:
                # Seller is a confirmed party who already sold or is not the owner (like S2 duplicate deed) -> conflict!
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.CONFLICT_DETECTED.value,
                        summary=f"Chain broken: seller in {ref_label} differs from predecessor owner",
                        explanation=(
                            f"Seller of {ref_label} ({from_label}) does not match the confirmed purchaser "
                            f"of immediate predecessor {prev_label} ({prev_to_label})."
                        ),
                        source_record_ids=[r.id for r in [prev_rec, rec] if r],
                        compared_fields=["seller_party_id", "buyer_party_id"],
                        observed_values={"preceding_buyer": prev_to_label, "current_seller": from_label},
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[
                            EvidenceRef(prev_rec.id, "buyer_party_id", prev_to_label, prev_label) if prev_rec else None,
                            EvidenceRef(rec.id, "seller_party_id", from_label, ref_label) if rec else None,
                        ],
                    )
                )

        if event.from_party_id:
            prior_participants.add(event.from_party_id)
        if event.to_party_id:
            prior_participants.add(event.to_party_id)
            prior_buyers.add(event.to_party_id)

    # Filter any None in evidence
    for f in findings:
        f.evidence = [e for e in f.evidence if e is not None]

    return findings
