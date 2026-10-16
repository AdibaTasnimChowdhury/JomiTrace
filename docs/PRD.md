# Product requirements document (v3)

## Overview
JomiTrace is an explainable land-record screening workspace for the LandTech 2026 track *Digital Land Records, Verification & Digitization*, **P3 Fraud & Double-Selling Detection** with a **P5 Citizen Pre-Purchase** entry flow. It compares user-entered record metadata, reconstructs the documented transfer sequence, and returns evidence-linked findings for human review.

It is not an official registry, legal authority, or fraud verdict engine.

## Problem (Bangladesh context)
Land disputes are among the most common civil cases. They often trace to forged or conflicting deeds, khatians that differ across survey generations (CS, SA, RS, BS), and records split between the sub-registry office (registration) and the AC Land office (mutation). A buyer must manually cross-read these. Mismatches are easy to miss, and a naive tool would also raise false alarms (different dag numbers across surveys, partial sales, area units such as decimal vs katha).

## Users
- Citizens preparing for a purchase (P5), with a checklist of what to verify and where.
- Reviewers and case workers who must document what was compared.
- Judges and students demonstrating a repeatable workflow.

## Principles
1. Evidence before conclusions. 2. Deterministic, explainable rules. 3. Explicit uncertainty. 4. Synthetic data only. 5. Dense, readable layout. 6. Separate *missing*, *inconsistent*, and *possibly suspicious*. 7. Avoid false positives that erode trust (survey series, partial sales, units).

## MVP
**Tier A (Round 1, due 18 Oct 2026)**
1. **Case creation:** case code, location references, notes, status, synthetic label.
2. **Structured record entry:** deed, khatian/porcha (with survey series CS/SA/RS/BS), mutation, DCR/tax receipt, other. Unknown stays unknown. Original area + unit preserved.
3. **Rule engine R01-R09** (see `RULES.md`), each with rule code, compared fields, observed values, source links, limitations, next step.
4. **Timeline:** chronological nodes; undated events stay "Date not supplied"; gap and overlap markers.
5. **Comparison grid** with conflicting values highlighted and flat "Inspect evidence" actions.
6. **Printable report** with limitations statement and the analysis run it came from.
7. **Scenario loader** with S1-S8 fictional cases.
8. **Submission artefacts** (concept note, README, video): `SUBMISSION_PACK.md`.

9. Party alias confirmation and plot crosswalk screens.
10. Verification checklist (pending / reviewer-completed / not applicable).

**Tier B (Round 1 if time allows, otherwise before the final)**
11. Analysis run history and stale-findings banner.
12. Bangla/English toggle for UI chrome, record-type names, report headings.
13. Live deployment link.

**Tier C (stretch)**
14. R10 document-reuse check (SHA-256 of a synthetic file; same deed number across cases).
15. Cross-case plot index over the synthetic registry (shows system-level double-sale detection).

## P3 coverage map
| P3 text | Covered by |
|---|---|
| Forged documents | R10 (Tier C), R06 date conflicts, R07(d) citing a deed not in the case; **no authenticity claim**; checklist asks for authorized original check |
| Same plot sold to multiple buyers | R04, R05 |
| Suspicious rapid transfers | R08 |
| Registration vs. mutation mismatch | R07 |

## Main user journey
Dashboard ledger → load scenario or create case → enter records → confirm parties (and crosswalk if needed) → run checks → inspect findings and timeline → compare records → update checklist → export report.

## Frontend requirements
Unchanged from v2 except: amber text uses `#92400E`; Bangla font fallback; language toggle; scenario loader on empty dashboard and in the case menu; no film-grain overlay.

## Out of scope
OCR, live government integrations, scraping or bulk queries, penetration testing, blockchain, GIS, legal verdicts, inheritance share calculation, QR verification, predictive fraud probability, any single safety score.

## Demo success criteria
Judges follow one case end to end in under 3 minutes; two or more discrepancies explained with exact fields; one scenario shows a **false positive avoided** (S3 partial sale or S4 unit conversion); report exports; synthetic label and limitations visible.
