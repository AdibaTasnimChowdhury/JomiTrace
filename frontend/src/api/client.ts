/**
 * Typed API client for JomiTrace backend endpoints.
 */
import type {
  AnalysisResponse,
  AnalysisRun,
  AuditTrailResponse,
  CaseCreatePayload,
  CaseStatus,
  CaseUpdatePayload,
  ChecklistItem,
  ChecklistItemUpdatePayload,
  ComparisonResponse,
  Finding,
  HealthStatus,
  IntegrityCheckResponse,
  Party,
  PartyAlias,
  PartyAliasCreatePayload,
  PartyCreatePayload,
  PlotCrosswalk,
  PlotCrosswalkCreatePayload,
  Provenance,
  ReportResponse,
  RuleCatalogResponse,
  ScenarioListResponse,
  SourceRecord,
  SourceRecordCreatePayload,
  SourceRecordUpdatePayload,
  TimelineResponse,
  VerificationCase,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as unknown as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const detail =
      data && typeof data === 'object' && data.detail
        ? typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail)
        : typeof data === 'string'
        ? data
        : response.statusText;
    throw new ApiError(response.status, detail);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<HealthStatus>('/health'),

  // Cases
  listCases: (params?: { status?: CaseStatus; provenance?: Provenance; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.provenance) query.set('provenance', params.provenance);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return request<VerificationCase[]>(`/cases${qs ? `?${qs}` : ''}`);
  },

  getCase: (caseId: string) => request<VerificationCase>(`/cases/${caseId}`),

  createCase: (payload: CaseCreatePayload) =>
    request<VerificationCase>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCase: (caseId: string, payload: CaseUpdatePayload) =>
    request<VerificationCase>(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCase: (caseId: string) =>
    request<void>(`/cases/${caseId}`, {
      method: 'DELETE',
    }),

  // Source Records
  listRecords: (caseId: string, includeArchived = false) =>
    request<SourceRecord[]>(`/cases/${caseId}/records?include_archived=${includeArchived}`),

  addRecord: (caseId: string, payload: SourceRecordCreatePayload) =>
    request<SourceRecord>(`/cases/${caseId}/records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRecord: (recordId: string, payload: SourceRecordUpdatePayload) =>
    request<SourceRecord>(`/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteRecord: (recordId: string, soft = false) =>
    request<void>(`/records/${recordId}?soft=${soft}`, {
      method: 'DELETE',
    }),

  // Parties & Aliases
  listParties: (caseId: string) => request<Party[]>(`/cases/${caseId}/parties`),

  createParty: (caseId: string, payload: PartyCreatePayload) =>
    request<Party>(`/cases/${caseId}/parties`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addPartyAlias: (partyId: string, payload: PartyAliasCreatePayload) =>
    request<PartyAlias>(`/parties/${partyId}/aliases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Plot Crosswalk
  listCrosswalk: (caseId: string) => request<PlotCrosswalk[]>(`/cases/${caseId}/crosswalk`),

  createCrosswalk: (caseId: string, payload: PlotCrosswalkCreatePayload) =>
    request<PlotCrosswalk>(`/cases/${caseId}/crosswalk`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analysis & Runs
  analyzeCase: (caseId: string, configOverride?: Record<string, any>) =>
    request<AnalysisResponse>(`/cases/${caseId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(configOverride ? { config_override: configOverride } : {}),
    }),

  getRuns: (caseId: string) => request<AnalysisRun[]>(`/cases/${caseId}/runs`),

  getFindings: (caseId: string, runId?: string) => {
    const qs = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
    return request<Finding[]>(`/cases/${caseId}/findings${qs}`);
  },

  getTimeline: (caseId: string) => request<TimelineResponse>(`/cases/${caseId}/timeline`),

  getComparison: (caseId: string) => request<ComparisonResponse>(`/cases/${caseId}/compare`),

  getReport: (caseId: string, runId?: string, allowStale = false) => {
    const query = new URLSearchParams();
    if (runId) query.set('run_id', runId);
    if (allowStale) query.set('allow_stale', 'true');
    const qs = query.toString();
    return request<ReportResponse>(`/cases/${caseId}/report${qs ? `?${qs}` : ''}`);
  },

  logReportExport: (caseId: string) =>
    request<void>(`/cases/${caseId}/report/exported`, { method: 'POST' }),

  // Checklist
  getChecklist: (caseId: string) => request<ChecklistItem[]>(`/cases/${caseId}/checklist`),

  updateChecklistItem: (itemId: string, payload: ChecklistItemUpdatePayload) =>
    request<ChecklistItem>(`/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Rules Catalog
  getRules: () => request<RuleCatalogResponse>('/rules'),

  // Demo Scenarios
  listScenarios: () => request<ScenarioListResponse>('/scenarios'),

  loadScenario: (scenarioId: string, replace = true) =>
    request<VerificationCase>(`/scenarios/${scenarioId}/load?replace=${replace}`, {
      method: 'POST',
    }),

  // Audit & Integrity
  getAuditTrail: (caseId: string) => request<AuditTrailResponse>(`/cases/${caseId}/audit`),

  verifyIntegrity: (caseId: string, logEvent = true) =>
    request<IntegrityCheckResponse>(`/cases/${caseId}/integrity?log_event=${logEvent}`),
};
