import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { ReportResponse } from '../../types';
import { t, localizeProvenance, localizeRuleName, localizeRecordField, normalizeReferenceLabel, formatDhakaDateTime, type Language } from '../../locales';
import { StatusBadge } from '../common/StatusBadge';
import { findingIssueMetrics, groupFindings, relatedRuleCodes } from '../../utils/findings';

interface ReportViewProps {
  caseId: string;
  onRunChecks: () => void;
  lang: Language;
}

function formatReportDate(value: string, lang: Language): string {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(parsed);
}

export const ReportView: React.FC<ReportViewProps> = ({ caseId, onRunChecks, lang }) => {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStaleBlocked, setIsStaleBlocked] = useState(false);

  const fetchReport = async (allowStale = false) => {
    setLoading(true);
    setError(null);
    setIsStaleBlocked(false);
    try {
      const data = await api.getReport(caseId, undefined, allowStale);
      setReport(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.detail.toLowerCase().includes('stale')) {
          setIsStaleBlocked(true);
          setError(err.detail);
        } else {
          setError(err.detail);
        }
      } else {
        setError('Failed to generate report.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(false);
  }, [caseId]);

  const handlePrint = async () => {
    await api.logReportExport(caseId);
    window.print();
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-muted font-mono animate-pulse" role="status">
        {t('loading_report', lang)}
      </div>
    );
  }

  if (isStaleBlocked) {
    return (
      <div className="p-6 border border-amber-border bg-amber-surface text-amber-text text-xs rounded-sm space-y-3">
        <div className="font-bold text-sm">{t('stale_run_warning', lang)}</div>
        <p className="leading-relaxed">
          Source records, parties, or plot crosswalks have been modified since the last rule-engine execution.
          Please re-run screening before exporting a current report.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onRunChecks}
            className="px-4 py-2 bg-amber-marker text-white text-xs font-semibold rounded-sm hover:bg-amber-600 transition-colors shadow-2xs"
          >
            {t('rerun_checks', lang)}
          </button>
          <button
            onClick={() => fetchReport(true)}
            className="px-3 py-2 border border-amber-border text-amber-text bg-white text-xs rounded-sm hover:bg-amber-surface transition-colors"
          >
            {t('export_stale_anyway', lang)}
          </button>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm space-y-3">
        <div className="font-bold">{t('report_error_title', lang)}</div>
        <p>{error || 'An unexpected error occurred while preparing the report.'}</p>
        <button
          onClick={onRunChecks}
          className="px-3 py-1.5 bg-burgundy-marker text-white text-xs rounded-sm hover:bg-red-800"
        >
          {t('run_checks', lang)}
        </button>
      </div>
    );
  }

  const {
    metadata,
    case: caseObj,
    summary,
    records_reviewed,
    rules_run,
    findings,
    timeline,
    checklist,
    comparison,
    integrity,
    audit_summary,
  } = report;
  const groupedFindings = groupFindings(findings);
  const issueMetrics = findingIssueMetrics(groupedFindings);
  const bannerIssueCount = issueMetrics.issuesByStatus[summary.banner_status as keyof typeof issueMetrics.issuesByStatus];
  const conflictLabels = Array.from(new Set(groupedFindings.filter((f) => f.status === 'conflict_detected').map((f) => localizeRuleName(f.rule_code, lang))));
  const reviewLabels = Array.from(new Set(groupedFindings.filter((f) => f.status === 'review_required').map((f) => localizeRuleName(f.rule_code, lang))));
  const insufficientLabels = Array.from(new Set(groupedFindings.filter((f) => f.status === 'insufficient_information').map((f) => localizeRuleName(f.rule_code, lang))));

  return (
    <div className="space-y-6">
      <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs leading-relaxed ${metadata.provenance === 'synthetic' ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-amber-surface border-amber-border text-amber-text'}`} role="note">
        <span className="font-bold shrink-0">{localizeProvenance(metadata.provenance, lang)}</span>
        <span>{metadata.provenance === 'synthetic' ? t('demo_report_notice', lang) : t('entered_data_notice', lang)}</span>
      </div>
      {/* Top Action Bar (hidden in print) */}
      <div className="print:hidden p-3 border border-slate-subtle bg-bone text-xs rounded-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {metadata.is_stale ? (
            <span className="font-mono text-[11px] font-bold text-amber-text bg-amber-surface px-2 py-0.5 border border-amber-border rounded-xs">
              {t('stale_snapshot', lang)}
            </span>
          ) : (
            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300 rounded-xs">
              {t('sealed_snapshot', lang)}
            </span>
          )}
          <span className="text-slate-muted">
            {lang === 'bn' ? 'তৈরি হয়েছে:' : 'Generated:'} {formatDhakaDateTime(metadata.generated_at, lang)} • {t('rule_catalog_label', lang)} v{metadata.rule_version}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRunChecks}
            className="px-3 py-1.5 border border-slate-border bg-white text-slate-deep hover:bg-bone text-xs font-medium rounded-sm transition-colors cursor-pointer"
          >
            {t('rerun_checks', lang)}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-teal-brand text-white text-xs font-semibold rounded-sm hover:bg-teal-hover transition-colors shadow-2xs cursor-pointer"
          >
            {t('export_print', lang)}
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="border border-slate-border bg-white p-8 rounded-sm shadow-xs space-y-6 text-slate-charcoal text-xs print:border-none print:p-0 print:shadow-none">
        {/* Report Header */}
        <div className="border-b-2 border-slate-charcoal pb-4 space-y-4">
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-brand">
              {t('report_dossier_label', lang)}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-charcoal m-0 mt-0.5">
              {t('report_h1', lang)}
            </h1>
            <p className="text-xs text-slate-muted mt-1 font-mono">
              {t('case_code', lang)}: <strong className="text-slate-charcoal">{caseObj.case_code}</strong> • {caseObj.title}
            </p>
            <p className="text-[11px] text-slate-muted mt-1 max-w-2xl">{t('short_report_notice', lang)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2 text-left text-[11px]">
            <div className="min-w-0">
              <span className="text-slate-muted">{t('location', lang)}:</span>{' '}
              <strong>{Array.from(new Set([caseObj.mouza, caseObj.upazila, caseObj.district].filter(Boolean))).join(', ') || 'N/A'}</strong>
            </div>
            {caseObj.jl_number && (
              <div>
                <span className="text-slate-muted">{t('jl_number', lang)}:</span> <strong>{caseObj.jl_number}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-muted">{t('provenance', lang)}:</span>{' '}
              <strong>{localizeProvenance(metadata.provenance, lang)}</strong>
            </div>
            <div><span className="text-slate-muted">{t('as_of_date', lang)}:</span> <strong>{formatReportDate(metadata.as_of_date, lang)}</strong></div>
            <div><span className="text-slate-muted">{t('reviewer', lang)}:</span> <strong>{metadata.reviewer}</strong></div>
            <div><span className="text-slate-muted">{t('timezone_label', lang)}:</span> <strong>Asia/Dhaka (UTC+06:00)</strong></div>
            <div><span className="text-slate-muted">{t('rule_version_label', lang)}:</span> <strong>{metadata.rule_version}</strong></div>
            <div><span className="text-slate-muted">{t('configuration_label', lang)}:</span> <strong>{metadata.config_snapshot.area_tolerance_pct ?? 1}% · {metadata.config_snapshot.rapid_transfer_days ?? 30}d · {metadata.config_snapshot.mutation_reference_days ?? 45}d</strong></div>
            <div className="min-w-0">
              <span className="text-slate-muted">{t('input_hash_label', lang)}:</span>{' '}
              <span className="font-mono text-[10px] break-all">{metadata.input_hash || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* SHA-256 input fingerprint comparison */}
        <div className={`p-3 border rounded-xs flex flex-wrap items-center justify-between gap-2 text-[11px] ${
          integrity?.is_valid
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : integrity?.is_sealed
            ? 'border-burgundy-border bg-burgundy-surface text-burgundy-text'
            : 'border-slate-subtle bg-bone text-slate-muted'
        }`}>
          <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider">Input fingerprint (SHA-256):</span>
            {integrity?.is_valid ? (
              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 font-mono font-bold rounded-xs text-[10px]">
                INTACT (Matched)
              </span>
            ) : integrity?.is_sealed ? (
              <span className="px-1.5 py-0.5 bg-burgundy-marker text-white font-mono font-bold rounded-xs text-[10px]">
                MISMATCH (Altered)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-slate-subtle text-slate-muted font-mono rounded-xs text-[10px]">
                UNSEALED
              </span>
            )}
            <span>{integrity?.is_valid ? 'Current entered data matches the analysis snapshot.' : integrity?.is_sealed ? 'Current entered data differs from the analysis snapshot.' : 'No analysis snapshot is available.'}</span>
          </div>
          <div className="font-mono text-[10px]">
            {metadata.input_hash || 'N/A'}
          </div>
        </div>

        {/* Synthetic Sample Label */}
        <div className="p-2 border border-slate-subtle bg-bone text-[11px] text-slate-muted rounded-xs flex items-center justify-between">
          <span>{metadata.provenance === 'synthetic' ? t('demo_report_notice', lang) : t('entered_data_notice', lang)}</span>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-deep">{metadata.provenance === 'synthetic' ? t('fictional_scenario', lang) : t('provenance_user_entered', lang)}</span>
        </div>

        {/* Screening Banner / Executive Summary */}
        <div className="p-4 border rounded-sm bg-bone-light/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-muted">{t('screening_summary', lang)}:</span>
              <StatusBadge status={summary.banner_status} />
            </div>
            <div className="font-mono text-xs font-semibold text-slate-deep">
              {bannerIssueCount === undefined ? summary.banner_label : summary.banner_label.replace(/\(\d+\)/, `(${bannerIssueCount})`)}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-subtle text-center text-xs">
            <div className="p-2 border border-burgundy-border bg-burgundy-surface/40 rounded-xs">
              <span className="text-[10px] text-burgundy-text uppercase block">Conflicts</span>
              <span className="font-mono font-bold text-sm text-burgundy-text">{issueMetrics.issuesByStatus.conflict_detected}</span>
            </div>
            <div className="p-2 border border-amber-border bg-amber-surface/40 rounded-xs">
              <span className="text-[10px] text-amber-text uppercase block">Review Required</span>
              <span className="font-mono font-bold text-sm text-amber-text">{issueMetrics.issuesByStatus.review_required}</span>
            </div>
            <div className="p-2 border border-slate-border bg-slate-subtle rounded-xs">
              <span className="text-[10px] text-slate-muted uppercase block">Insufficient</span>
              <span className="font-mono font-bold text-sm text-slate-deep">{issueMetrics.issuesByStatus.insufficient_information}</span>
            </div>
            <div className="p-2 border border-emerald-300 bg-emerald-50 rounded-xs">
              <span className="text-[10px] text-emerald-800 uppercase block">{t('filter_consistent', lang)}</span>
              <span className="font-mono font-bold text-sm text-emerald-800">{summary.counts.no_inconsistency_found}</span>
            </div>
            <div className="p-2 border border-slate-border bg-slate-50 rounded-xs">
              <span className="text-[10px] text-slate-muted uppercase block">{t('filter_not_applicable', lang)}</span>
              <span className="font-mono font-bold text-sm text-slate-deep">{summary.counts.not_applicable || 0}</span>
            </div>
          </div>
          <p className="m-0 pt-1 text-[11px] text-slate-deep">
            {issueMetrics.issuesByStatus.conflict_detected} {t('conflict_count', lang)}{conflictLabels.length ? ` (${conflictLabels.join(', ')})` : ''}
            {issueMetrics.issuesByStatus.review_required > 0 && <> · {issueMetrics.issuesByStatus.review_required} {t('review_count', lang)}{reviewLabels.length ? ` (${reviewLabels.join(', ')})` : ''}</>}
            {issueMetrics.issuesByStatus.insufficient_information > 0 && <> · {issueMetrics.issuesByStatus.insufficient_information} {t('insufficient_count', lang)}{insufficientLabels.length ? ` (${insufficientLabels.join(', ')})` : ''}</>}
          </p>
          <p className="m-0 text-[11px] font-semibold text-slate-deep">
            {issueMetrics.issueCount} {issueMetrics.issueCount === 1 ? 'issue' : 'issues'} · {issueMetrics.checkCount} checks
          </p>
        </div>

        {/* Section 1: Source Records Reviewed */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
            1. Source Documents &amp; Records Reviewed ({records_reviewed.length})
          </h3>
          <div className="border border-slate-subtle rounded-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
              <tr className="border-b border-slate-subtle bg-bone text-slate-muted uppercase font-semibold">
                <th className="py-1.5 px-2">Type</th>
                <th className="py-1.5 px-2">Reference</th>
                <th className="py-1.5 px-2">Survey &amp; Plot</th>
                <th className="py-1.5 px-2">Khatian / Deed No</th>
                <th className="py-1.5 px-2">Stated Area</th>
                <th className="py-1.5 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-subtle">
              {records_reviewed.map((r) => (
                <tr key={r.id}>
                  <td className="py-1.5 px-2 font-mono capitalize">{r.record_type}</td>
                  <td className="py-1.5 px-2 font-semibold">{r.source_reference}</td>
                  <td className="py-1.5 px-2 font-mono">
                    {r.survey_series} Dag {r.dag_no}
                  </td>
                  <td className="py-1.5 px-2 font-mono">
                    {r.record_type === 'deed' ? r.deed_no : r.khatian_no}
                  </td>
                  <td className="py-1.5 px-2 font-mono">{r.area}</td>
                  <td className="py-1.5 px-2 font-mono text-slate-muted">{formatReportDate(r.date, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">{t('parties_crosswalk_report', lang)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="border border-slate-subtle rounded-xs p-2">
              <div className="font-semibold mb-1">{t('parties', lang)}</div>
              {report.parties_reviewed.length ? report.parties_reviewed.map((party) => (
                <div key={party.label} className="py-1 border-t border-slate-subtle">
                  <strong>{party.label}</strong><div className="text-slate-muted">{party.identity_status}</div>
                  {party.aliases.length > 0 && <div>{t('aliases', lang)}: {party.aliases.map((alias) => `${alias.text} (${alias.confirmed ? t('confirmed', lang) : t('unconfirmed', lang)})`).join(', ')}</div>}
                </div>
              )) : <div className="text-slate-muted">{t('no_parties', lang)}</div>}
            </div>
            <div className="border border-slate-subtle rounded-xs p-2">
              <div className="font-semibold mb-1">{t('crosswalk_status', lang)}</div>
              {report.crosswalks_reviewed.length ? report.crosswalks_reviewed.map((crosswalk, index) => (
                <div key={`${crosswalk.from}-${crosswalk.to}-${index}`} className="py-1 border-t border-slate-subtle">{crosswalk.from} → {crosswalk.to} · {crosswalk.status}{crosswalk.basis_note ? ` · ${crosswalk.basis_note}` : ''}</div>
              )) : <div className="text-slate-muted">{t('no_crosswalks', lang)}</div>}
            </div>
          </div>
        </div>

        {/* Section 2: Horizontal Pairwise Record Comparison Grid */}
        {comparison && comparison.records && comparison.records.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
              2. Horizontal Pairwise Record Comparison Grid
            </h3>
            <div className="border border-slate-subtle rounded-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold">
                    <th className="py-1.5 px-2 w-48">Evaluated Attribute</th>
                    <th className="py-1.5 px-2 w-24">Consistency</th>
                    {comparison.records.map((rec) => (
                      <th key={rec.id} className="py-1.5 px-2 font-mono">
                        <div>{rec.source_reference}</div>
                        <div className="text-[10px] text-slate-muted font-normal uppercase">{rec.record_type} ({rec.survey_series})</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-subtle">
                  {comparison.rows.map((row) => (
                    <tr
                      key={row.field_name}
                      className={row.has_conflict ? 'bg-burgundy-surface/30' : row.status === 'mismatch' ? 'bg-amber-surface/30' : ''}
                    >
                      <td className="py-1.5 px-2 font-medium">
                        <div>{row.field_label}</div>
                        {row.details && <div className="text-[10px] text-slate-muted font-normal">{row.details}</div>}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded-xs font-mono text-[9px] uppercase font-bold ${
                          row.status === 'match'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.has_conflict
                            ? 'bg-burgundy-marker text-white'
                            : 'bg-amber-surface text-amber-text border border-amber-border'
                        }`}>
                          {row.status === 'over_conveyance' ? 'Over-conveyance (JT-R05)' : row.status === 'mismatch' && row.has_conflict ? `Mismatch (${groupedFindings.find((f) => f.rule_code === 'JT-R02' && f.status === 'conflict_detected')?.rule_code || 'JT-R02'})` : row.status === 'unverified' ? 'Sequence' : row.status === 'not_applicable' ? '—' : row.status}
                        </span>
                      </td>
                      {row.cells.map((cell) => (
                        <td key={cell.record_id} className="py-1.5 px-2 font-mono text-[10px]">
                          {cell.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Discrepancy Findings & Evidence */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
            3. Detailed Screening Checks ({groupedFindings.length})
          </h3>
          {groupedFindings.length === 0 ? (
            <div className="p-3 text-center text-slate-muted italic">No findings generated.</div>
          ) : (
            <div className="space-y-2.5">
              {groupedFindings.map((f) => (
                <div
                  key={f.id}
                  className={`border rounded-xs p-3 space-y-1.5 ${
                    f.status === 'conflict_detected'
                      ? 'border-burgundy-border bg-burgundy-surface/20'
                      : f.status === 'review_required'
                      ? 'border-amber-border bg-amber-surface/20'
                      : 'border-slate-border bg-bone-light/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">{f.rule_code}</span>
                      <span className="font-semibold text-slate-charcoal">{f.summary}</span>
                    </div>
                  {relatedRuleCodes(f, groupedFindings).length > 1 && (
                    <div className="text-[10px] font-semibold text-burgundy-text">Related: {relatedRuleCodes(f, groupedFindings).join(', ')}</div>
                  )}
                    <StatusBadge status={f.status} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-deep leading-relaxed">
                    {f.groupExplanations.length > 1 ? (
                      <ul className="list-disc pl-4 space-y-1 m-0">{f.groupExplanations.map((explanation) => <li key={explanation}>{explanation}</li>)}</ul>
                    ) : f.explanation}
                  </div>
                  {f.evidence && f.evidence.length > 0 && (
                    <div className="text-[10px] font-mono text-slate-muted pt-1">
                      Cited Evidence: {f.evidence.filter((ev) => !(ev.field_name === 'area_unit' && f.evidence.some((other) => other.source_record_id === ev.source_record_id && other.field_name === 'area_value'))).map((ev) => {
                        const unit = ev.field_name === 'area_value' ? f.evidence.find((other) => other.source_record_id === ev.source_record_id && other.field_name === 'area_unit')?.observed_value : null;
                        const raw = ev.observed_value;
                        const value = raw === null || raw === undefined || raw === '' || raw === 'null' ? t('not_supplied', lang) : `${raw}${unit ? ` ${unit}` : ''}`;
                        return `${normalizeReferenceLabel(ev.reference_label) || ev.source_record_id} [${localizeRecordField(ev.field_name, lang)}: ${value}]`;
                      }).join(', ')}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-muted pt-1 border-t border-slate-subtle flex justify-between">
                    <span><strong>Limitation:</strong> {f.limitations}</span>
                    <span><strong>Follow-up:</strong> {f.recommended_next_step}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Chronological Chain Sequence */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
            4. Ownership Transfer Timeline Sequence ({timeline.length} Nodes)
          </h3>
          <div className="border border-slate-subtle rounded-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold">
                  <th className="py-1 px-2">#</th>
                  <th className="py-1 px-2">Date</th>
                  <th className="py-1 px-2">Transfer</th>
                  <th className="py-1 px-2">From Party</th>
                  <th className="py-1 px-2">To Party</th>
                  <th className="py-1 px-2">Plot &amp; Area</th>
                  <th className="py-1 px-2">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-subtle">
                {timeline.map((n, i) => (
                  <tr
                    key={i}
                    className={n.interruption_marker ? 'bg-burgundy-surface/40' : n.potential_overlap ? 'bg-amber-surface/40' : ''}
                  >
                    <td className="py-1 px-2 font-mono">{i + 1}</td>
                    <td className="py-1 px-2 font-mono">{n.date_display}</td>
                    <td className="py-1 px-2 uppercase font-mono text-[10px]">{n.transfer_type}</td>
                    <td className="py-1 px-2 font-medium">{n.from_party_label || '—'}</td>
                    <td className="py-1 px-2 font-medium">{n.to_party_label || '—'}</td>
                    <td className="py-1 px-2 font-mono">
                      {n.plot_reference || '—'} {n.area_display ? `(${n.area_display})` : ''}
                    </td>
                    <td className="py-1 px-2 font-mono">{n.source_reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: External Verification Checklist State */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
            5. External Verification Protocol Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {checklist.map((item, idx) => (
              <div key={item.id} className="p-2 border border-slate-subtle rounded-xs bg-bone-light/40 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-charcoal">
                    {idx + 1}. {item.label}
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase font-bold px-1 rounded-xs ${
                      item.status === 'reviewer_completed'
                        ? 'text-emerald-800 bg-emerald-100'
                        : item.status === 'not_applicable'
                        ? 'text-slate-muted bg-slate-subtle'
                        : 'text-amber-text bg-amber-surface'
                    }`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {item.completion_note && (
                  <div className="text-[10px] text-slate-muted">
                    Note: {item.completion_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Reviewer Activity & Audit Trail Summary */}
        {audit_summary && audit_summary.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
              6. Reviewer Activity &amp; Audit Trail Ledger ({audit_summary.length} Recent Events)
            </h3>
            <div className="border border-slate-subtle rounded-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold">
                    <th className="py-1 px-2 w-32">Dhaka time (UTC+06:00)</th>
                    <th className="py-1 px-2 w-32">Action</th>
                    <th className="py-1 px-2 w-24">Actor</th>
                    <th className="py-1 px-2">Run ID</th>
                    <th className="py-1 px-2">Rule version</th>
                    <th className="py-1 px-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-subtle">
                  {audit_summary.map((ev: any, i: number) => (
                    <tr key={ev.id || i}>
                      <td className="py-1 px-2 font-mono text-slate-muted">
                        {formatDhakaDateTime(ev.created_at, lang, {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: 'short',
                        })}
                      </td>
                      <td className="py-1 px-2 font-mono font-semibold">
                        {ev.action}
                      </td>
                      <td className="py-1 px-2">Local session (no login)</td>
                      <td className="py-1 px-2 font-mono">{ev.details?.run_id || '—'}</td>
                      <td className="py-1 px-2 font-mono">{ev.details?.rule_version || '—'}</td>
                      <td className="py-1 px-2">{ev.details?.result || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 7: Rules Screened */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted border-b border-slate-subtle pb-1 m-0">
            7. Deterministic Screening Rules Executed (v{metadata.rule_version})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] font-mono">
            {rules_run.map((r) => (
              <div key={r.code} className="p-1 border border-slate-subtle rounded-xs bg-bone text-center">
                <span className="font-bold text-teal-brand block">{r.code}</span>
                <span className="text-slate-muted truncate block">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8: Limitations & Disclaimer */}
        <div className="pt-4 border-t-2 border-slate-charcoal space-y-1.5 text-[11px] leading-relaxed text-slate-muted">
          <div className="font-bold text-slate-deep uppercase tracking-wider text-[10px]">
            {report.disclaimer ? 'Screening limitations and notice' : ''}
          </div>
          <p className="m-0">{t('report_disclaimer', lang)}</p>
          <div className="text-[10px] font-mono pt-1 text-slate-muted flex justify-between">
            <span>{t('dossier_ref', lang)}: {metadata.run_id}</span>
            <span>JomiTrace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
