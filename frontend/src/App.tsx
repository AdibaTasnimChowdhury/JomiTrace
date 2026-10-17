import { useEffect, useState } from 'react';
import { api } from './api/client';
import type { HealthStatus, VerificationCase } from './types';
import { CaseLedger } from './components/ledger/CaseLedger';
import { CaseWorkspace } from './components/workspace/CaseWorkspace';
import { RulesCatalogView } from './components/rules/RulesCatalogView';
import { GuidedTour, isTourDismissed } from './components/common/GuidedTour';
import { t, type Language } from './locales';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState<'ledger' | 'workspace' | 'rules'>('ledger');
  const [selectedCase, setSelectedCase] = useState<VerificationCase | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    try {
      return localStorage.getItem('jomitrace_language') === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });
  const [tourOpen, setTourOpen] = useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      setHealthError('Backend connection offline');
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Auto-show tour on first visit (when not previously dismissed)
  useEffect(() => {
    if (!isTourDismissed()) {
      setTourOpen(true);
    }
  }, []);

  const handleSelectCase = (caseObj: VerificationCase) => {
    setSelectedCase(caseObj);
    setActiveNav('workspace');
  };

  return (
    <div className="min-h-screen bg-bone-dark text-slate-charcoal flex flex-col font-sans selection:bg-teal-subtle selection:text-teal-brand">
      {/* Guided Tour overlay */}
      <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} lang={lang} />

      {/* Top Banner: Synthetic Data Safeguard Notice */}
      <div className="bg-slate-charcoal/95 border-b border-slate-charcoal px-4 sm:px-6 py-2 text-xs text-white/80 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-amber-marker flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-[11px] sm:text-xs">{t('notice_synthetic', lang)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-white/60">{t('rule_catalog_label', lang)} v{health?.rule_version ?? '0.2'}</span>
          <button
            onClick={() => {
              const nextLanguage = lang === 'en' ? 'bn' : 'en';
              setLang(nextLanguage);
              try { localStorage.setItem('jomitrace_language', nextLanguage); } catch { /* storage is optional */ }
            }}
            aria-label={lang === 'en' ? 'Switch language to Bangla' : 'Switch language to English'}
            className="px-2.5 py-1 border border-white/30 text-xs rounded-md hover:bg-white/10 text-white font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </button>
        </div>
      </div>

      {/* Main Header — white background for strong contrast */}
      <header className="border-b border-slate-border bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-4">
          {/* Logo / Brand mark */}
          <div
            onClick={() => setActiveNav('ledger')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-teal-brand rounded-sm flex items-center justify-center text-white font-bold text-sm select-none">
              J
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-charcoal m-0 group-hover:text-teal-brand transition-colors leading-tight">
                {t('app_title', lang)}
              </h1>
              <span className="text-[10px] text-slate-muted font-normal leading-none hidden sm:block">
                {t('app_subtitle', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Help button + API status */}
        <div className="flex flex-wrap items-center gap-2 text-xs max-sm:w-full max-sm:justify-between">
          <button
            onClick={() => setTourOpen(true)}
            className="px-3 py-1.5 border border-teal-brand text-teal-brand text-[11px] font-semibold rounded-sm hover:bg-teal-subtle transition-colors cursor-pointer flex items-center gap-1.5"
            title={t('help_tour', lang)}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('take_tour', lang)}
          </button>

          {(healthError || loadingHealth || health?.status !== 'healthy') && <div className="flex items-center gap-2 border border-slate-border bg-slate-50 px-2.5 py-1.5 rounded-sm">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                loadingHealth
                  ? 'bg-amber-marker animate-pulse'
                  : health?.status === 'healthy'
                  ? 'bg-emerald-500'
                  : 'bg-burgundy-marker'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-deep">
              {loadingHealth
                ? t('connecting_backend', lang)
                : health?.status === 'healthy'
                ? `${t('api_healthy_detail', lang)} (${health.service} v${health.version})`
                : t('api_offline_detail', lang)}
            </span>
            <button
              onClick={checkHealth}
              title={t('refresh_connection', lang)}
              className="text-slate-muted hover:text-teal-brand ml-1 underline text-[11px] cursor-pointer"
            >
              {t('refresh_connection', lang)}
            </button>
          </div>}
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav aria-label={lang === 'bn' ? 'প্রধান নেভিগেশন' : 'Primary navigation'} className="border-b border-slate-subtle bg-white px-2 sm:px-6 flex gap-1 text-xs sm:text-sm font-medium overflow-x-auto whitespace-nowrap">
        <button
          data-tour="ledger-overview"
          onClick={() => setActiveNav('ledger')}
          className={`py-3 px-3 sm:px-4 border-b-2 rounded-t-md transition-colors cursor-pointer ${
            activeNav === 'ledger'
              ? 'border-teal-brand text-teal-brand font-bold bg-teal-subtle/30'
              : 'border-transparent text-slate-muted hover:text-slate-charcoal hover:bg-slate-50'
          }`}
        >
          {t('ledger_tab', lang)}
        </button>

        <button
          onClick={() => {
            if (selectedCase) setActiveNav('workspace');
          }}
          disabled={!selectedCase}
          className={`py-3 px-3 sm:px-4 border-b-2 rounded-t-md transition-colors ${
            !selectedCase
              ? 'border-transparent text-slate-border cursor-not-allowed'
              : activeNav === 'workspace'
              ? 'border-teal-brand text-teal-brand font-bold bg-teal-subtle/30 cursor-pointer'
              : 'border-transparent text-slate-muted hover:text-slate-charcoal hover:bg-slate-50 cursor-pointer'
          }`}
        >
          {t('workspace_tab', lang)} {selectedCase ? `(${selectedCase.case_code})` : ''}
        </button>

        <button
          onClick={() => setActiveNav('rules')}
          className={`py-3 px-3 sm:px-4 border-b-2 rounded-t-md transition-colors cursor-pointer ${
            activeNav === 'rules'
              ? 'border-teal-brand text-teal-brand font-bold bg-teal-subtle/30'
              : 'border-transparent text-slate-muted hover:text-slate-charcoal hover:bg-slate-50'
          }`}
        >
          {t('rules_tab', lang)}
        </button>
      </nav>

      {/* Main Investigation Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {healthError && (
          <div className="border border-burgundy-border bg-burgundy-surface text-burgundy-text p-4 rounded-sm text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold">{t('backend_error_title', lang)}</p>
              <p className="text-[11px] mt-0.5">
                {t('backend_error_desc', lang)}
                <code className="font-mono bg-white/70 px-1 py-0.5 rounded-xs ml-1">
                  uvicorn app.main:app --port 8000
                </code>
              </p>
            </div>
            <button
              onClick={checkHealth}
              className="px-3 py-1 bg-burgundy-marker text-white text-xs rounded-sm hover:bg-red-800"
            >
              {t('retry', lang)}
            </button>
          </div>
        )}

        {/* View Switching */}
        {activeNav === 'ledger' && (
          <CaseLedger onSelectCase={handleSelectCase} lang={lang} />
        )}

        {activeNav === 'workspace' && selectedCase && (
          <CaseWorkspace
            initialCase={selectedCase}
            onBackToLedger={() => setActiveNav('ledger')}
            lang={lang}
          />
        )}

        {activeNav === 'rules' && <RulesCatalogView lang={lang} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-border bg-white px-4 sm:px-6 py-7 text-xs text-slate-muted">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr] gap-6 lg:gap-10">
          <div className="space-y-1.5">
            <div className="font-bold text-slate-deep text-sm">{t('footer_tagline', lang)}</div>
            <div className="font-semibold text-slate-charcoal">{t('footer_team', lang)}</div>
            <div className="text-[11px]">{t('footer_event', lang)}</div>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed m-0">{t('footer_disclaimer', lang)}</p>
            <div className="flex flex-wrap gap-1.5">
              {t('footer_principles', lang).split(' · ').map((p, i) => (
                <span key={i} className="px-2 py-1 border border-slate-subtle rounded-full bg-bone text-[10px] text-slate-deep">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
