import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  service: string;
  version: string;
  rule_version: string;
  timestamp: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthStatus = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown connection error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-bone text-slate-charcoal flex flex-col font-sans selection:bg-teal-subtle selection:text-teal-brand">
      {/* Top Banner: Synthetic Data Safeguard Notice */}
      <div className="bg-bone-muted border-b border-slate-subtle px-4 py-1.5 text-xs text-slate-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide uppercase text-[10px] text-slate-muted px-1.5 py-0.5 border border-slate-border rounded-sm bg-bone">
            Notice
          </span>
          <span>Fictional sample data for demonstration • LandTech 2026 track P3 &amp; P5</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]">Rule catalog v{health?.rule_version ?? '0.2'}</span>
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-2 py-0.5 border border-slate-border text-xs rounded-sm hover:bg-bone text-slate-charcoal font-medium transition-colors"
          >
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-border bg-bone px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-charcoal m-0">
            JomiTrace
          </h1>
          <span className="text-xs text-slate-muted font-normal">
            Explainable land-record verification and risk screening
          </span>
        </div>

        {/* Backend Connectivity Status Badge */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 border border-slate-border bg-white px-2.5 py-1 rounded-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                loading
                  ? 'bg-amber-marker animate-pulse'
                  : health?.status === 'healthy'
                  ? 'bg-emerald-600'
                  : 'bg-burgundy-marker'
              }`}
            />
            <span className="font-mono text-[11px]">
              {loading
                ? 'Connecting to backend...'
                : health?.status === 'healthy'
                ? `API healthy (${health.service} v${health.version})`
                : 'API offline'}
            </span>
            <button
              onClick={checkHealth}
              title="Refresh connection"
              className="text-slate-muted hover:text-slate-charcoal ml-1 underline text-[11px]"
            >
              Verify
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Navigation */}
      <nav className="border-b border-slate-subtle bg-bone px-6 flex gap-6 text-sm">
        <button className="py-2.5 border-b-2 border-teal-brand text-teal-brand font-medium">
          Ledger
        </button>
        <button className="py-2.5 border-b-2 border-transparent text-slate-muted hover:text-slate-charcoal">
          Verification cases
        </button>
        <button className="py-2.5 border-b-2 border-transparent text-slate-muted hover:text-slate-charcoal">
          Reports
        </button>
        <button className="py-2.5 border-b-2 border-transparent text-slate-muted hover:text-slate-charcoal">
          Rules &amp; limitations
        </button>
      </nav>

      {/* Main Investigation Split-Pane Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Phase 1 Verification Notice */}
        {error && (
          <div className="border border-burgundy-border bg-burgundy-surface text-burgundy-text p-4 rounded-sm text-sm">
            <p className="font-semibold">Backend connection failed</p>
            <p className="text-xs mt-1 font-mono">{error}</p>
            <p className="text-xs mt-2 text-slate-muted">
              Ensure the FastAPI backend is running locally on port 8000: <code className="font-mono">uvicorn app.main:app --port 8000</code>
            </p>
          </div>
        )}

        {/* Split Ledger: Dense layout per APP_FLOW.md */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Narrow Left Column: Operational Status Queue */}
          <aside className="col-span-12 lg:col-span-3 flex flex-col gap-3">
            <div className="border border-slate-border bg-white p-4 rounded-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-3">
                Operational status
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
                  <span>Conflict detected</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-amber-border bg-amber-surface text-amber-text text-xs rounded-sm">
                  <span>Review required</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-slate-border bg-slate-subtle text-slate-muted text-xs rounded-sm">
                  <span>Insufficient source data</span>
                  <span className="font-mono font-bold">0</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-border bg-white p-4 rounded-sm text-xs text-slate-muted space-y-2">
              <div className="font-semibold text-slate-charcoal">Phase 1: Foundation ready</div>
              <p>
                Frontend shell and FastAPI backend operational. Zero fabricated records. Deterministic rule evaluation activates in Phase 2.
              </p>
            </div>
          </aside>

          {/* Wide Right Pane: Case Ledger Shell */}
          <section className="col-span-12 lg:col-span-9 border border-slate-border bg-white rounded-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-subtle px-4 py-3 flex items-center justify-between bg-bone-light">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-charcoal m-0">
                  Case investigation ledger
                </h2>
                <span className="text-xs text-slate-muted">(0 cases recorded)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm opacity-50 cursor-not-allowed"
                >
                  Create case
                </button>
              </div>
            </div>

            {/* Dense Ledger Table Placeholder */}
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <p className="text-sm font-medium text-slate-charcoal">
                  No investigation cases recorded
                </p>
                <p className="text-xs text-slate-muted leading-relaxed">
                  Phase 1 establishes the verified project foundation, design system tokens, typography, and live backend connectivity.
                </p>
                {health && (
                  <div className="mt-4 inline-block text-left border border-slate-subtle bg-bone p-3 rounded-sm font-mono text-xs text-slate-deep">
                    <div>Status: <span className="text-emerald-700 font-semibold">{health.status}</span></div>
                    <div>Service: {health.service}</div>
                    <div>Rule version: {health.rule_version}</div>
                    <div>Heartbeat: {health.timestamp}</div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-border bg-bone px-6 py-3 text-xs text-slate-muted flex items-center justify-between">
        <div>
          JomiTrace • LandTech 2026 Hackathon Foundation
        </div>
        <div className="flex gap-4">
          <span>Evidence-first verification</span>
          <span>Deterministic rules</span>
          <span>No unverified verdicts</span>
        </div>
      </footer>
    </div>
  );
}
