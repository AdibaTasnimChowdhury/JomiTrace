# Review notes: what changed from v2 and why

Reviewed against the LandTech 2026 rule book (Track: Digital Land Records, Verification & Digitization; selected problem statement P3 Fraud & Double-Selling Detection). Pre-purchase review is a supporting use context, not a second selected problem statement.

## Critical
1. **Round 1 deadline is now 18 Oct 2026** (the rule book PDF says 16 Oct; the extension came later, so keep the announcement). Late submissions are not accepted and a missed deadline is a disqualification ground (§14). The old 7-phase plan still cannot finish in two days, so `IMPLEMENTATION_PLAN.md` is split into a **two-day Round 1 plan** and a **pre-final build**. Confirm the exact cutoff time on the platform and aim to submit on the evening of 17 Oct.
2. **Submission artefacts were missing from the plan**: 4-page concept note (with a countrywide implementation plan), README with AI disclosure and data sources, 3-minute video. Now in `SUBMISSION_PACK.md`.
3. **Section 8 (data/security) is a disqualification rule.** Added a data-provenance checklist and a "no real data in the repo or git history" check.

## Domain correctness (biggest product improvement)
4. **Plot numbers change between survey series (CS/SA/RS/BS).** The old plot-reference rule would raise false conflicts. Plot comparison now happens only within one series, or through a reviewer-entered crosswalk. Otherwise the result is "Insufficient information".
5. **Partial sales are normal.** The old "same plot, two buyers" logic would flag legitimate partial sales. Added aggregate-area (over-sale) logic: conveyed area from one holding vs. recorded holding area.
6. **Area units** (decimal/shotok, katha, bigha, sq ft, acre) were deferred to "future", which made the area rule unreliable. A conservative normalizer is now MVP: exact units convert, regional units (katha, bigha) require a reviewer-selected basis, originals are always preserved, tolerance is shown.
7. **Name matching.** Bangla names have many spellings, so string equality is unreliable. Added a reviewer-confirmed **party alias** step; rules compare party IDs, not strings. Deterministic and explainable.
8. **Registration vs. mutation** (rule book background and P3 text name this mismatch) had no explicit rule. Added `JT-R07`. Added **rapid re-transfer** (`JT-R08`), also named in P3.

## Product / demo
9. Rule catalog with codes, inputs, thresholds and expected outputs per scenario: new `RULES.md`. Doubles as the test plan.
10. **Bangla/English** moved from "future" into MVP for UI chrome and report headings. Geist and Manrope have no Bengali glyphs, so a Bengali font fallback is required.
11. **Contrast bug:** `#D97706` on `#F7F5EF` is about 2.9:1, which fails WCAG AA for text. Use amber as marker/border; use `#92400E` for amber text. Burgundy and teal pass.
12. Scenario loader added to the UI so a 3-minute video and a 5-minute pitch can be run without typing.

## Engineering
13. Default to **SQLite** (Postgres optional via compose) so judges can run it in one command and a free-tier deploy is easy.
14. Added `analysis_runs`: findings belong to a run (rule version, input hash, timestamp). Reports cite a run, which solves the stale-findings problem the old schema left open.
15. Dropped the optional film-grain overlay (legibility and performance risk, no scoring value).

## Unchanged (kept, because it was right)
Evidence-first, no verdicts, no safety score, deterministic rules, no scraping, no OCR/blockchain in MVP, status never conveyed by colour alone.

## Open items for you
- Get the **Judging Rubric** document (rule book references it but it was not in the PDF). Re-weight `SUBMISSION_PACK.md` §6 once you have it.
- Verify the domain facts flagged "verify" in `Bangladesh digital land services.md` before quoting them in the concept note.
