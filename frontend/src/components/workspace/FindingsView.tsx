import React, { useState } from 'react';
import type { AnalysisRun } from '../../types';
import { findingIssueMetrics, groupFindings, relatedRuleCodes } from '../../utils/findings';
import { StatusBadge } from '../common/StatusBadge';
import {
  t,
  formatDigits,
  localizeCategory,
  localizeFindingSummary,
  localizeFindingExplanation,
  localizeFindingNote,
  localizeObservedKey,
  localizeRecordField,
  localizeRuleName,
  normalizeReferenceLabel,
  type Language,
} from '../../locales';

interface FindingsViewProps {
  run: AnalysisRun | null;
  caseStatus: string;
  loading: boolean;
  onRunChecks: () => void;
  onInspectRecord: (recordId: string) => void;
  lang: Language;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  run,
  caseStatus,
  loading,
  onRunChecks,
  onInspectRecord,
  lang,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-muted font-mono animate-pulse">
        {t('running_checks', lang)}
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-border rounded-sm bg-bone-light space-y-3">
        <h4 className="text-sm font-semibold text-slate-charcoal">
          {t('no_checks_yet_title', lang)}
        </h4>
        <p className="text-xs text-slate-muted max-w-md mx-auto leading-relaxed">
          {t('no_checks_yet_desc', lang)}
        </p>
        <button
          onClick={onRunChecks}
          className="px-4 py-2 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors shadow-2xs cursor-pointer"
        >
          {t('run_checks', lang)}
        </button>
      </div>
    );
  }

  const findings = run.findings || [];
  const groupedFindings = groupFindings(findings);
  const issueMetrics = findingIssueMetrics(groupedFindings);

  const filteredFindings = groupedFindings.filter((f) => {
    if (filterStatus === 'all') return true;
    return f.status === filterStatus;
  });
  const actionableFindings = filteredFindings.filter((f) => f.status !== 'no_inconsistency_found');
  const noIssueFindings = filteredFindings.filter((f) => f.status === 'no_inconsistency_found');

  const counts = {
    conflict: issueMetrics.issuesByStatus.conflict_detected,
    review: issueMetrics.issuesByStatus.review_required,
    insufficient: issueMetrics.issuesByStatus.insufficient_information,
    clean: groupedFindings.filter((f) => f.status === 'no_inconsistency_found').length,
    notApplicable: groupedFindings.filter((f) => f.status === 'not_applicable').length,
  };

  return (
    <div className="space-y-4">
      {/* Run Header / Case Summary Banner */}
              <div className="border border-slate-border bg-white p-4 rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-charcoal m-0">
              {t('screening_results', lang)}
            </h3>
            <StatusBadge status={caseStatus} lang={lang} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-muted">
              {t('rule_version_label', lang)}{run.rule_version} • {t('hash_label', lang)}: {run.input_hash.slice(0, 10)}...
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-subtle text-xs">
          <span className="text-slate-muted font-semibold text-[11px] uppercase mr-1">
            {t('filter_label', lang)}
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            aria-pressed={filterStatus === 'all'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-charcoal text-white font-medium'
                : 'bg-bone text-slate-deep hover:bg-bone-muted'
            }`}
          >
            {t('filter_all', lang)} ({formatDigits(groupedFindings.length, lang)})
          </button>
          <button
            onClick={() => setFilterStatus('conflict_detected')}
            aria-pressed={filterStatus === 'conflict_detected'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              filterStatus === 'conflict_detected'
                ? 'bg-burgundy-marker text-white font-medium'
                : 'bg-burgundy-surface text-burgundy-text hover:bg-burgundy-surface/80'
            }`}
          >
            {t('filter_conflicts', lang)} ({formatDigits(counts.conflict, lang)})
          </button>
          <button
            onClick={() => setFilterStatus('review_required')}
            aria-pressed={filterStatus === 'review_required'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              filterStatus === 'review_required'
                ? 'bg-amber-marker text-white font-medium'
                : 'bg-amber-surface text-amber-text hover:bg-amber-surface/80'
            }`}
          >
            {t('filter_review', lang)} ({formatDigits(counts.review, lang)})
          </button>
          <button
            onClick={() => setFilterStatus('insufficient_information')}
            aria-pressed={filterStatus === 'insufficient_information'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              filterStatus === 'insufficient_information'
                ? 'bg-slate-deep text-white font-medium'
                : 'bg-slate-subtle text-slate-deep hover:bg-slate-border'
            }`}
          >
            {t('filter_insufficient', lang)} ({formatDigits(counts.insufficient, lang)})
          </button>
          <button
            onClick={() => setFilterStatus('no_inconsistency_found')}
            aria-pressed={filterStatus === 'no_inconsistency_found'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              filterStatus === 'no_inconsistency_found'
                ? 'bg-emerald-700 text-white font-medium'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {t('filter_consistent', lang)} ({formatDigits(counts.clean, lang)})
          </button>
          <button
            onClick={() => setFilterStatus('not_applicable')}
            aria-pressed={filterStatus === 'not_applicable'}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${filterStatus === 'not_applicable' ? 'bg-slate-deep text-white font-medium' : 'bg-slate-subtle text-slate-deep hover:bg-slate-border'}`}
          >
            {t('filter_not_applicable', lang)} ({formatDigits(counts.notApplicable, lang)})
          </button>
        </div>
        <p className="m-0 text-[11px] text-slate-muted">{t('limitations_near_status', lang)}</p>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-muted border border-slate-border rounded-sm bg-white">
          {t('no_findings_filter', lang)}
        </div>
      ) : (
        <div className="space-y-3">
          {actionableFindings.map((f) => (
            <div
              key={f.id}
              className={`border rounded-xl p-4 sm:p-5 bg-white shadow-2xs space-y-3 transition-colors ${
                f.status === 'conflict_detected'
                  ? 'border-l-4 border-l-burgundy-marker border-burgundy-border bg-white'
                  : f.status === 'review_required'
                  ? 'border-l-4 border-l-amber-marker border-amber-border bg-white'
                  : f.status === 'insufficient_information'
                  ? 'border-l-4 border-l-slate-muted border-slate-border bg-white'
                  : 'border-l-4 border-l-emerald-600 border-emerald-300 bg-white'
              }`}
            >
              {/* Finding Title & Badges */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-subtle text-slate-charcoal px-1.5 py-0.5 rounded-xs border border-slate-border" title={`${t('rule_applied_label', lang)}: ${localizeRuleName(f.rule_code, lang)}`}>
                      {f.rule_code} · {localizeRuleName(f.rule_code, lang)}
                    </span>
                    {f.status !== 'no_inconsistency_found' && f.status !== 'not_applicable' && <span className="text-[11px] font-mono text-slate-muted uppercase">
                      {localizeCategory(f.category, lang)}
                    </span>}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-charcoal m-0">
                    {localizeFindingSummary(f.summary, lang)}
                  </h4>
                  {relatedRuleCodes(f, groupedFindings).length > 1 && (
                    <p className="m-0 text-[10px] font-medium text-burgundy-text">
                      Related: {relatedRuleCodes(f, groupedFindings).join(', ')}
                    </p>
                  )}
                </div>
                <StatusBadge status={f.status} lang={lang} />
              </div>

              {/* The trigger and source citations stay visible; technical details expand on demand. */}
              <div className="bg-bone-light p-3 rounded-lg border border-slate-subtle text-xs text-slate-deep leading-relaxed">
                <span className="font-semibold text-slate-charcoal block mb-0.5">
                  {t('observation_context', lang)}
                </span>
                {f.groupExplanations.length > 1 ? (
                  <ul className="list-disc pl-4 space-y-1 m-0">
                    {f.groupExplanations.map((explanation) => (
                      <li key={explanation}>{localizeFindingExplanation(explanation, lang)}</li>
                    ))}
                  </ul>
                ) : localizeFindingExplanation(f.explanation, lang)}
              </div>

              {/* Evidence References with Inspect Link */}
              <div className="pt-2 border-t border-slate-subtle space-y-2 text-xs">
                <span className="text-slate-muted font-semibold text-[11px] block">{t('source_citation', lang)}</span>
                {f.evidence?.length ? (
                  <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="text-slate-muted font-semibold text-[11px]">
                      {t('cited_records', lang)}
                    </span>
                    {f.evidence.filter((ev) => !(ev.field_name === 'area_unit' && f.evidence.some((other) => other.source_record_id === ev.source_record_id && other.field_name === 'area_value'))).map((ev, i) => {
                      const unit = ev.field_name === 'area_value' ? f.evidence.find((other) => other.source_record_id === ev.source_record_id && other.field_name === 'area_unit')?.observed_value : null;
                      const rawValue = ev.observed_value;
                      const value = rawValue === null || rawValue === undefined || rawValue === '' || rawValue === 'null' ? t('not_supplied', lang) : `${rawValue}${unit ? ` ${unit}` : ''}`;
                      return (
                      <span
                        key={`${ev.source_record_id}-${ev.field_name}-${i}`}
                        className="inline-flex flex-wrap items-center gap-1 px-2 py-1 border border-slate-border bg-white text-[11px] rounded-md font-mono max-w-full"
                      >
                        <span className="font-medium text-slate-charcoal">
                          {normalizeReferenceLabel(ev.reference_label) || ev.source_record_id.slice(0, 8)}
                        </span>
                        <span className="text-slate-muted">· {localizeRecordField(ev.field_name, lang)}</span>
                        <span className="text-slate-deep break-all">= {value}</span>
                      </span>
                    );})}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {f.evidence
                      .filter(
                        (ev, idx, arr) =>
                          arr.findIndex((e) => e.source_record_id === ev.source_record_id) === idx
                      )
                      .map((ev) => (
                        <button
                          key={ev.source_record_id}
                          onClick={() => onInspectRecord(ev.source_record_id)}
                          className="text-xs text-teal-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
                        >
                          {t('inspect_record_btn', lang)} {normalizeReferenceLabel(ev.reference_label) || 'Record'} &rarr;
                        </button>
                      ))}
                  </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-muted m-0">{t('no_source_citation', lang)}</p>
                )}
              </div>

              {f.status !== 'no_inconsistency_found' && f.status !== 'not_applicable' && <div className="p-3 rounded-lg border border-teal-subtle bg-teal-subtle/20 text-xs leading-relaxed">
                <span className="font-semibold text-teal-brand block mb-1">{t('next_step_label', lang)}</span>
                <span className="text-slate-deep">{localizeFindingNote(f.recommended_next_step, lang)}</span>
              </div>}

              <details className="border-t border-slate-subtle pt-2 text-[11px] text-slate-muted">
                <summary className="cursor-pointer font-semibold text-slate-deep rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand">{t('more_finding_details', lang)}</summary>
                {f.observed_values && Object.keys(f.observed_values).length > 0 && (
                  <div className="mt-2 p-2.5 bg-bone rounded-md border border-slate-subtle space-y-1.5 overflow-x-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">{t('observed_comparison', lang)}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono min-w-[280px]">
                      {Object.entries(f.observed_values).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-subtle pb-0.5">
                          <span>{localizeObservedKey(k, lang)}:</span>
                          <span className="font-semibold text-slate-charcoal break-all text-right">{v === null || v === undefined || v === 'null' || v === '' ? t('not_supplied', lang) : typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-2 mb-0"><span className="font-semibold text-slate-deep">{t('limitation_label', lang)}</span> {localizeFindingNote(f.limitations, lang)}</p>
              </details>
            </div>
          ))}
          {noIssueFindings.length > 0 && (
            <details className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
              <summary className="cursor-pointer font-semibold text-emerald-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand">
                {formatDigits(noIssueFindings.length, lang)} {t('no_issue_group', lang)}
              </summary>
              <div className="mt-3 space-y-2">
                {noIssueFindings.map((f) => (
                  <div key={f.id} className="bg-white border border-emerald-100 rounded-lg px-3 py-2 text-xs">
                    <div className="font-semibold text-slate-deep">{f.rule_code} · {localizeRuleName(f.rule_code, lang)} — {localizeFindingSummary(f.summary, lang)}</div>
                    <p className="my-1 text-slate-700">{f.groupExplanations.map((item) => localizeFindingExplanation(item, lang)).join(' ')}</p>
                    {f.evidence.length > 0 && <div className="text-[11px] text-slate-muted">{t('source_citation', lang)} {f.evidence.map((item) => `${normalizeReferenceLabel(item.reference_label) || item.source_record_id} · ${localizeRecordField(item.field_name, lang)}`).join('; ')}</div>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
