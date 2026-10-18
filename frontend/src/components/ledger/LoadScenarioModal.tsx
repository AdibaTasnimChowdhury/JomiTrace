import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { api, ApiError } from '../../api/client';
import type { ScenarioInfo, VerificationCase } from '../../types';
import { t, localizeCaseTitle, localizeScenarioText, type Language } from '../../locales';

interface LoadScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioLoaded: (caseObj: VerificationCase) => void;
  lang?: Language;
}

export const LoadScenarioModal: React.FC<LoadScenarioModalProps> = ({
  isOpen,
  onClose,
  onScenarioLoaded,
  lang = 'en',
}) => {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadScenarioList();
    }
  }, [isOpen]);

  const loadScenarioList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listScenarios();
      setScenarios(data.scenarios);
    } catch (err: unknown) {
      setError(lang === 'bn' ? 'ব্যাকএন্ড থেকে ডেমো সিনারিও লোড করতে সমস্যা হয়েছে।' : 'Failed to fetch demonstration scenarios from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = async (id: string) => {
    setLoadingScenarioId(id);
    setError(null);
    try {
      const loadedCase = await api.loadScenario(id, true);
      onScenarioLoaded(loadedCase);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(lang === 'bn' ? `সিনারিও ${id} লোড করতে সমস্যা হয়েছে।` : `Failed to load scenario ${id}.`);
      }
    } finally {
      setLoadingScenarioId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'bn' ? 'ডেমো সিনারিও লোড করুন (S1–S8)' : 'Load Demonstration Scenario (S1–S8)'}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3 border border-slate-subtle bg-bone text-xs text-slate-deep rounded-sm leading-relaxed">
          <span className="font-semibold text-teal-brand uppercase tracking-wider text-[10px] block mb-1">
            {t('fictional_benchmarks', lang)}
          </span>
          {lang === 'bn'
            ? '৮টি মানদণ্ড সিনারিওর মধ্যে একটি নির্বাচন করুন — কাল্পনিক দলিল, খতিয়ান ও নামজারিসহ পূর্বনির্ধারিত যাচাই চেকসহ লোড হবে।'
            : 'Select one of the 8 canonical land-record scenarios to load synthetic deeds, khatians, mutations, and pre-run deterministic screening checks.'}
        </div>

        {error && (
          <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-muted">
            {lang === 'bn' ? 'সিনারিও তালিকা লোড হচ্ছে...' : 'Loading scenarios...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="border border-slate-border bg-white p-3.5 rounded-sm flex flex-col justify-between hover:border-teal-brand transition-colors text-xs space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-teal-brand bg-teal-subtle px-1.5 py-0.5 rounded-xs">
                      {s.id} • {s.case_code}
                    </span>
                    <span className="text-[11px] text-slate-muted">
                      {s.upazila}, {s.district}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-charcoal text-xs">{localizeCaseTitle(s.title, lang)}</h4>
                  <p className="text-[11px] text-slate-muted mt-1 leading-normal">{localizeScenarioText(s.id, 'description', s.description, lang)}</p>
                </div>

                <div className="pt-2 border-t border-slate-subtle flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-deep truncate" title={s.expected_outcome}>
                    <span className="font-semibold text-slate-muted">
                      {lang === 'bn' ? 'প্রত্যাশিত ফলাফল:' : 'Expected:'}
                    </span>{' '}
                    {localizeScenarioText(s.id, 'expected_outcome', s.expected_outcome, lang)}
                  </div>
                  <button
                    onClick={() => handleSelectScenario(s.id)}
                    disabled={loadingScenarioId !== null}
                    className="px-2.5 py-1 bg-teal-brand text-white text-[11px] font-medium rounded-sm hover:bg-teal-hover transition-colors shrink-0 disabled:opacity-50"
                  >
                    {loadingScenarioId === s.id
                      ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
                      : t('load_scenario', lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
          >
            {t('close', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
};
