/**
 * Data contracts and TypeScript interfaces matching backend Pydantic schemas.
 */

export type CaseStatus = 'draft' | 'in_review' | 'conflict_detected' | 'review_required' | 'report_ready' | 'archived';
export type Provenance = 'synthetic' | 'user_entered' | 'organizer' | 'public';
export type RecordType = 'deed' | 'khatian' | 'mutation' | 'dcr' | 'survey_reference' | 'other';
export type SurveySeries = 'CS' | 'SA' | 'RS' | 'BS' | 'other';
export type TransferType =
  | 'sale'
  | 'gift'
  | 'inheritance'
  | 'partition'
  | 'exchange'
  | 'court_decree'
  | 'power_of_attorney'
  | 'mutation'
  | 'other';

export type FindingStatus =
  | 'conflict_detected'
  | 'review_required'
  | 'insufficient_information'
  | 'no_inconsistency_found'
  | 'not_applicable';

export type FindingCategory =
  | 'plot_mismatch'
  | 'area_mismatch'
  | 'chain_gap'
  | 'possible_duplicate_transfer'
  | 'over_conveyance'
  | 'date_conflict'
  | 'reg_mutation_mismatch'
  | 'rapid_transfer'
  | 'document_reuse'
  | 'missing_data';

export type ChecklistStatus = 'pending' | 'reviewer_completed' | 'not_applicable';

export interface VerificationCase {
  id: string;
  case_code: string;
  title: string;
  district?: string | null;
  upazila?: string | null;
  mouza?: string | null;
  jl_number?: string | null;
  notes?: string | null;
  status: CaseStatus;
  provenance: Provenance;
  config_json: {
    area_tolerance_pct?: number;
    rapid_transfer_days?: number;
    mutation_reference_days?: number;
    katha_sqft?: number | null;
    bigha_sqft?: number | null;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface CaseCreatePayload {
  case_code: string;
  title: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  jl_number?: string;
  notes?: string;
  provenance?: Provenance;
  config_json?: Record<string, any>;
}

export interface CaseUpdatePayload {
  title?: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  jl_number?: string;
  notes?: string;
  status?: CaseStatus;
  config_json?: Record<string, any>;
}

export interface SourceRecord {
  id: string;
  case_id: string;
  record_type: RecordType;
  source_reference: string;
  survey_series?: SurveySeries | null;
  khatian_no?: string | null;
  dag_no?: string | null;
  holding_no?: string | null;
  deed_no?: string | null;
  mutation_case_no?: string | null;
  dcr_no?: string | null;
  record_date?: string | null;
  registration_date?: string | null;
  area_original?: string | null;
  area_value?: number | null;
  area_unit?: string | null;
  seller_party_id?: string | null;
  buyer_party_id?: string | null;
  owner_party_id?: string | null;
  document_sha256?: string | null;
  fields_json?: Record<string, any> | null;
  review_notes?: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface SourceRecordCreatePayload {
  record_type: RecordType;
  source_reference: string;
  survey_series?: SurveySeries;
  khatian_no?: string;
  dag_no?: string;
  holding_no?: string;
  deed_no?: string;
  mutation_case_no?: string;
  dcr_no?: string;
  record_date?: string;
  registration_date?: string;
  area_original?: string;
  area_value?: number;
  area_unit?: string;
  seller_party_id?: string;
  buyer_party_id?: string;
  owner_party_id?: string;
  document_sha256?: string;
  fields_json?: Record<string, any>;
  review_notes?: string;
}

export interface SourceRecordUpdatePayload extends Partial<SourceRecordCreatePayload> {
  is_archived?: boolean;
}

export interface PartyAlias {
  id: string;
  party_id: string;
  alias_text: string;
  confirmed_by_reviewer: boolean;
  confirmed_at?: string | null;
  created_at: string;
}

export interface Party {
  id: string;
  case_id: string;
  label: string;
  aliases: PartyAlias[];
  created_at: string;
}

export interface PartyCreatePayload {
  label: string;
  aliases?: string[];
}

export interface PartyAliasCreatePayload {
  alias_text: string;
  confirmed_by_reviewer?: boolean;
}

export interface PlotCrosswalk {
  id: string;
  case_id: string;
  series_a: SurveySeries;
  dag_a: string;
  series_b: SurveySeries;
  dag_b: string;
  basis_note?: string | null;
  confirmed_by_reviewer: boolean;
  created_at: string;
}

export interface PlotCrosswalkCreatePayload {
  series_a: SurveySeries;
  dag_a: string;
  series_b: SurveySeries;
  dag_b: string;
  basis_note?: string;
  confirmed_by_reviewer?: boolean;
}

export interface ChecklistItem {
  id: string;
  case_id: string;
  label: string;
  description?: string | null;
  status: ChecklistStatus;
  completion_note?: string | null;
  updated_at: string;
}

export interface ChecklistItemUpdatePayload {
  status?: ChecklistStatus;
  completion_note?: string;
}

export interface FindingEvidence {
  finding_id: string;
  source_record_id: string;
  field_name: string;
  observed_value?: string | null;
  reference_label?: string | null;
}

export interface Finding {
  id: string;
  run_id: string;
  case_id: string;
  rule_code: string;
  category: FindingCategory;
  status: FindingStatus;
  summary: string;
  explanation: string;
  compared_fields: string[];
  observed_values: Record<string, any>;
  limitations: string;
  recommended_next_step: string;
  created_at: string;
  evidence: FindingEvidence[];
}

export interface AnalysisRun {
  id: string;
  case_id: string;
  rule_version: string;
  config_snapshot_json: Record<string, any>;
  input_hash: string;
  started_at: string;
  is_stale: boolean;
  findings: Finding[];
}

export interface CaseSummary {
  banner_status: FindingStatus;
  banner_label: string;
  counts: {
    conflict_detected: number;
    review_required: number;
    insufficient_information: number;
    no_inconsistency_found: number;
    not_applicable?: number;
  };
  total_findings: number;
  issue_count: number;
  check_count: number;
  limitations: string;
}

export interface AnalysisResponse {
  run: AnalysisRun;
  summary: CaseSummary;
}

export interface TimelineNode {
  event_id?: string | null;
  date?: string | null;
  date_display: string;
  transfer_type: string;
  from_party_label?: string | null;
  from_party_id?: string | null;
  to_party_label?: string | null;
  to_party_id?: string | null;
  area_display?: string | null;
  plot_reference?: string | null;
  holding_key?: string | null;
  source_reference?: string | null;
  source_record_id?: string | null;
  interruption_marker: boolean;
  interruption_label?: string | null;
  potential_overlap: boolean;
  associated_findings: Array<{
    rule_code: string;
    status: string;
    summary: string;
  }>;
}

export interface TimelineResponse {
  case_id: string;
  case_code: string;
  title: string;
  nodes: TimelineNode[];
  unlinked_records: Array<{
    id: string;
    source_reference: string;
    record_type: string;
    survey_series?: string | null;
    dag_no?: string | null;
    area?: string | null;
  }>;
}

export interface ComparisonCell {
  record_id: string;
  source_reference: string;
  value?: string | null;
}

export interface ComparisonRow {
  field_name: string;
  field_label: string;
  status: 'match' | 'mismatch' | 'over_conveyance' | 'unverified' | 'not_applicable';
  has_conflict: boolean;
  details?: string | null;
  cells: ComparisonCell[];
}

export interface ComparisonResponse {
  case_id: string;
  case_code: string;
  records: Array<{
    id: string;
    source_reference: string;
    record_type: string;
    survey_series: string;
  }>;
  rows: ComparisonRow[];
}

export interface ReportMetadata {
  generated_at: string;
  rule_version: string;
  run_id: string;
  input_hash: string;
  as_of_date: string;
  reviewer: string;
  config_snapshot: Record<string, any>;
  is_stale: boolean;
  provenance: string;
  sample_data_notice: string;
}

export interface CaseAuditEvent {
  id: string;
  case_id: string;
  action: string;
  actor: string;
  details_json?: Record<string, any> | null;
  created_at: string;
}

export interface AuditTrailResponse {
  case_id: string;
  case_code: string;
  total_events: number;
  events: CaseAuditEvent[];
}

export interface IntegrityCheckResponse {
  case_id: string;
  case_code: string;
  run_id?: string | null;
  sealed_hash?: string | null;
  current_hash: string;
  is_sealed: boolean;
  is_valid: boolean;
  checked_components: string[];
  explanation: string;
  disclaimer: string;
  checked_at: string;
}

export interface ReportResponse {
  metadata: ReportMetadata;
  case: VerificationCase;
  summary: CaseSummary;
  records_reviewed: Array<{
    id: string;
    source_reference: string;
    record_type: string;
    survey_series: string;
    dag_no: string;
    khatian_no: string;
    deed_no: string;
    area: string;
    date: string;
  }>;
  parties_reviewed: Array<{ label: string; aliases: Array<{text: string; confirmed: boolean}>; identity_status: string }>;
  crosswalks_reviewed: Array<{ from: string; to: string; status: string; basis_note?: string | null }>;
  rules_run: Array<{
    code: string;
    name: string;
    category: string;
    limitations: string;
  }>;
  findings: Finding[];
  timeline: TimelineNode[];
  comparison?: ComparisonResponse | null;
  checklist: ChecklistItem[];
  integrity?: IntegrityCheckResponse | null;
  audit_summary?: CaseAuditEvent[] | null;
  disclaimer: string;
}

export interface RuleCatalogItem {
  code: string;
  name: string;
  category: string;
  logic: string;
  conflict_condition: string;
  review_required_condition: string;
  insufficient_condition: string;
  limitations: string;
}

export interface RuleCatalogResponse {
  rule_version: string;
  config_defaults: Record<string, any>;
  rules: RuleCatalogItem[];
  area_factors: Record<string, any>;
  vocabulary_rules: Record<string, any>;
}

export interface ScenarioInfo {
  id: string;
  case_code: string;
  title: string;
  description: string;
  expected_outcome: string;
  district?: string | null;
  upazila?: string | null;
  mouza?: string | null;
}

export interface ScenarioListResponse {
  scenarios: ScenarioInfo[];
  provenance: string;
  notice: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  rule_version: string;
  timestamp: string;
}
