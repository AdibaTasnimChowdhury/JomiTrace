# Application flow and screen specification

## Navigation
The current app has top-level Investigation Ledger, Case Workspace, and Rules & Limitations sections. A selected case opens a workspace with Findings, Source Records, Parties & Crosswalk, Ownership Timeline, Comparison Grid, Checklist, Audit & Integrity, and Printable Report. Some secondary tools are grouped under “More tools.”

## Dashboard: dense case ledger
- Searchable case ledger with status and provenance filters.
- Compact status filters and a restrained “Create case” action.
- No hero banner and no four-card metric row.
- Ledger rows show case identity, location, record/finding summary, status, and last updated time.
- Counts must come from actual case data. Empty states should say what action is available, e.g. “No cases match these filters.”

## Language and scenario controls
- Header toggle **EN / বাংলা** persists per browser; report language follows the toggle.
- Empty dashboard and the case menu offer **Load fictional scenario** (S1-S8, each labelled with its expected discrepancy type). Loaded cases carry a visible "Fictional sample data" tag.

## Create case
Fields: short case label, plot/survey reference, district/upazila/mouza/JL reference where available, notes, synthetic sample label. Actions: “Create case” and “Cancel.” After creation, go to record entry. Do not imply the case has verified ownership.

## Record entry
Choose record type and enter the relevant metadata: source/reference label, dates, plot reference, area and original unit, party references, mutation reference where relevant. Unknown values remain blank. Explain which checks use each field. Do not imply a document image was verified if only metadata was entered.

## Parties and crosswalk
After record entry, a compact **Confirm parties** table lists each name string used on the records. The reviewer groups strings into parties ("Party P1 = these 2 spellings") and confirms. If records come from different survey series, a **Plot crosswalk** row asks the reviewer to state which dag in one series corresponds to which in the other, with a basis note. Unconfirmed items are shown as "Awaiting reviewer confirmation" and limit which rules can run.

## Investigation results and timeline
This is the centerpiece.
- Show case code, plot reference, status, compact record/finding/pending counts, and “Run checks” when needed.
- Show the active analysis run (rule version, time). If stale: banner “Records changed since last run. Run checks again.”
- Use a vertical chronological node graph.
- Each node shows event date, transfer type, entered from/to references, plot reference, source-document tag, and review state.
- Align document metadata in a right-side column on desktop; stack below the node on narrow screens.
- Unknown dates say “Date not supplied.”
- Chain gaps have a labelled interruption marker.
- Possible overlaps have a “Potential overlap” annotation and source tags.
- Findings sit beside relevant nodes when possible.
- “Inspect evidence” opens the relevant source record and highlights compared fields.
- State clearly that this is a timeline of supplied records, not definitive legal ownership.

## Record comparison table
Use columns for field, Record A/source tag, Record B/source tag, comparison result, and action. Compare plot reference, area/unit, owner/purchaser reference, dates, and mutation reference where available. Highlight conflicting values inline. Flat “Inspect evidence” actions link to the relevant source records. Keep field/value relationships clear on mobile using horizontal scroll or a stacked equivalent.

## Finding detail
Show status, category, rule code, explanation, compared fields, observed values, source tags, limitations, and recommended follow-up. No opaque numerical risk score or generic AI-written narrative.

## External review checklist
Each row shows check, reason, status, reviewer note, and a “Mark completed” or “Reopen” action. Use explicit labels such as “Verify the original record through an authorized source.”

## Report preview
Include case details and sample-data notice, records reviewed, rules run, findings/source references, timeline, checklist state, and limitations. Print/export must use the currently selected case.

## Main flow
Dashboard ledger → create/open case → enter records → run checks → inspect findings/evidence → review timeline and comparisons → update checklist → export report.

## Interaction requirements
Search, filters, row selection, forms, evidence links, timeline tags, checklist updates, and report actions must work. Include loading, error, and empty states. Confirm destructive actions. Keep keyboard focus visible and use semantic HTML.

## Rules and limitations page
Static page rendered from `GET /api/rules`: each rule code, what it compares, thresholds, and what it cannot tell. Linked from every finding and from the report footer.

## Bangla/English acceptance
English and Bangla are available throughout the main interface. A complete human review of every screen, generated finding string, mixed-script value, and print layout remains a release task; see `RELEASE_NOTES.md` and `RELEASE_CHECKLIST.md`.
