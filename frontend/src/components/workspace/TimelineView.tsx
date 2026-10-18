import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { TimelineNode, TimelineResponse } from '../../types';
import { t, formatDigits, localizeAreaValue, type Language } from '../../locales';

interface TimelineViewProps {
  caseId: string;
  onInspectRecord: (recordId: string) => void;
  lang: Language;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ caseId, onInspectRecord, lang }) => {
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [caseId]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTimeline(caseId);
      setTimeline(data);
    } catch (err: unknown) {
      setError('Failed to load ownership timeline.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-muted font-mono animate-pulse">
        {lang === 'bn' ? 'কালানুক্রমিক মালিকানা গ্রাফ তৈরি হচ্ছে...' : 'Constructing chronological ownership graph...'}
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="p-4 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
        {error || (lang === 'bn' ? 'সময়রেখা দেখানো সম্ভব হয়নি।' : 'Unable to render timeline.')}
      </div>
    );
  }

  const nodes = timeline.nodes || [];

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="p-3 border border-slate-subtle bg-bone text-xs text-slate-muted rounded-sm flex items-center justify-between">
        <span>
          <strong className="text-slate-deep">{t('timeline_notice_title', lang)}</strong>{' '}
          {t('timeline_notice_desc', lang)}
        </span>
        <span className="font-mono text-[11px] text-teal-brand font-bold shrink-0 ml-2">
          {formatDigits(nodes.length, lang)} {lang === 'bn' ? 'ইভেন্ট রেকর্ডকৃত' : 'Events Recorded'}
        </span>
      </div>

      {nodes.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-border rounded-sm bg-white text-xs text-slate-muted">
          {lang === 'bn'
            ? 'এই কেসে কোনো হস্তান্তর ইভেন্ট পাওয়া যায়নি। কালানুক্রমিক সময়রেখা তৈরি করতে দলিল বা নামজারি রেকর্ড যোগ করুন।'
            : 'No transfer events found for this case. Add deed or mutation records to generate the chronological timeline.'}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-border">
          {nodes.map((node: TimelineNode, idx: number) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold font-mono transition-transform group-hover:scale-110 ${
                  node.interruption_marker
                    ? 'border-burgundy-marker bg-burgundy-surface text-burgundy-text'
                    : node.potential_overlap
                    ? 'border-amber-marker bg-amber-surface text-amber-text'
                    : 'border-teal-brand bg-white text-teal-brand'
                }`}
              >
                {idx + 1}
              </div>

              {/* Chain Gap Interruption Banner */}
              {node.interruption_marker && (
                <div className="mb-2 p-2 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-burgundy-marker text-sm">&Delta;</span>
                    <span className="font-bold">
                      {lang === 'bn' ? 'শৃঙ্খল বিচ্ছিন্নতা:' : 'Chain Gap Interruption:'}
                    </span>
                    <span>
                      {node.interruption_label ||
                        (lang === 'bn'
                          ? 'বিক্রেতা পক্ষ পূর্ববর্তী নিশ্চিত মালিকের সাথে সংযুক্ত নয়।'
                          : 'Seller party does not link to prior confirmed owner.')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold text-burgundy-marker">JT-R03</span>
                </div>
              )}

              {/* Potential Overlap Banner */}
              {node.potential_overlap && (
                <div className="mb-2 p-2 border border-amber-border bg-amber-surface text-amber-text text-xs rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-marker text-sm">&Delta;</span>
                    <span className="font-bold">
                      {lang === 'bn' ? 'সম্ভাব্য পরস্পরবিরোধী হস্তান্তর:' : 'Potential Competing Transfer:'}
                    </span>
                    <span>
                      {lang === 'bn'
                        ? 'একই জোতের ওভারল্যাপিং হস্তান্তর শনাক্ত হয়েছে।'
                        : 'Overlapping transfer of the same holding detected.'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-marker">JT-R04</span>
                </div>
              )}

              {/* Node Card */}
              <div className="border border-slate-border bg-white rounded-sm p-4 shadow-2xs hover:border-slate-deep transition-colors space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-charcoal">
                      {node.date_display}
                    </span>
                    <span className="font-mono uppercase text-[10px] font-bold px-1.5 py-0.5 rounded-xs border border-slate-subtle bg-bone text-slate-deep">
                      {node.transfer_type}
                    </span>
                    {node.plot_reference && (
                      <span className="font-mono text-xs text-teal-brand font-semibold">
                        Plot: {node.plot_reference}
                      </span>
                    )}
                  </div>

                  {node.source_reference && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-deep bg-slate-subtle px-2 py-0.5 rounded-xs">
                        {node.source_reference}
                      </span>
                      {node.source_record_id && (
                        <button
                          onClick={() => onInspectRecord(node.source_record_id!)}
                          className="text-xs text-teal-brand hover:underline font-medium cursor-pointer"
                        >
                          {t('inspect_record_btn', lang)} &rarr;
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Transfer Parties Flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-2.5 bg-bone-light border border-slate-subtle rounded-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-muted block">
                      {lang === 'bn' ? 'বিক্রেতা / হস্তান্তরকারী' : 'From (Seller / Transferor)'}
                    </span>
                    <div className="font-semibold text-slate-charcoal text-xs">
                      {node.from_party_label || (lang === 'bn' ? 'পক্ষ নির্ধারিত হয়নি' : 'Unassigned party')}
                    </div>
                  </div>

                  <div className="p-2.5 bg-bone-light border border-slate-subtle rounded-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-muted block">
                      {lang === 'bn' ? 'ক্রেতা / গ্রহণকারী' : 'To (Purchaser / Transferee)'}
                    </span>
                    <div className="font-semibold text-slate-charcoal text-xs">
                      {node.to_party_label || (lang === 'bn' ? 'পক্ষ নির্ধারিত হয়নি' : 'Unassigned party')}
                    </div>
                  </div>
                </div>

                {/* Conveyed Area & Findings */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div>
                    {node.area_display && (
                      <span className="font-mono text-slate-deep">
                        <strong className="text-slate-muted font-sans font-normal">
                          {lang === 'bn' ? 'হস্তান্তরিত জমির পরিমাণ:' : 'Conveyed Area:'}
                        </strong>{' '}
                        {localizeAreaValue(node.area_display, lang)}
                      </span>
                    )}
                  </div>

                  {node.associated_findings && node.associated_findings.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-muted font-medium">{t('node_findings', lang)}</span>
                      {node.associated_findings.map((af, i) => (
                        <span
                          key={i}
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded-xs border font-bold ${
                            af.status === 'conflict_detected'
                              ? 'border-burgundy-border bg-burgundy-surface text-burgundy-text'
                              : 'border-amber-border bg-amber-surface text-amber-text'
                          }`}
                        >
                          {af.rule_code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unlinked baseline records */}
      {timeline.unlinked_records && timeline.unlinked_records.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-subtle space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted">
            {t('baseline_records', lang)}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {timeline.unlinked_records.map((r) => (
              <div
                key={r.id}
                onClick={() => onInspectRecord(r.id)}
                className="p-2.5 border border-slate-border bg-white rounded-xs hover:border-teal-brand cursor-pointer transition-colors text-xs space-y-1"
              >
                <div className="font-semibold text-slate-charcoal flex justify-between">
                  <span>{r.source_reference}</span>
                  <span className="font-mono text-[10px] text-slate-muted uppercase">{r.record_type}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-deep">
                  {r.survey_series} Dag {r.dag_no || '—'} {r.area ? `• ${r.area}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
