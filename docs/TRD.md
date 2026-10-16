# Technical requirements document

## Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Database: **SQLite by default** (zero-setup for judges and free-tier deploy); PostgreSQL supported through the same SQLAlchemy models and a `docker-compose.yml`
- API validation: Pydantic
- Reports: printable HTML or PDF
- Tests: unit tests for deterministic rules and focused UI/API tests

## Architecture
```text
React + TypeScript + Tailwind
          | JSON over HTTP
          v
FastAPI routes + Pydantic validation
  | case/record services
  | deterministic rule engine
  | timeline assembly
  | report generation
          v
      PostgreSQL
```
Keep the rule engine independent of React. The frontend renders the returned evidence and explanations; it does not invent a verdict.

## Suggested frontend structure
```text
frontend/src/
  app/
  components/
    layout/ ledger/ records/ timeline/
    findings/ checklist/ reports/
  features/
    cases/ record-entry/ investigation/
  lib/ api.ts formatters.ts
  types/
```

Suggested routes: `/` dashboard, `/cases/new`, `/cases/:caseId`, `/cases/:caseId/records/new`, `/cases/:caseId/investigation`, `/cases/:caseId/compare`, `/cases/:caseId/report`.

## Design system
**Typography:** Geist + Geist Mono for Latin text. Geist and Manrope contain **no Bengali glyphs**, so declare `Noto Sans Bengali` (or Hind Siliguri) as the Bangla fallback and set `lang="bn"` on Bangla content. Test Bangla conjuncts and numerals in the report print view. Do not use Inter, Roboto, or Arial as defaults. Headings are sentence case; apply `text-wrap: balance` to page titles. Use tabular numerals for identifiers and dates where useful.

**Palette:** deep charcoal/slate; bone/off-white surface such as `#F7F5EF`; slate-gray secondary text; flat dark teal such as `#245E58` for primary actions; muted amber `#D97706` for review-required **markers, borders and fills**; amber **text** must use `#92400E` (contrast of `#D97706` on bone is about 2.9:1, below WCAG AA 4.5:1); muted burgundy `#991B1B` for conflict detected; subtle 1px slate borders.

**Layout:** no four-card metric row, no card around every datum, no decorative icon tiles, no heavy shadows or gradients. Prefer whitespace, aligned columns, and typographic hierarchy. Dashboard has a narrow status queue plus dominant searchable ledger. Timeline has chronological nodes and adjacent document metadata. Comparison is a horizontal grid with flat “Inspect evidence” actions. Color is never the only status cue.

**Copy:** use literal operational language: “Review required,” “Conflict detected,” “Insufficient source data,” “Inspect evidence,” “External verification pending.” Avoid generic marketing copy, ungrounded AI summaries, “100% safe,” “fraud confirmed,” or “legal owner verified.”

## Rule-engine result contract
Each rule returns `rule_code`, `category`, `status`, `summary`, `explanation`, `source_record_ids`, `compared_fields`, `observed_values`, `limitations`, and `recommended_next_step`.

Statuses: `conflict_detected`, `review_required`, `insufficient_information`, `no_inconsistency_found`.

Rules must be deterministic and reproducible. Missing data must not be treated as a positive match.

## Data and security
Use synthetic, organizer-provided, or clearly public sample data. Do not scrape portals or bulk-query official systems. Minimize personal identifiers, validate inputs, keep secrets in environment variables, and document data provenance. Do not claim official verification without an authorized real check.

## Minimum tests
- Same inputs yield same results.
- Missing fields yield insufficient-information states where appropriate.
- Area mismatch links to both records.
- Possible competing transfer is not labelled proven fraud.
- Timeline keeps missing dates unknown.
- Report includes findings, evidence references, and limitations.
- Finding links navigate to source records.
- Status has a text label and is not color-only.

## Deployment
Deployment is optional. A local demo with seeded synthetic cases is acceptable for development. Document setup, sample data, environment variables, and limitations.

## Bilingual rules
- All user-visible strings live in `locales/en.json` and `locales/bn.json`; no hard-coded labels in components.
- Required Bangla labels: দলিল (deed), খতিয়ান (khatian), পর্চা (porcha), নামজারি (mutation), দাখিলা / ডিসিআর (DCR), মৌজা, দাগ (dag/plot), শতাংশ (decimal). Have a Bangla speaker review wording; do not ship machine-translated legal terms unreviewed.
- Store canonical enum values in English; translate only at render time.
- Numerals: keep stored values ASCII; offer a display toggle for Bangla numerals.

## Analysis runs
`POST /analyze` creates an `analysis_run` (rule version, config snapshot, input hash, timestamp). Findings and reports reference a run. Editing any record marks the latest run **stale**; the UI shows "Records changed since last run. Run checks again." and the report refuses to export a stale run without an explicit confirmation.

## Rule engine layout
```text
backend/app/rules/
  base.py          # Finding dataclass, status enum, registry
  area.py          # unit normalization
  r01_plot.py ... r09_missing.py
  engine.py        # run_all(snapshot, config) -> findings (sorted, stable)
backend/tests/fixtures/S1..S8.json
```
Rules import nothing from FastAPI or the ORM; they take plain dataclasses.

## Extra tests (in addition to the minimum list)
- Determinism: serialize findings twice, equal.
- Forbidden-word scan over all finding and report text.
- Cross-series plot comparison without crosswalk returns `insufficient_information`.
- Partial sales within holding area produce no R05 finding.
- Stale-run banner appears after a record edit.
- Contrast check on the status tokens (script or Lighthouse).

## Repo hygiene (rule book §7, §8, §9)
- Keep full commit history; never squash or force-push after first push.
- `DATA_PROVENANCE.md` lists every dataset (all fictional/organizer/public).
- Pre-push grep for NID-like numbers, phone numbers, real-looking names.
- README sections: setup, data sources, AI-tool disclosure, limitations, **changes since Round 1** (final round).
