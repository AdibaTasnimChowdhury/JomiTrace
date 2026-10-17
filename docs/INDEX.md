# JomiTrace project documentation (v3)

**Product:** JomiTrace: explainable land-record discrepancy screening
**Primary problem:** P3 Fraud & Double-Selling Detection
**Secondary workflow:** P5 Citizen Pre-Purchase Verification
**Event:** LandTech 2026. Round 1 submission due **18 Oct 2026** (extended from 16 Oct in the rule book; keep the organizers' announcement or screenshot). Internal target: submit by evening of 17 Oct. Final round date TBA (Knowledge Tower, DIU).

## Documents
| File | Purpose |
|---|---|
| `REVIEW_NOTES.md` | What changed from v2 and why. Read first |
| `PRD.md` | Scope, acceptance criteria, MVP tiers |
| `RULES.md` | **New.** Rule catalog, thresholds, expected scenario outputs (= test plan) |
| `TRD.md` | Architecture, design system, bilingual rules |
| `BACKEND_SCHEMA.md` | Data model and API |
| `APP_FLOW.md` | Screens and behaviour |
| `IMPLEMENTATION_PLAN.md` | Two-day Round 1 plan, then pre-final build |
| `SUBMISSION_PACK.md` | **New.** Rule-book compliance, concept note outline, README skeleton, video script, final-round pitch and Q&A |
| `Bangladesh digital land services.md` | Domain context (survey series, registration vs. mutation, portals) |
| `research.md`, `research-bd.md` | Research notes |
| `FUTURE_IMPROVEMENTS.md` | Deferred work |

## MVP tiers
- **Implemented scope:** case + records, rule engine R01-R10 with evidence links, timeline, comparison grid, printable report, eight fictional scenarios, party alias + crosswalk screens, checklist, README/concept note/video. See release notes for checks still outstanding.
- **Tier B (Round 1 if time allows, otherwise before final):** live deployment, Bangla/English toggle, run history and stale banner.
- **Tier C (stretch, only if A+B done):** document-reuse check (R10, SHA-256 of a synthetic file), cross-case plot index on synthetic registry.

## Frontend design contract (summary)
React + TypeScript + Tailwind. Geist + Geist Mono for Latin, **Noto Sans Bengali** (or Hind Siliguri) for Bangla. Sentence-case headings with `text-wrap: balance`. Dense split-pane dashboard; chronological node timeline; flat comparison grid. Palette: charcoal/slate, bone `#F7F5EF`, slate-gray, teal `#245E58`; amber `#D97706` as marker with `#92400E` text; burgundy `#991B1B`. No gradients, heavy shadows, icon tiles, four-metric row. Status always has a text label.

## Hard rules from the rule book
Synthetic/organizer/public data only. No portal scraping, no testing against live systems. AI tools disclosed in README. Commit history kept. Both students can explain all code. Mentors may not present or answer.
