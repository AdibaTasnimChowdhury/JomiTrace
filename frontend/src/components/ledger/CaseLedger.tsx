import React, { useEffect, useState, useMemo } from 'react';
import { api, ApiError } from '../../api/client';
import type { CaseStatus, Provenance, VerificationCase } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CreateCaseModal } from './CreateCaseModal';
import { LoadScenarioModal } from './LoadScenarioModal';
import {
  t,
  formatDigits,
  formatDhakaDateTime,
  localizeCaseTitle,
  localizeProvenance,
  type Language,
} from '../../locales';

interface CaseLedgerProps {
  onSelectCase: (caseObj: VerificationCase) => void;
  lang: Language;
}

export const CaseLedger: React.FC<CaseLedgerProps> = ({ onSelectCase, lang }) => {
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dataScope, setDataScope] = useState<'all' | 'demo' | 'entered'>('all');
  const [showLedgerTools, setShowLedgerTools] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCases({
        status: statusFilter === 'all' ? undefined : (statusFilter as CaseStatus),
        provenance: dataScope === 'all' ? undefined : (dataScope === 'demo' ? 'synthetic' : 'user_entered') as Provenance,
        search: search.trim() || undefined,
      });
      setCases(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(lang === 'bn' ? 'সার্ভার থেকে কেস লোড করতে সমস্যা হয়েছে।' : 'Failed to load cases from backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, dataScope]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string, caseCode: string) => {
    e.stopPropagation();
    const confirmMsg =
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে কেস '${caseCode}' এবং এর সংশ্লিষ্ট সকল রেকর্ড মুছে ফেলতে চান?`
        : `Are you sure you want to delete case '${caseCode}' and all its associated records?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      await api.deleteCase(caseId);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch (err: unknown) {
      alert(lang === 'bn' ? 'কেস মুছতে সমস্যা হয়েছে।' : 'Failed to delete case.');
    }
  };

  // Operational Counts derived from currently loaded cases or API
  const counts = useMemo(() => {
    const res = {
      conflict: 0,
      review: 0,
      insufficient: 0,
      clean: 0,
      draft: 0,
    };
    cases.forEach((c) => {
      if (c.status === 'conflict_detected') res.conflict++;
      else if (c.status === 'review_required') res.review++;
      else if (c.status === 'in_review') res.insufficient++;
      else if (c.status === 'report_ready') res.clean++;
      else if (c.status === 'draft') res.draft++;
    });
    return res;
  }, [cases]);

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Narrow Left Column: Operational Status Queue */}
      <aside className="col-span-12 lg:col-span-3">
        <button
          type="button"
          aria-expanded={showLedgerTools}
          onClick={() => setShowLedgerTools((open) => !open)}
          className="lg:hidden w-full mb-3 flex items-center justify-between px-3 py-2.5 border border-slate-border bg-white text-left text-xs font-semibold text-slate-deep rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
        >
          <span>{lang === 'bn' ? 'ফিল্টার ও ডেমো সরঞ্জাম' : 'Filters and demo tools'}</span>
          <span aria-hidden="true">{showLedgerTools ? '−' : '+'}</span>
        </button>
        <div className={`${showLedgerTools ? 'flex' : 'hidden'} lg:flex flex-col gap-4`}>
        <div className="border border-slate-border bg-white p-4 rounded-sm shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-deep mb-3 flex items-center justify-between">
            <span>{t('operational_status', lang)}</span>
            <span className="text-[10px] font-mono font-normal text-slate-muted">
              {formatDigits(cases.length, lang)} {cases.length === 1 ? t('record_singular', lang) : t('record_count', lang).toLowerCase()}
            </span>
          </h2>

          <div className="space-y-2">
            <button
              onClick={() => setStatusFilter(statusFilter === 'conflict_detected' ? 'all' : 'conflict_detected')}
              className={`w-full flex items-center justify-between p-2 border text-xs rounded-sm transition-colors text-left cursor-pointer ${statusFilter === 'conflict_detected' ? 'border-burgundy-marker bg-burgundy-surface text-burgundy-text font-bold ring-1 ring-burgundy-marker' : 'border-burgundy-border bg-burgundy-surface/70 text-burgundy-text hover:bg-burgundy-surface'}`}
            >
              <span>{t('conflict_detected', lang)}</span><span className="font-mono font-bold">{formatDigits(counts.conflict, lang)}</span>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'review_required' ? 'all' : 'review_required')}
              className={`w-full flex items-center justify-between p-2 border text-xs rounded-sm transition-colors text-left cursor-pointer ${
                statusFilter === 'review_required'
                  ? 'border-amber-text bg-amber-surface text-amber-text font-bold ring-1 ring-amber-text'
                  : 'border-amber-border bg-amber-surface/70 text-amber-text hover:bg-amber-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-marker" />
                <span>{t('review_required', lang)}</span>
              </div>
              <span className="font-mono font-bold">{formatDigits(counts.review, lang)}</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'in_review' ? 'all' : 'in_review')}
              className={`w-full flex items-center justify-between p-2 border text-xs rounded-sm transition-colors text-left cursor-pointer ${
                statusFilter === 'in_review'
                  ? 'border-slate-deep bg-slate-subtle text-slate-charcoal font-bold ring-1 ring-slate-deep'
                  : 'border-slate-border bg-slate-subtle/70 text-slate-deep hover:bg-slate-subtle'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-muted" />
                <span>{t('insufficient_info', lang)}</span>
              </div>
              <span className="font-mono font-bold">{formatDigits(counts.insufficient, lang)}</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'report_ready' ? 'all' : 'report_ready')}
              className={`w-full flex items-center justify-between p-2 border text-xs rounded-sm transition-colors text-left cursor-pointer ${
                statusFilter === 'report_ready'
                  ? 'border-emerald-600 bg-emerald-100 text-emerald-900 font-bold ring-1 ring-emerald-600'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{t('no_inconsistency', lang)}</span>
              </div>
              <span className="font-mono font-bold">{formatDigits(counts.clean, lang)}</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
              className={`w-full flex items-center justify-between p-2 border text-xs rounded-sm transition-colors text-left cursor-pointer ${
                statusFilter === 'draft'
                  ? 'border-slate-deep bg-bone text-slate-charcoal font-bold ring-1 ring-slate-deep'
                  : 'border-slate-border bg-bone-light text-slate-muted hover:bg-bone'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-border" />
                <span>{t('draft_records', lang)}</span>
              </div>
              <span className="font-mono font-bold">{formatDigits(counts.draft, lang)}</span>
            </button>
          </div>

          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-3 w-full text-center text-[11px] text-teal-brand hover:underline cursor-pointer"
            >
              {t('reset_filter', lang)}
            </button>
          )}
        </div>

        {/* Scenario Loader Card */}
        <div
          data-tour="ledger-scenarios"
          className="border border-slate-border bg-bone-light p-4 rounded-sm text-xs space-y-2"
        >
          <div className="font-bold text-slate-charcoal flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-brand" />
            <span>{t('fictional_benchmarks', lang)}</span>
          </div>
          <p className="text-slate-muted text-[11px] leading-relaxed">
            {t('fictional_desc', lang)}
          </p>
          <button
            onClick={() => setIsScenarioOpen(true)}
            className="w-full mt-1 px-3 py-1.5 border border-teal-brand text-teal-brand bg-white text-xs font-semibold rounded-sm hover:bg-teal-subtle transition-colors cursor-pointer"
          >
            {t('load_scenario', lang)}
          </button>
        </div>

        {/* Explainability notice */}
        <div className="p-3 border border-slate-subtle bg-white text-[11px] text-slate-muted rounded-sm leading-relaxed">
          <span className="font-semibold text-slate-deep">{t('scope_notice_title', lang)}</span>{' '}
          {t('scope_notice_desc', lang)}
        </div>
        </div>
      </aside>

      {/* Wide Right Pane: Case Ledger Table */}
      <section
        data-tour="ledger-table"
        className="col-span-12 lg:col-span-9 border border-slate-border bg-white rounded-sm shadow-xs overflow-hidden flex flex-col"
      >
        <div className="px-3 sm:px-4 pt-3 flex flex-wrap items-center gap-2" role="group" aria-label={lang === 'bn' ? 'কেসের উৎস অনুযায়ী ফিল্টার' : 'Filter cases by source'}>
          {([
            ['all', t('filter_all_cases', lang)],
            ['demo', t('filter_demo_cases', lang)],
            ['entered', t('filter_entered_cases', lang)],
          ] as const).map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              aria-pressed={dataScope === scope}
              onClick={() => setDataScope(scope)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand ${dataScope === scope ? 'bg-teal-brand text-white border-teal-brand' : 'bg-white text-slate-deep border-slate-border hover:bg-bone'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Controls Toolbar */}
        <div className="border-b border-slate-subtle p-3.5 bg-bone-light flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              aria-label={t('search_placeholder', lang)}
              placeholder={t('search_placeholder', lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 border border-slate-border bg-bone hover:bg-bone-muted text-xs font-medium text-slate-deep rounded-sm transition-colors cursor-pointer"
            >
              {t('search', lang)}
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchCases();
                }}
                className="text-xs text-slate-muted hover:text-slate-deep underline cursor-pointer"
              >
                {t('clear', lang)}
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 bg-teal-brand hover:bg-teal-hover text-white text-xs font-medium rounded-sm transition-colors shadow-2xs cursor-pointer"
            >
              + {t('create_case', lang)}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 border-b border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs">
            {error}
          </div>
        )}

        {/* Cases Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-muted">
            <span className="inline-block animate-pulse font-mono">
              {lang === 'bn' ? 'তদন্ত লেজার লোড হচ্ছে...' : 'Loading investigation ledger...'}
            </span>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-sm font-semibold text-slate-charcoal">{t('no_cases_found', lang)}</p>
              <p className="text-xs text-slate-muted leading-relaxed">
                {search || statusFilter !== 'all'
                  ? t('no_cases_desc_filtered', lang)
                  : t('no_cases_desc_empty', lang)}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-3 py-1.5 border border-slate-border text-xs font-medium text-slate-deep rounded-sm hover:bg-bone cursor-pointer"
                >
                  {t('create_case', lang)}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-border bg-white">
            <div className="sticky left-0 z-10 px-3 py-1.5 bg-slate-50 border-b border-slate-subtle text-[10px] text-slate-muted sm:hidden">
              {lang === 'bn' ? 'কেসের সব তথ্য দেখতে পাশে স্ক্রল করুন' : 'Swipe horizontally to view all case details'}
            </div>
            <table className="w-full min-w-[760px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">{t('case_code', lang)}</th>
                  <th className="py-2.5 px-4">{t('case_title', lang)} &amp; {t('location', lang)}</th>
                  <th className="py-2.5 px-4">{t('status', lang)}</th>
                  <th className="py-2.5 px-4">{t('provenance', lang)}</th>
                  <th className="py-2.5 px-4">{t('last_updated', lang)}</th>
                  <th className="py-2.5 px-4 text-right">{t('actions', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-subtle">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className="hover:bg-bone/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-teal-brand group-hover:underline">
                      {c.case_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-charcoal">
                        {localizeCaseTitle(c.title, lang)}
                      </div>
                      <div className="text-[11px] text-slate-muted">
                        {Array.from(new Set([c.mouza, c.upazila, c.district].filter(Boolean))).join(', ') || t('location_not_specified', lang)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" lang={lang} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] uppercase text-slate-muted bg-slate-subtle px-1.5 py-0.5 rounded-xs">
                        {localizeProvenance(c.provenance, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-muted font-mono text-[11px]">
                      {formatDhakaDateTime(c.updated_at, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-border text-teal-brand hover:border-teal-brand font-medium rounded-sm text-xs transition-colors cursor-pointer"
                        >
                          {t('open_case', lang)}
                        </button>
                        <button
                          onClick={(e) => handleDeleteCase(e, c.id, c.case_code)}
                          title={t('delete_case', lang)}
                          aria-label={`${t('delete_case', lang)} ${c.case_code}`}
                          className="px-2 py-1 text-slate-muted hover:text-burgundy-text hover:bg-burgundy-surface/40 rounded-sm text-xs transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      <CreateCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCaseCreated={(newCase) => {
          fetchCases();
          onSelectCase(newCase);
        }}
        lang={lang}
      />

      <LoadScenarioModal
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
        onScenarioLoaded={(loadedCase) => {
          fetchCases();
          onSelectCase(loadedCase);
        }}
        lang={lang}
      />
    </div>
  );
};
