# Historical implementation plan (v3)

This plan records the original hackathon schedule and is retained as project history. Current implementation and release status are tracked in `RELEASE_NOTES.md` and `RELEASE_CHECKLIST.md`.

## Reality check
Round 1 submission closes **18 Oct 2026** (extended from 16 Oct; the rule book PDF still shows the old date, so keep the organizers' announcement or a screenshot). Missing the deadline disqualifies the team (§14). Confirm the cutoff **time** on landtech.diu.edu.bd/landtech. You have roughly two working days: Fri 16 (rest of day), Sat 17, Sun 18. Treat **evening of 17 Oct as your real deadline** and use the 18th only as buffer for upload problems.

## Plan A: Round 1 in two days (vertical slice first)
Build what the video will show, then the paperwork. The extra day lets the party/crosswalk screens and checklist into Round 1, which strengthens the false-positive story.

| When | Block | Output | Done when |
|---|---|---|---|
| Fri 16 | A1 Rule engine + fixtures | `rules/` R01-R09, S1-S8 JSON, determinism test | `pytest` green; S2, S3, S4 give expected findings |
| Fri 16 | A2 API + seed | FastAPI, SQLite, scenario loader, `/analyze`, `/findings`, `/timeline`, `/report` | Loading S3 and analyzing returns evidence-linked findings |
| Sat 17 AM | A3 UI slice | Ledger, case page, records table, findings with Inspect evidence, timeline, comparison grid, print report | Ledger → S3 → finding → source record → report works |
| Sat 17 AM | A4 Party + crosswalk | Confirm-parties table, crosswalk row | S8 flips from insufficient to assessed after crosswalk entry |
| Sat 17 PM | A5 Checklist + honest scope | Checklist seeded from template; unfinished screens hidden or labelled "Planned" | No dead links |
| Sat 17 PM | A6 Repo hygiene | README (setup, data sources, AI disclosure, limitations), `DATA_PROVENANCE.md`, intact history, no real data | Fresh clone runs from README |
| Sat 17 evening | A7 Concept note PDF | Max 4 pages, outline in `SUBMISSION_PACK.md` §2 | Exported, 4 pages or fewer |
| Sat 17 evening | A8 Demo video | Max 3 min, script in `SUBMISSION_PACK.md` §4 | Under 3:00 |
| Sat 17 night | A9 **Submit** | Upload PDF, repo link, video, optional live link | Confirmation visible; screenshot saved |
| Sun 18 | Buffer | Fix upload issues; optional live deploy or Bangla toggle if already stable | Only low-risk changes; no new features after submission is accepted |

If time slips, cut in this order: live deployment, Bangla toggle, run-history UI, polish. Never cut: determinism, evidence links, synthetic labelling, AI disclosure, commit history.

## Plan B: after submission, before the final round (date TBA)
Final round presents the **latest** version; all changes since Round 1 go in the README ("Changes since Round 1"). Final submission needs updated repo + PDF pitch deck (max 10 slides) and late files are rejected.

| Phase | Work | Done when |
|---|---|---|
| B1 | Stale-run banner and run history (if not done in Round 1) | Editing a record shows the stale banner |
| B2 | Report completeness (checklist already in Round 1) | Report lists pending external checks and limitations |
| B3 | Bangla/English (strings extraction, font fallback, print check) | Every screen reviewed in both languages by a Bangla reader |
| B4 | Live deployment (free tier), seeded with S1-S8 | Public URL loads in under 5 s on mobile data |
| B5 | Accessibility and visual QA (contrast tokens, keyboard, long references, empty/loading/error) | Lighthouse accessibility 90+, no colour-only status |
| B6 | Tier C if time: R10 document reuse, cross-case plot index | Demo-able in 30 seconds or dropped |
| B7 | Pitch rehearsal, Q&A drills, deck | 5:00 pitch + 3:00 Q&A timed, both students speak |

## Priority
Highest: deterministic checks, evidence links, timeline, comparison, honest limitations. High: report, bilingual, deployment. Out of scope: OCR, maps, blockchain, live integrations, anything touching government systems.

## Submission checklist
- [ ] Concept note PDF (4 pages max) with problem statement P3 stated
- [ ] Repo link public or shared with organizers; README complete
- [ ] AI tools disclosed with how each was used
- [ ] Data provenance file; all data fictional or public; no real names, NIDs, phones, addresses
- [ ] Commit history intact (no squash, no force push)
- [ ] Demo video ≤ 3:00
- [ ] Live link (recommended)
- [ ] Both students can explain every module (see ownership table in `SUBMISSION_PACK.md`)
- [ ] Both mentors named (1 faculty, 1 industry) in concept note
- [ ] Registration and fee confirmation received (registration closed 6 Oct)
- [ ] Screenshot/link of the announcement extending the deadline to 18 Oct
