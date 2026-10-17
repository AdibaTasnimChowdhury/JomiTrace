# Backend schema (v3)

This document describes the current SQLAlchemy models. SQLite is the configured default; another SQLAlchemy dialect may require an installed driver and deployment validation. This project does not include a PostgreSQL or Docker Compose deployment configuration.

## Relationships
`Case 1-N SourceRecord`, `Case 1-N Party 1-N PartyAlias`, `Case 1-N PlotCrosswalk`, `Case 1-N TransferEvent`, `Case 1-N AnalysisRun 1-N Finding N-N SourceRecord` (via `finding_evidence`), `Case 1-N ChecklistItem`.

## `verification_cases`
`id` UUID PK · `case_code` unique (e.g. JT-1001) · `title` · `district`, `upazila`, `mouza`, `jl_number` nullable · `notes` · `status` (`draft`,`in_review`,`review_required`,`report_ready`,`archived`) · `provenance` (`synthetic`,`organizer`,`public`) **not null** · `config_json` (area tolerance, windows, katha/bigha basis) · `created_at`, `updated_at`.

## `source_records`
`id` · `case_id` · `record_type` (`deed`,`khatian`,`mutation`,`dcr`,`survey_reference`,`other`) · `source_reference` (display label, e.g. "Deed A-102") · **`survey_series`** (`CS`,`SA`,`RS`,`BS`,`other`,null) · `khatian_no`, **`dag_no`**, `holding_no`, `deed_no`, `mutation_case_no`, `dcr_no` nullable strings · `record_date`, `registration_date` nullable dates · `area_original` (text as written), `area_value` (numeric, nullable), `area_unit` (enum + free text) · `seller_party_id`, `buyer_party_id`, `owner_party_id` nullable FKs · `document_sha256` nullable (Tier C) · `fields_json` · `review_notes` · `created_at`.
Rules: never overwrite `area_original`; unknown stays null; deletion of a record cited by a finding is blocked (soft-archive instead).

## `parties` and `party_aliases` (new)
`parties(id, case_id, label)` where `label` is a synthetic tag such as "Party P1". `party_aliases(id, party_id, alias_text, confirmed_by_reviewer bool, confirmed_at)`. Free-text names entered on records are linked to a party by the reviewer. Rules use `party_id` only. Unconfirmed aliases yield `review_required`, not a match.

## `plot_crosswalk` (new)
`id, case_id, series_a, dag_a, series_b, dag_b, basis_note, confirmed_by_reviewer`. Required for cross-series plot comparison in R01.

## `transfer_events`
`id` · `case_id` · `source_record_id` nullable · `event_date` nullable (null = unknown) · `transfer_type` (`sale`,`gift`,`inheritance`,`partition`,`exchange`,`court_decree`,`power_of_attorney`,`mutation`,`other`) · `from_party_id`, `to_party_id` nullable · `area_conveyed_value`, `area_unit` nullable · `holding_key` (derived) · `sequence_index` · `derived` bool · `notes`.
**Events are derived from deed and mutation records by default** (`derived = true`) to avoid double entry; reviewers can add manual events such as inheritance. Never invent dates or parties.

## `analysis_runs` (new)
`id, case_id, rule_version, config_snapshot_json, input_hash, started_at, is_stale bool`. Any record, party, crosswalk, or config edit sets the latest run `is_stale = true`.

## `findings`
`id` · `run_id` FK · `case_id` · `rule_code` · `category` (`plot_mismatch`,`area_mismatch`,`chain_gap`,`possible_duplicate_transfer`,`over_conveyance`,`date_conflict`,`reg_mutation_mismatch`,`rapid_transfer`,`document_reuse`,`missing_data`) · `status` (`conflict_detected`,`review_required`,`insufficient_information`,`no_inconsistency_found`) · `summary` · `explanation` · `compared_fields` JSON · `observed_values` JSON · `limitations` · `recommended_next_step` · `created_at`.
Old runs are kept and read-only; the UI shows the latest by default.

## `finding_evidence`
`finding_id`, `source_record_id`, `field_name`, `observed_value`, `reference_label`; PK (`finding_id`,`source_record_id`,`field_name`).

## `checklist_items`
`id, case_id, label, description, status (pending|reviewer_completed|not_applicable), completion_note, updated_at`. Seeded per case from a template (see domain doc). Completion means the reviewer says so; JomiTrace did not check any official system.

## API
- `GET /api/health`
- `POST/GET /api/cases`, `GET/PATCH /api/cases/{id}`
- `POST/GET /api/cases/{id}/records`, `PATCH /api/records/{id}`
- `GET/POST /api/cases/{id}/parties`, `POST /api/parties/{id}/aliases`
- `GET/POST /api/cases/{id}/crosswalk`
- `POST /api/cases/{id}/analyze` → creates run
- `GET /api/cases/{id}/runs`, `GET /api/cases/{id}/findings?run_id=`
- `GET /api/cases/{id}/timeline`, `GET /api/cases/{id}/compare`
- `PATCH /api/checklist/{id}`
- `GET /api/cases/{id}/report?run_id=`
- `GET /api/rules` (catalog, version, config defaults; powers a "Rules and limitations" page)
- `POST /api/scenarios/{S1..S8}/load` (creates a fictional case)

## Integrity
Foreign keys on. Stable `source_reference` labels. Record rule version and run time on every finding. Do not delete cited records. Seed scripts must set `provenance = synthetic`.
