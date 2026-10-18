import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AuditTrailResponse, IntegrityCheckResponse, VerificationCase } from '../../types';
import { t, formatDhakaDateTime, type Language } from '../../locales';

interface AuditViewProps {
  caseItem: VerificationCase;
  lang: Language;
}

export const AuditView: React.FC<AuditViewProps> = ({ caseItem, lang }) => {
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');


  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditData, integrityData] = await Promise.all([
        api.getAuditTrail(caseItem.id),
        // Passive read: log_event=false ensures no audit event is written on page
        // load or tab-switch. The audit ledger should only record deliberate actions.
        api.verifyIntegrity(caseItem.id, false),
      ]);
      setAuditTrail(auditData);
      setIntegrity(integrityData);
    } catch (err: any) {
      console.error('Failed to load audit or integrity data', err);
      setError(err?.detail || err?.message || 'Failed to load audit trail and integrity seal.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySeal = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyIntegrity(caseItem.id, false);
      setIntegrity(res);
    } catch (err: any) {
      console.error('Failed to verify integrity seal', err);
      setError(err?.detail || err?.message || 'Verification check failed.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [caseItem.id]);

  const events = auditTrail?.events || [];
  const uniqueActions = Array.from(new Set(events.map((e) => e.action))).sort();

  const filteredEvents = actionFilter === 'all'
    ? events
    : events.filter((e) => e.action === actionFilter);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'case_created':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'record_added':
      case 'party_added':
      case 'crosswalk_added':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'case_updated':
      case 'record_updated':
      case 'crosswalk_updated':
      case 'checklist_updated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'record_deleted':
      case 'crosswalk_deleted':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'record_archived':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'analysis_executed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'report_generated':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'integrity_verified':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      return formatDhakaDateTime(iso, lang, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('audit_title', lang)}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('audit_header_desc', lang)}{' '}
            <span className="font-semibold text-slate-700">{caseItem.case_code}</span>
          </p>
        </div>
        <button
          onClick={handleVerifySeal}
          disabled={verifying || loading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
        >
          {verifying ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Verifying live seal...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{t('verify_live_seal', lang)}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Input fingerprint card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              integrity?.is_valid
                ? 'bg-emerald-100 text-emerald-700'
                : integrity?.is_sealed
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-900">{t('crypto_seal_title', lang)}</span>
                {integrity?.is_valid ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {t('seal_intact', lang)}
                  </span>
                ) : integrity?.is_sealed ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {t('seal_mismatch', lang)}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {t('unsealed', lang)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {integrity?.explanation || t('awaiting_integrity', lang)}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {integrity?.checked_at ? formatTimestamp(integrity.checked_at) : ''}
          </span>
        </div>

        <div className="p-5 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500 block mb-1">
              {t('sealed_hash', lang)}
            </span>
            <span className="font-mono text-xs text-slate-800 break-all select-all font-semibold block bg-slate-50 p-2 rounded border border-slate-100">
              {integrity?.sealed_hash || t('no_seal_yet', lang)}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500 block mb-1">
              {t('current_hash', lang)}
            </span>
            <span className={`font-mono text-xs break-all select-all font-semibold block p-2 rounded border ${
              integrity?.is_valid
                ? 'bg-emerald-50/50 text-emerald-900 border-emerald-100'
                : 'bg-rose-50/50 text-rose-900 border-rose-100'
            }`}>
              {integrity?.current_hash || t('calculating_hash', lang)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">{t('checked_components', lang)}:</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">source_records</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">parties</span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">plot_crosswalks</span>
          </div>
          <div className="text-slate-400 text-right">
            {t('sha256_digest_label', lang)}
          </div>
        </div>

        {/* Non-judicial disclaimer */}
        <div className="p-3 bg-amber-50/70 border-t border-amber-100 text-amber-900 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong className="font-semibold">{t('non_judicial_notice', lang)}:</strong> {integrity?.disclaimer || 'Integrity verification evaluates SHA-256 digests of entered case metadata. It validates internal data consistency against the sealed analysis run and does not constitute official legal title adjudication, warranty of title, or a replacement for certified physical records.'}
          </span>
        </div>
      </div>

      {/* Audit Trail Activity Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('audit_ledger_title', lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('audit_identity_notice', lang)} ({events.length} {t('total_events', lang)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="action-filter" className="text-xs font-medium text-slate-600">
              {t('filter_by_action', lang)}:
            </label>
            <select
              id="action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="all">{t('all_actions', lang)} ({events.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act} ({events.filter((e) => e.action === act).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <svg className="animate-spin h-6 w-6 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading audit events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit events found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-44">{t('timezone_dhaka', lang)}</th>
                  <th className="py-3 px-4 w-40">{t('action', lang)}</th>
                  <th className="py-3 px-4 w-32">{t('actor', lang)}</th>
                  <th className="py-3 px-4">{t('run_id_label', lang)}</th>
                  <th className="py-3 px-4">{t('rule_version', lang)}</th>
                  <th className="py-3 px-4">{t('result', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatTimestamp(event.created_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(event.action)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
              {event.actor === 'local_unverified_session' || event.actor === 'reviewer' || event.actor === 'local_user'
                ? t('audit_local_unverified', lang)
                : event.actor}
                    </td>
                    <td className="py-3 px-4 font-mono">{event.details_json?.run_id || '—'}</td>
                    <td className="py-3 px-4 font-mono">{event.details_json?.rule_version || '—'}</td>
                    <td className="py-3 px-4">{event.details_json?.result || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
