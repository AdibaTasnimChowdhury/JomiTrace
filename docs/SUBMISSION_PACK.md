# Submission pack

**Round 1 deadline: 18 Oct 2026** (rule book PDF says 16 Oct; keep the extension notice). Internal target: submit 17 Oct evening.

## 1. Rule-book compliance matrix
| Rule book | Requirement | JomiTrace status |
|---|---|---|
| §3 | State one problem statement in concept note | P3 primary, P5 secondary: say so on page 1 |
| §4 | 2 students + faculty mentor + industry mentor | List all four in concept note |
| §7 | Original work, licences respected, sources credited | README "Credits and licences" |
| §7.4 | Commit history | Keep intact |
| §7.5 | Changes since Round 1 in README | Add section before final |
| §8.1-8.2 | Synthetic/organizer/public data; no real personal data | All scenarios fictional; `DATA_PROVENANCE.md` |
| §8.3-8.4 | No scraping, no live-system testing | No outbound calls to government hosts in code; state it in README |
| §8.5 | Real documents must be anonymized and pre-approved | Not used |
| §9 | AI tools disclosed; both students can explain code | README disclosure; ownership table below |
| §10.1 | Concept note ≤ 4 pages PDF; repo; video ≤ 3 min; live link recommended | Section 2, 3, 4 below |
| §10.2 | Final: updated repo + PDF deck ≤ 10 slides | Section 5 |
| §11 | 5 min pitch/demo + 3 min Q&A; students only; lottery order | Section 5 |

## 2. Concept note outline (4 pages)
1. **Header and problem choice (0.3 p):** project, team, 2 students + 2 mentors, P3 primary / P5 secondary.
2. **Problem in Bangladesh (0.7 p):** land disputes; registration (sub-registry) and mutation (AC Land) records are separate; khatians across CS/SA/RS/BS; partial sales and unit variety make naive matching unreliable. Use only facts you have verified; cite sources.
3. **Solution (0.8 p):** evidence-linked screening workflow; deterministic rules R01-R10; what it does **not** do (no legal verdicts, no authenticity claims).
4. **Architecture and stack (0.6 p):** diagram from `TRD.md`; rule engine isolated; SQLite/Postgres; React/FastAPI.
5. **Key features (0.5 p):** timeline, comparison grid, false-positive guards (survey series, partial sales, units), bilingual, report.
6. **Countrywide implementation plan (0.8 p):** below.
7. **Safeguards (0.2 p):** synthetic data, no scraping, AI disclosure, human-in-the-loop.
8. **Team and mentors (0.2 p).**

### Countrywide implementation plan (draft)
- **Phase 1, pilot:** one upazila land office and its sub-registry. Staff use JomiTrace as a pre-mutation cross-check on entered metadata. Measure: discrepancies surfaced per 100 cases, reviewer minutes saved, false-positive rate reported by reviewers.
- **Phase 2, integration:** through documented, authorized interfaces only, link to the registration and mutation systems so records are not retyped. The government has publicly described plans to link e-registration with e-mutation; JomiTrace's rules (R03, R07) are a portable validation layer for that flow. Verify current status before claiming.
- **Phase 3, scale:** district rollout, rule governance (versioned rules, published rationale), Bangla-first training material, citizen pre-purchase mode with the checklist.
- **Governance:** audit trail, role-based access, privacy review, legal review of wording before any public use.

## 3. README skeleton
```
# JomiTrace
One-paragraph description and the P3/P5 statement.
## What it does / what it does not do
## Quick start (one command; SQLite default)
## Scenarios S1-S8 and what each demonstrates
## Rules (link to RULES.md) and limitations
## Data sources and provenance (all fictional/public)
## AI tools used (tool, purpose, what the team reviewed/changed)
## Credits and licences
## Changes since Round 1   (add for final)
## Team and mentors
```

## 4. Three-minute video script (Round 1)
| Time | Screen | Say |
|---|---|---|
| 0:00-0:15 | Dashboard | "Land disputes often start with records that disagree. JomiTrace screens supplied records and shows exactly where they disagree." |
| 0:15-0:45 | Load S3 | "Seller owns 50 decimal. Two deeds convey 30 and 32. A naive plot match would call this a double sale; JomiTrace checks areas." |
| 0:45-1:30 | Findings → Inspect evidence | Open R05: fields, values, source deeds, limitation, next step. |
| 1:30-2:00 | Timeline | Show chain, the gap marker, "Date not supplied". |
| 2:00-2:20 | S4 | "Different units, same area after conversion. No false alarm. Originals preserved." |
| 2:20-2:40 | Report | Print preview with limitations and fictional-data label. |
| 2:40-3:00 | Close | "No verdicts, no scraping, deterministic and testable. Pilot path: one upazila." |
Record at 1080p, captions for status labels, keep under 3:00.

## 5. Final round
**Deck (PDF, ≤ 10 slides):** 1 problem · 2 who loses (citizen, reviewer) · 3 solution in one picture · 4 live demo handoff · 5 rules and false-positive guards · 6 architecture · 7 safeguards and limits · 8 changes since Round 1 · 9 pilot and countrywide path · 10 team/mentors.
**Timing (5 min):** 0:30 problem · 3:00 live demo (S3 → evidence → timeline → report) · 1:00 rollout · 0:30 limits. Student A drives the demo, Student B narrates rules and rollout. Mentors do not speak.
**Backup:** recorded demo video and local build if the network fails.

### Code ownership table (fill in; both must be able to explain everything)
| Module | Primary | Backup explainer |
|---|---|---|
| Rule engine and area normalization | | |
| API/schema | | |
| Timeline/comparison UI | | |
| Report/i18n | | |

### Likely judge questions and short answers
- **"Is this fraud detection?"** It is discrepancy screening. It never labels fraud; it points to fields and records a human must check through authorized channels.
- **"Why not ML?"** Records are few and structured; rules are auditable, testable and explainable to a land officer. ML needs labelled real data we are not allowed to use.
- **"How do you avoid false positives?"** Same-series plot comparison, crosswalk, partial-sale aggregation, unit normalization with shown tolerance, party confirmation.
- **"Where does the data come from?"** Fictional scenarios we authored; no real records, no portal access (Rule book §8).
- **"How would it integrate?"** Only through authorized interfaces; rules take plain structured input so a registry feed can replace manual entry.
- **"What if names are spelled differently?"** Reviewer-confirmed party aliases; we never fuzzy-match silently.
- **"What did AI write?"** Answer exactly as the README states; be ready to walk through any function.
- **"Why not blockchain?"** The problem here is cross-record inconsistency, not tamper-proof storage; a ledger would not fix wrong source records.

## 6. Self-scoring (replace weights when the Judging Rubric is obtained)
Rate 1-5 before each deadline: problem fit to P3 · technical soundness · innovation (false-positive guards, evidence model) · Bangladesh relevance · scalability plan · demo clarity · code explainability · safeguards.
