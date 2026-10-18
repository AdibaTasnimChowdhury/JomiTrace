import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { AnalysisRun, Party, VerificationCase } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RecordsView } from './RecordsView';
import { PartiesView } from './PartiesView';
import { FindingsView } from './FindingsView';
import { TimelineView } from './TimelineView';
import { ComparisonView } from './ComparisonView';
import { ChecklistView } from './ChecklistView';
import { AuditView } from './AuditView';
import { ReportView } from './ReportView';
import { findingIssueMetrics, groupFindings } from '../../utils/findings';
import { t, formatDigits, formatDhakaDateTime, localizeCaseTitle, localizeProvenance, type Language } from '../../locales';

interface CaseWorkspaceProps {
  initialCase: VerificationCase;
  onBackToLedger: () => void;
  lang: Language;
}

type WorkspaceTab =
  | 'overview'
  | 'records'
  | 'parties'
  | 'findings'
  | 'timeline'
  | 'comparison'
  | 'checklist'
  | 'audit'
  | 'report';

export const CaseWorkspace: React.FC<CaseWorkspaceProps> = ({
  initialCase,
  onBackToLedger,
  lang,
}) => {
  const [currentCase, setCurrentCase] = useState<VerificationCase>(initialCase);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('findings');
  const [parties, setParties] = useState<Party[]>([]);
  const [latestRun, setLatestRun] = useState<AnalysisRun | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inspectedRecordId, setInspectedRecordId] = useState<string | null>(null);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const displayedFindings = groupFindings(latestRun?.findings ?? []);
  const issueMetrics = findingIssueMetrics(displayedFindings);
  const findingCounts = {
    conflict: issueMetrics.issuesByStatus.conflict_detected,
    review: issueMetrics.issuesByStatus.review_required,
    insufficient: issueMetrics.issuesByStatus.insufficient_information,
    noIssue: displayedFindings.filter((finding) => finding.status === 'no_inconsistency_found').length,
    notApplicable: displayedFindings.filter((finding) => finding.status === 'not_applicable').length,
    total: displayedFindings.length,
  };
  const hasItemsToReview = findingCounts.conflict + findingCounts.review + findingCounts.insufficient > 0;

  const fetchCaseData = async () => {
    setRunsLoading(true);
    try {
      const [caseData, partiesData, runsData] = await Promise.all([
        api.getCase(currentCase.id),
        api.listParties(currentCase.id),
        api.getRuns(currentCase.id),
      ]);
      setCurrentCase(caseData);
      setParties(partiesData);
      setLatestRun(runsData.length > 0 ? runsData[0] : null);
    } catch (err: unknown) {
      console.error('Error fetching case data', err);
    } finally {
      setRunsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [currentCase.id]);

  const handleRunChecks = async () => {
    setAnalyzing(true);
    setActionError(null);
    try {
      const res = await api.analyzeCase(currentCase.id);
      setLatestRun(res.run);
      // Refresh case to update status
      const updatedCase = await api.getCase(currentCase.id);
      setCurrentCase(updatedCase);
      setActiveTab('findings');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionError(err.detail);
      } else {
        setActionError('Failed to run verification checks.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInspectRecord = (recordId: string) => {
    setInspectedRecordId(recordId);
    setActiveTab('records');
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header Card */}
      <div className="border border-slate-border bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-l-4 border-teal-brand p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-4">
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-charcoal m-0 leading-tight">
                {localizeCaseTitle(currentCase.title, lang)}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={onBackToLedger}
                  className="text-[11px] text-slate-muted hover:text-teal-brand font-medium flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand rounded"
                >
                  ← {lang === 'bn' ? 'লেজারে ফিরুন' : 'Back to Ledger'}
                </button>
                <span className="text-slate-border">·</span>
                <span className="font-mono font-semibold text-[11px] text-slate-muted bg-slate-50 border border-slate-subtle px-2 py-0.5 rounded-full whitespace-nowrap">
                  {currentCase.case_code}
                </span>
                <span className="whitespace-nowrap"><StatusBadge status={currentCase.status} lang={lang} /></span>
                <span className={`text-[10px] font-semibold ${currentCase.provenance === 'synthetic' ? 'text-indigo-800 bg-indigo-50 border-indigo-200' : 'text-slate-deep bg-slate-50 border-slate-subtle'} border px-2 py-0.5 rounded-full`}>
                  {localizeProvenance(currentCase.provenance, lang)}
                </span>
              </div>

              <div className="text-[11px] text-slate-muted font-mono flex flex-wrap gap-x-4 gap-y-0.5">
                <span>
                  {lang === 'bn' ? 'এলাকা' : 'Location'}:{' '}
                  {Array.from(new Set([currentCase.mouza, currentCase.upazila, currentCase.district].filter(Boolean))).join(', ') || (lang === 'bn' ? 'উল্লেখ নেই' : 'N/A')}
                </span>
                {currentCase.jl_number && <span>{lang === 'bn' ? 'জে.এল.' : 'JL'}: {currentCase.jl_number}</span>}
                <span>{lang === 'bn' ? 'সর্বশেষ' : 'Updated'}: {formatDhakaDateTime(currentCase.updated_at, lang, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto lg:min-w-64">
            {latestRun && (
              <div className="flex flex-wrap items-center lg:justify-end gap-2 text-[11px]" aria-live="polite">
                <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-subtle text-slate-deep">
                  {t('screened_count', lang)}: {formatDigits(findingCounts.total, lang)}
                </span>
                <span className="px-2 py-1 rounded-full border border-slate-subtle bg-white text-slate-deep">
                  {findingCounts.conflict > 0 && <>{t('conflict_count', lang)} ({formatDigits(findingCounts.conflict, lang)})</>}
                  {findingCounts.conflict > 0 && findingCounts.review > 0 && ' · '}
                  {findingCounts.review > 0 && <>{t('review_count', lang)} ({formatDigits(findingCounts.review, lang)})</>}
                  {findingCounts.insufficient > 0 && <> · {t('insufficient_count', lang)} ({formatDigits(findingCounts.insufficient, lang)})</>}
                  {!hasItemsToReview && <>{lang === 'bn' ? 'কোনো সমস্যা পাওয়া যায়নি' : 'No issue found'}</>}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                if (latestRun && !latestRun.is_stale) setActiveTab('findings');
                else handleRunChecks();
              }}
              disabled={analyzing}
              className="px-4 py-2.5 bg-teal-brand hover:bg-teal-hover text-white text-xs font-semibold rounded-md transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50 cursor-pointer w-full lg:w-auto justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
            >
              {analyzing ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-ping" />
                  <span>{t('running_checks', lang)}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{latestRun?.is_stale ? t('rerun_checks', lang) : latestRun ? (hasItemsToReview ? t('review_findings', lang) : t('continue_review', lang)) : t('run_checks', lang)}</span>
                </>
              )}
            </button>
            </div>
          </div>


        {/* Stale Warning Banner */}
        {latestRun && latestRun.is_stale && (
          <div className="mx-5 mb-1 p-3 border border-amber-border bg-amber-surface text-amber-text text-xs rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-marker flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{t('records_changed_stale', lang)}</span>
            </div>
            <button
              onClick={handleRunChecks}
              disabled={analyzing}
              className="px-2.5 py-1 bg-amber-marker text-white text-[11px] font-semibold rounded-sm hover:bg-amber-600 transition-colors shrink-0 cursor-pointer"
            >
              {t('rerun_checks', lang)}
            </button>
          </div>
        )}

        {actionError && (
          <div className="mx-5 mb-1 p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
            {actionError}
          </div>
        )}
        </div>

        {/* Workspace Tab Navigation */}
        <nav aria-label={lang === 'bn' ? 'কেস ওয়ার্কস্পেস বিভাগ' : 'Case workspace sections'} className="flex gap-0 border-t border-slate-subtle text-xs px-2 sm:px-4 pt-2 pb-0 overflow-x-auto whitespace-nowrap" data-tour="workspace-evidence">
          {([
            { id: 'findings', label: `${t('tab_findings', lang)}${latestRun?.findings ? ` (${formatDigits(displayedFindings.length, lang)})` : ''}`, tourAttr: 'findings-view' },
            { id: 'records', label: t('tab_records', lang), tourAttr: null },
            { id: 'parties', label: `${t('tab_parties', lang)} (${formatDigits(parties.length, lang)})`, tourAttr: null },
            { id: 'timeline', label: t('tab_timeline', lang), tourAttr: 'timeline-tab' },
            { id: 'comparison', label: t('tab_comparison', lang), tourAttr: null },
          ] as { id: WorkspaceTab; label: string; tourAttr: string | null }[]).map(({ id, label, tourAttr }) => (
            <button
              key={id}
              data-tour={tourAttr ?? undefined}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === id
                  ? 'border-teal-brand text-teal-brand font-bold bg-teal-subtle/20'
                  : 'border-transparent text-slate-muted hover:text-slate-charcoal hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 my-2 border-l border-slate-border" aria-hidden="true" />
          <button
            type="button"
            aria-expanded={showMoreTabs || ['checklist', 'audit', 'report'].includes(activeTab)}
            onClick={() => setShowMoreTabs((open) => !open)}
            className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-deep hover:bg-slate-50 rounded-t-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
          >
            {t('more_tools', lang)}
          </button>
          {(showMoreTabs || ['checklist', 'audit', 'report'].includes(activeTab)) && ([
            { id: 'checklist', label: t('tab_checklist', lang), tourAttr: 'checklist-tab' },
            { id: 'audit', label: t('tab_audit', lang), tourAttr: 'audit-tab' },
            { id: 'report', label: t('tab_report', lang), tourAttr: 'report-tab' },
          ] as { id: WorkspaceTab; label: string; tourAttr: string }[]).map(({ id, label, tourAttr }) => (
            <button
              key={id}
              data-tour={tourAttr}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === id ? 'border-teal-brand text-teal-brand font-bold bg-teal-subtle/20' : 'border-transparent text-slate-muted hover:text-slate-charcoal hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Pane */}
      <div className="bg-white border border-slate-border rounded-xl p-3 sm:p-5 shadow-xs min-w-0">
        {activeTab === 'findings' && (
          <FindingsView
            run={latestRun}
            caseStatus={currentCase.status}
            loading={runsLoading || analyzing}
            onRunChecks={handleRunChecks}
            onInspectRecord={handleInspectRecord}
            lang={lang}
          />
        )}

        {activeTab === 'records' && (
          <RecordsView
            caseId={currentCase.id}
            parties={parties}
            onRecordsChanged={fetchCaseData}
            inspectedRecordId={inspectedRecordId}
            lang={lang}
          />
        )}

        {activeTab === 'parties' && (
          <PartiesView
            caseId={currentCase.id}
            onDataChanged={fetchCaseData}
            lang={lang}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            caseId={currentCase.id}
            onInspectRecord={handleInspectRecord}
            lang={lang}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonView
            caseId={currentCase.id}
            onInspectRecord={handleInspectRecord}
            lang={lang}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView
            caseId={currentCase.id}
            lang={lang}
          />
        )}

        {activeTab === 'audit' && (
          <AuditView
            caseItem={currentCase}
            lang={lang}
          />
        )}

        {activeTab === 'report' && (
          <ReportView
            caseId={currentCase.id}
            onRunChecks={handleRunChecks}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
};
