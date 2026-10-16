# Rule catalog (rule_version 0.2)

All rules are pure, deterministic functions: `(case_snapshot, config) -> list[Finding]`. No network, no randomness, no ML. Same snapshot + config = same findings. Every finding carries the contract fields from `TRD.md`.

## Shared definitions
- **Holding** = (survey_series, khatian_no, dag_no) or a reviewer-linked equivalent through the crosswalk.
- **Party** = reviewer-confirmed identity within a case. Rules compare `party_id`, never raw name strings.
- **Normalized area** = square feet, only when the unit converts exactly (see Area normalization).
- **Missing is never a match.** An unassessable rule returns `insufficient_information`.
- **Vocabulary:** use "possible", "review required", "conflict detected". Never "fraud", "forged", "illegal", "safe".

## Config defaults (shown in UI and in the report)
| Key | Default | Meaning |
|---|---|---|
| `area_tolerance_pct` | 1.0 | Allowed difference before area mismatch |
| `rapid_transfer_days` | 30 | Re-transfer window for R08 |
| `mutation_reference_days` | 45 | Reference interval for R07 only; **not** a legal deadline |
| `katha_sqft` / `bigha_sqft` | unset | Reviewer must choose basis; regional |

## Area normalization
Exact: 1 acre = 100 decimal (shotok); 1 decimal = 435.6 sq ft; 1 acre = 43,560 sq ft; 1 hectare = 107,639.1 sq ft; 1 sq m = 10.7639 sq ft.
Regional (verify locally, do not hard-code): katha, bigha, kani, gonda. Require the reviewer to select a basis per case; record it in the finding. If unset: `insufficient_information`.
Always store and display the original value and unit.

## Rules
| Code | Category | Logic | Conflict | Review required | Insufficient |
|---|---|---|---|---|---|
| **JT-R01** Plot reference | plot_mismatch | Compare dag between records in the **same survey series**, or across series through a crosswalk entry | Same series, different dag, records claim same holding | Cross-series with crosswalk but mapping unconfirmed | Cross-series with no crosswalk, or dag missing |
| **JT-R02** Recorded area | area_mismatch | Compare normalized areas pairwise for the same holding | Diff > tolerance | Units regional/ambiguous but both present | Area or unit missing |
| **JT-R03** Chain continuity | chain_gap | For consecutive events on a holding, seller of event N must equal buyer/owner of event N-1 (by `party_id`) | Seller of N is a different confirmed party than owner of N-1 | First event has no predecessor, or predecessor party unconfirmed | Parties not entered |
| **JT-R04** Competing transfers | possible_duplicate_transfer | Two or more transfers from the same seller of the same holding to different buyers with overlapping or unordered dates | Both are full-holding transfers | One is partial and remaining area is unknown | Dates or areas missing |
| **JT-R05** Aggregate conveyed area | over_conveyance | Sum area conveyed by one seller out of a holding vs. that seller's recorded area (tolerance applies) | Sum > holding area + tolerance | Sum within 5% under or over tolerance, or one deed lacks area | Holding area missing |
| **JT-R06** Date order | date_conflict | registration >= record date; mutation >= registration; events sorted; no future dates | Violated order | Date implausibly distant (config) | Dates missing |
| **JT-R07** Registration-mutation link | reg_mutation_mismatch | (a) registered deed with no mutation record after reference interval; (b) mutation beneficiary != deed buyer; (c) mutation area != deed area; (d) mutation cites a deed not in case | (b) or (c) beyond tolerance | (a), (d) | Mutation or deed not supplied |
| **JT-R08** Rapid re-transfer | rapid_transfer | Holding transferred again within `rapid_transfer_days` of previous event | none (never a conflict by itself) | Window breached | Dates missing |
| **JT-R09** Missing fields | missing_data | Per-record-type required field list vs. supplied | none | none | Any required field blank (lists which rules are blocked) |
| **JT-R10** Document reuse (Tier C) | document_reuse | Same SHA-256 or same deed/mutation number on records in different cases or under different parties | Same hash, different party/holding | Same number, different details | n/a |

R08 and R09 never produce `conflict_detected`: they are signals about process and completeness only.
R04 and R05 together prevent the main false positive: a legitimate partial sale to two buyers is **not** flagged unless the conveyed area exceeds the holding.

## Finding text templates (examples)
- R05 conflict: "Deeds D-102 and D-117 together convey 62.0 decimal out of a recorded holding of 50.0 decimal (tolerance 1%). Review required: confirm areas on the original deeds through an authorized source." Limitation: "Areas are as entered; boundaries and partial-plot descriptions are not assessed."
- R01 insufficient: "Khatian K-88 (RS) and Deed D-102 cite plots in different survey series. No crosswalk entered, so plot equality cannot be assessed."

## Case-level summary
Show counts per status, no score. Case banner: "Conflict detected (n)" if any, else "Review required (n)" if any, else "Insufficient information (n)" if any, else "No inconsistency found by these checks". The last line must be followed by the limitations sentence.

## Scenario fixtures and expected output (tests)
| ID | Scenario (fictional) | Expected |
|---|---|---|
| S1 | Clean 3-link chain, deed+mutation+DCR agree | All rules `no_inconsistency_found`; banner uses "by these checks" wording |
| S2 | Same seller, same full holding, two buyers, overlapping dates | R04 conflict; R03 conflict on the later deed |
| S3 | Seller owns 50 decimal; deeds convey 30 and 32 decimal | R05 conflict; R04 review required (not conflict); partial sale alone is not flagged |
| S4 | Deed in decimal, khatian in sq ft, values equal after conversion; second deed differs by 12% | R02 `no_inconsistency` for the first pair, conflict for the second; original units shown |
| S5 | Event 3 seller never appears as a buyer earlier | R03 review required (gap marker on timeline) |
| S6 | Deed registered; mutation names a different buyer, 20 days later re-transferred | R07(b) conflict; R08 review required |
| S7 | Fields blank | R09 insufficient; blocked rules listed; no rule treats blank as match |
| S8 | RS khatian vs BS deed, no crosswalk | R01 insufficient (not conflict) |

Each fixture lives in `backend/tests/fixtures/` as JSON. Add one test asserting determinism (run twice, compare serialized findings) and one asserting no finding text contains forbidden words (`fraud`, `forged`, `illegal`, `safe`, `verified owner`).
