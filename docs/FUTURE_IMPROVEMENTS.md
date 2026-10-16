# Future improvements

These ideas are outside the finalized MVP. Do not implement them before the core case-to-report flow works.

## Potential later phases
1. **Document image assistance:** OCR with field-level confidence, source-image anchors, and human confirmation. Never silently overwrite source data.
2. **Authorized integrations:** only with documented, permitted official interfaces; no scraping or bulk queries.
3. **Evidence provenance:** source hashes, reviewer annotations, correction history, and audit trail with privacy controls.
4. **Area normalization (extended):** basic conversion is now MVP (see `RULES.md`); later add regional katha/bigha presets and uncertainty ranges.
5. **Reviewer collaboration:** access roles, assignments, comments, and auditable changes.
6. **Advanced timeline handling:** uncertain/partial dates, parallel events, and alternative chain interpretations without forcing one definitive sequence.
7. **Geographic context:** mapping only where lawful, suitable data exists; never substitute for a survey or official boundary decision.
8. **Inheritance/succession workflow:** separate research needed before modeling heirs, shares, or legal effects.
9. **Accessibility and localization (extended):** basic Bangla/English toggle is now Tier B; later add full screen-reader testing and Bangla-first print layouts.
11. **Document reuse and cross-case index** (Tier C): SHA-256 of synthetic files, same deed number across cases.
12. **PDF/Word report export** in addition to printable HTML.
10. **Rule governance:** version rules, document rationale, maintain test fixtures, and expose rule version to reviewers.

## Not recommended as shortcuts
- Blockchain added only for novelty.
- Black-box AI fraud probability.
- A single safety score that hides uncertainty.
- Automatic legal ownership verdicts.
- Claims that the platform replaces official verification.

## Criteria for adding features
Add only if a feature improves evidence quality, traceability, reviewer efficiency, or accessibility; is testable; has a lawful data path; and does not imply more certainty than the evidence supports.
