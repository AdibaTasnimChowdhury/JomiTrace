"""JT-R10: Document reuse screening (Tier C)."""
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

RULE_CODE = "JT-R10"
CATEGORY = RuleCategory.DOCUMENT_REUSE.value
LIMITATION = "Compares supplied document hashes and registration identifiers only; does not authenticate physical documents."
RECOMMENDATION = "Inspect physical volume books and certified copies to verify document registration."

def check_document_reuse(snapshot: CaseSnapshot, config: CaseConfig) -> List[Finding]:
    """
    Screens for document reuse: same SHA-256 hash or deed/mutation number
    used across different parties or conflicting record details.
    """
    records = [r for r in snapshot.records if not r.is_archived]
    if len(records) < 2:
        return []

    findings: List[Finding] = []

    # Check identical SHA-256 hashes
    by_hash: Dict[str, List[RecordSnapshot]] = {}
    for r in records:
        if r.document_sha256:
            by_hash.setdefault(r.document_sha256.strip(), []).append(r)

    for sha, hashed_recs in by_hash.items():
        if len(hashed_recs) >= 2:
            parties = {r.seller_party_id for r in hashed_recs} | {r.buyer_party_id for r in hashed_recs}
            if len(parties) > 2:  # different parties
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.CONFLICT_DETECTED.value,
                        summary=f"Identical document hash shared across different parties ({sha[:8]}...)",
                        explanation=(
                            f"Multiple records ({', '.join(r.source_reference for r in hashed_recs)}) share the "
                            f"identical document SHA-256 hash ({sha[:16]}...) despite referencing different parties or holdings."
                        ),
                        source_record_ids=[r.id for r in hashed_recs],
                        compared_fields=["document_sha256", "seller_party_id", "buyer_party_id"],
                        observed_values={"sha256": sha, "records": [r.source_reference for r in hashed_recs]},
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[EvidenceRef(r.id, "document_sha256", sha, r.source_reference) for r in hashed_recs],
                    )
                )

    # Check identical deed numbers with differing details
    by_deed_no: Dict[str, List[RecordSnapshot]] = {}
    for r in records:
        if r.record_type == "deed" and r.deed_no:
            by_deed_no.setdefault(r.deed_no.strip(), []).append(r)

    for d_no, d_recs in by_deed_no.items():
        if len(d_recs) >= 2:
            dags = {r.dag_no for r in d_recs if r.dag_no}
            if len(dags) > 1:
                findings.append(
                    Finding(
                        rule_code=RULE_CODE,
                        category=CATEGORY,
                        status=RuleStatus.REVIEW_REQUIRED.value,
                        summary=f"Same deed number ({d_no}) cites different plots",
                        explanation=(
                            f"Deed number '{d_no}' is cited on multiple records ({', '.join(r.source_reference for r in d_recs)}) "
                            f"with different plot references ({', '.join(dags)})."
                        ),
                        source_record_ids=[r.id for r in d_recs],
                        compared_fields=["deed_no", "dag_no"],
                        observed_values={"deed_no": d_no, "plots": list(dags)},
                        limitations=LIMITATION,
                        recommended_next_step=RECOMMENDATION,
                        evidence=[EvidenceRef(r.id, "deed_no", d_no, r.source_reference) for r in d_recs],
                    )
                )

    return findings
