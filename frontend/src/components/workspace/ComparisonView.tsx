import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ComparisonResponse, ComparisonRow } from '../../types';
import { t, formatDigits, localizeComparisonField, localizeRecordType, localizeComparisonValue, localizeComparisonDetails, type Language } from '../../locales';

interface ComparisonViewProps {
  caseId: string;
  onInspectRecord: (recordId: string) => void;
  lang: Language;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ caseId, onInspectRecord, lang }) => {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [caseId]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getComparison(caseId);
      setData(res);
    } catch (err: unknown) {
      setError(t('error_comparison', lang));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-muted font-mono animate-pulse">
        {t('loading_comparison', lang)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
        {error || t('error_comparison', lang)}
      </div>
    );
  }

  const { records, rows } = data;

  if (records.length < 2) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-border rounded-sm bg-bone-light text-xs text-slate-muted">
        {t('comparison_min_records', lang)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="p-3 border border-slate-subtle bg-bone text-xs text-slate-muted rounded-sm flex items-center justify-between">
        <span>
          <strong className="text-slate-deep">{t('comparison_matrix_label', lang)}</strong>{' '}
          {t('comparison_matrix_desc', lang)}
        </span>
        <span className="font-mono text-[11px] text-teal-brand font-bold shrink-0 ml-2">
          {formatDigits(records.length, lang)} {t('documents_compared', lang)}
        </span>
      </div>

      {/* Grid Table */}
      <div aria-label={lang === 'bn' ? 'তুলনামূলক নথির সারণি' : 'Record comparison table'}>
        <div className="sm:hidden space-y-3">
          {rows.map((row, rowIdx) => (
            <section key={rowIdx} className={`border rounded-lg p-3 space-y-2 ${row.has_conflict ? 'border-burgundy-border bg-burgundy-surface/30' : row.status === 'mismatch' ? 'border-amber-border bg-amber-surface/30' : 'border-slate-subtle bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-deep text-xs m-0">{localizeComparisonField(row.field_label, lang)}</h4>
                {row.status === 'over_conveyance' ? <span className="whitespace-nowrap rounded border border-burgundy-border bg-burgundy-surface px-1.5 py-0.5 text-[10px] font-bold text-burgundy-text">Over-conveyance (JT-R05)</span> : row.has_conflict ? <span className="text-[10px] font-bold text-burgundy-text">{t('conflict_detected', lang)}</span> : row.status === 'mismatch' ? <span className="text-[10px] font-bold text-amber-text">{t('review_required', lang)}</span> : row.status === 'unverified' ? <span className="text-[10px] font-bold text-slate-muted">Sequence</span> : null}
              </div>
              {row.details && <p className="text-[10px] text-slate-muted m-0">{localizeComparisonDetails(row.details, lang)}</p>}
              <dl className="divide-y divide-slate-subtle m-0">
                {records.map((record, cellIdx) => (
                  <div key={record.id} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold text-slate-charcoal break-words">{record.source_reference}</dt>
                      <dd className="text-[10px] text-slate-muted m-0">{localizeRecordType(record.record_type, lang)} · {record.survey_series}</dd>
                    </div>
                    <div className={`text-right text-xs font-mono break-all ${row.has_conflict ? 'font-bold text-burgundy-text' : 'text-slate-deep'}`}>
                      {localizeComparisonValue(row.cells[cellIdx]?.value ?? '', lang) || '—'}
                      <button onClick={() => onInspectRecord(record.id)} className="block ml-auto mt-1 text-[10px] text-teal-brand underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand">{t('inspect_record_btn', lang)}</button>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="hidden sm:block border border-slate-border rounded-lg overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs min-w-[640px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-border bg-bone text-slate-charcoal">
              <th className="sticky left-0 z-20 py-3 px-4 w-48 font-bold uppercase tracking-wider text-[11px] text-slate-muted border-r border-slate-subtle bg-bone">
                {t('compared_field', lang)}
              </th>
              {records.map((rec) => (
                <th key={rec.id} className="py-3 px-4 font-semibold border-r border-slate-subtle last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-charcoal">{rec.source_reference}</span>
                    <button
                      onClick={() => onInspectRecord(rec.id)}
                      className="text-[11px] text-teal-brand hover:underline font-normal cursor-pointer"
                    >
                      {t('inspect_record_btn', lang)}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-muted uppercase font-normal mt-0.5">
                    {localizeRecordType(rec.record_type, lang)} ({rec.survey_series})
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-subtle">
            {rows.map((row: ComparisonRow, rowIdx: number) => (
              <tr
                key={rowIdx}
                className={`transition-colors ${
                  row.has_conflict
                    ? 'bg-burgundy-surface/30 hover:bg-burgundy-surface/50'
                    : row.status === 'mismatch'
                    ? 'bg-amber-surface/20 hover:bg-amber-surface/40'
                    : 'hover:bg-bone/40'
                }`}
              >
                {/* Field Label */}
                <td className="sticky left-0 z-[1] py-2.5 px-4 font-medium text-slate-deep border-r border-slate-subtle bg-bone-light/95">
                  <div className="flex items-center justify-between">
                    <span>{localizeComparisonField(row.field_label, lang)}</span>
                    {row.status === 'over_conveyance' ? (
                      <span className="whitespace-nowrap font-mono font-bold text-[9px] text-burgundy-text uppercase px-1.5 py-0.5 border border-burgundy-border bg-burgundy-surface rounded-xs">
                        Over-conveyance (JT-R05)
                      </span>
                    ) : row.has_conflict ? (
                      <span className="font-mono font-bold text-[9px] text-burgundy-marker uppercase px-1 border border-burgundy-border bg-burgundy-surface rounded-xs">
                        {t('conflict_detected', lang)}
                      </span>
                    ) : row.status === 'mismatch' ? (
                      <span className="font-mono font-bold text-[9px] text-amber-text uppercase px-1 border border-amber-border bg-amber-surface rounded-xs">
                        {t('review_required', lang)}
                      </span>
                    ) : row.status === 'unverified' ? (
                      <span className="font-mono font-bold text-[9px] text-slate-muted uppercase px-1 border border-slate-border bg-white rounded-xs">
                        Sequence
                      </span>
                    ) : null}
                  </div>
                    {row.details && (
                    <div className="text-[10px] text-slate-muted mt-0.5 font-normal leading-tight">
                      {localizeComparisonDetails(row.details ?? "", lang)}
                    </div>
                  )}
                </td>

                {/* Values per Record */}
                {row.cells.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`py-2.5 px-4 font-mono text-xs border-r border-slate-subtle last:border-r-0 ${
                      row.has_conflict
                        ? 'font-bold text-burgundy-text'
                        : 'text-slate-deep'
                    }`}
                  >
                    {localizeComparisonValue(cell.value ?? "", lang) || <span className="text-slate-muted font-normal italic">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
