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
| **JT-R04** Competing transfers | possible_duplicate_transfer | Two or more transfers from the same seller of the same holding to different buyers | Same seller conveys the full holding to different buyers | Partial transfers need remaining-area review | Dates or areas missing |
| **JT-R05** Aggregate conveyed area | over_conveyance | Sum entered deed areas by seller and compare with recorded holding area (tolerance applies) | Sum > holding area + configured tolerance | Sum exceeds holding but stays within tolerance, or one deed lacks area | Holding area missing or unparseable |
| **JT-R06** Registration date order | date_conflict | Checks entered registration dates for future values and linked mutation-before-deed ordering | Future date or linked mutation registered before cited deed | none | Registration dates missing |
| **JT-R07** Registration-mutation link | reg_mutation_mismatch | (a) a deed lacks a linked mutation while other deeds have linked mutations; (b) beneficiary differs from deed buyer; (c) mutation area differs from deed area; (d) mutation cites a deed not in case | (b) or (c) beyond tolerance | (a), (d) | No mutation records supplied, or mutation cannot be linked to one deed among several |
| **JT-R08** Rapid re-transfer | rapid_transfer | Holding transferred again within `rapid_transfer_days` of previous event | none (never a conflict by itself) | Window breached | Dates missing |
| **JT-R09** Missing fields | missing_data | Per-record-type required field list vs. supplied | none | none | Any required field blank (reports missing metadata; downstream rule outcomes are shown separately) |
| **JT-R10** Document reuse | document_reuse | Within one case, compare entered SHA-256 hashes and repeated deed numbers with differing plot details | Same hash on records with different party assignments | Same deed number cites different plots | No records to compare |

R08 and R09 never produce `conflict_detected`: they are signals about process and completeness only.
R04 and R05 together prevent the main false positive: a legitimate partial sale to two buyers is **not** flagged unless the conveyed area exceeds the holding.

## Finding text templates (examples)
- R05 conflict: "Deeds D-102 and D-117 together convey 62.0 decimal out of a recorded holding of 50.0 decimal (tolerance 1%). Confirm areas on the original deeds through an authorized source." Status is conveyed separately; do not prefix explanation text with another status label. Limitation: "Areas are as entered; boundaries and partial-plot descriptions are not assessed."
- R01 insufficient: "Khatian K-88 (RS) and Deed D-102 cite plots in different survey series. No crosswalk entered, so plot equality cannot be assessed."

## Case-level summary
Show issue counts separately from check counts, with no score. Findings connected by the same source records are one issue with multiple checks. Case banner: "Conflict detected (n)" if any, else "Review required (n)" if any, else "Insufficient information (n)" if any, else "No inconsistency found by these checks". The last line must be followed by the limitations sentence.

## Scenario fixtures and expected output (tests)
| ID | Scenario (fictional) | Expected |
|---|---|---|
| S1 | Clean 3-link chain, deed+mutation+DCR agree | All rules `no_inconsistency_found`; banner uses "by these checks" wording |
| S2 | Same seller, same full holding, two buyers; metadata complete | One related issue across R03, R04, and R05 (three checks) |
| S3 | Seller owns 50 decimal; deeds convey 30 and 32 decimal | R05 conflict; R04 review required (not conflict); partial sale alone is not flagged |
| S4 | Deed in decimal, khatian in sq ft, values equal after conversion; second deed differs by 12%; linked mutations supplied | R02 `no_inconsistency` for the first pair, conflict for the second; original units shown |
| S5 | Event 3 seller never appears as a buyer earlier | R03 review required (gap marker on timeline) |
| S6 | Deed registered; mutation names a different buyer, 20 days later re-transferred | R07(b) conflict; R08 review required |
| S7 | Fields blank | R09 reports missing metadata; no rule treats blank as a match |
| S8 | RS khatian vs BS deed, no crosswalk | R01 insufficient (not conflict) |

Each fixture lives in `backend/tests/fixtures/` as JSON. Keep determinism and finding-language tests current; forbidden wording includes legal conclusions such as `fraud`, `forged`, `illegal`, `safe`, `verified owner`, `forensic`, `verdict`, and `tamper` when used to overstate screening capability.
