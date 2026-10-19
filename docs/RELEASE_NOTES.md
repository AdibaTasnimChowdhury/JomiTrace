# Release notes — 2026-10-19

## Readiness status

Pre-release verification incomplete.

## Implemented changes (previous pass)

- Promoted case title, location, screening status, finding counts and next action in the workspace header; moved secondary details down.
- Grouped secondary workspace tools and improved ledger controls, comparison and long tables for narrow screens.
- Added source-record evidence citations, field values, rule rationale, and next steps to findings; added deterministic rule edge-case and evidence-coverage tests.
- Added provenance filtering and scenario collision protection so a demo load cannot overwrite a user-entered case with a colliding identifier.
- Improved keyboard focus and modal focus trapping; clarified that local audit actor labels are not authenticated identities.
- Added data handling and release checklist documentation.
- Unified case status projection across ledger and workspace, aligned grouped finding counts, added not-assessed outcomes, and placed no-issue passes in a collapsed group.
- Removed repeated finding entries, deduplicated timeline rule markers, and labeled the ledger search control for assistive technology.
- Corrected registration-date display, record date formatting, area comparison labels, R05/R08 pass language, R03 wording, and missing-mutation reporting.
- Changed report metadata and audit activity to show explicit fields and a full input fingerprint; audit records now capture analysis runs and deliberate report exports only.
- Removed passive API health noise and updated remaining screening language to avoid claims about ownership, document authentication, or a tamper-resistant seal.
- Resolved R04 buyer IDs to reviewer-facing party labels; normalized repeated record-type prefixes; rendered missing evidence as “Not supplied”; combined recorded area values with their units in finding citations.
- Replaced the report’s “Dossier Reference” with “Run ID”; updated the browser title, footer, localized action label, rules catalog, and project documents to use discrepancy-screening language accurately.
- Reconciled rule descriptions and submission documents with implemented R04–R06 behavior and corrected outdated storage, audit, and database deployment claims.

## Known limitations

- Demo and user-entered cases use provenance separation within one configured database; they are not physically isolated.
- No authentication, role-based authorization, authenticated audit actors, encrypted backup workflow or production retention controls are implemented.
- Bangla coverage and visual wrapping still require a human review of every screen and state, especially mixed Bangla/Latin text at phone widths.
- Findings are deterministic screening outputs based on entered metadata and do not validate source-document authenticity or legal title.
- A full Lighthouse audit and complete Bangla review of every screen remain outstanding.

## Verification — 2026-10-19

- Frontend production build: passed (`npm run build`).
- Frontend lint: passed with existing warnings, including unused caught errors and React hook dependency/state-in-effect warnings.
- Deployed browser smoke review ([live app](https://jomitrace.netlify.app/)): the Bangla ledger, rule catalog, guided tour, and all eight fictional scenario cards were inspected. Case analysis and report export could be exercised.
- Bangla review: partial. Header, navigation, footer, workspace screens, guided-tour copy, and scenario-picker copy appeared in Bangla. The rule catalog remained in English, and some scenario status labels exposed English text in accessible names.
- Narrow viewport review (527 × 600): the Netlify hosting badge overlapped the guided tour’s lower navigation controls. This can prevent reliable tour navigation at small widths.
- Backend suite (86 passed, 1 Starlette/httpx deprecation warning) and rule suite (28 passed): previous results from 2026-10-18; not rerun for this update.
