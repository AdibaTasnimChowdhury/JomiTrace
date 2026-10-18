import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { RuleCatalogResponse } from '../../types';
import { type Language } from '../../locales';

interface RulesCatalogViewProps {
  lang: Language;
}

export const RulesCatalogView: React.FC<RulesCatalogViewProps> = () => {
  const [catalog, setCatalog] = useState<RuleCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRules();
      setCatalog(data);
    } catch (err: unknown) {
      setError('Failed to fetch rule catalog from backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-muted font-mono animate-pulse">
        Loading deterministic rule catalog and explainability criteria...
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="p-4 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
        {error || 'Unable to load rules catalog.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Policy & Ethics Header */}
      <div className="border border-slate-border bg-white p-6 rounded-sm shadow-xs space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-brand">
              Screening approach
            </div>
            <h2 className="text-base font-bold text-slate-charcoal m-0 mt-0.5">
              JomiTrace Deterministic Rule Catalog (v{catalog.rule_version})
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-deep bg-slate-subtle px-2.5 py-1 rounded-xs">
            10 Modular Rules Active
          </span>
        </div>

        <p className="text-xs text-slate-deep leading-relaxed">
          {catalog.vocabulary_rules?.screening_policy ||
            'Deterministic screening prototype. It shows evidence-backed discrepancies for human review and does not determine intent, criminal wrongdoing, or legal ownership.'}
        </p>

        {/* Configuration Defaults */}
        <div className="pt-3 border-t border-slate-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-bone rounded-xs">
            <span className="text-[10px] font-bold uppercase text-slate-muted block">Area Tolerance</span>
            <span className="font-mono font-bold text-slate-charcoal">
              {catalog.config_defaults.area_tolerance_pct ?? 1.0}% allowable margin
            </span>
          </div>
          <div className="p-2.5 bg-bone rounded-xs">
            <span className="text-[10px] font-bold uppercase text-slate-muted block">Rapid Transfer Window</span>
            <span className="font-mono font-bold text-slate-charcoal">
              {catalog.config_defaults.rapid_transfer_days ?? 30} days re-sale monitor
            </span>
          </div>
          <div className="p-2.5 bg-bone rounded-xs">
            <span className="text-[10px] font-bold uppercase text-slate-muted block">Mutation Reference Period</span>
            <span className="font-mono font-bold text-slate-charcoal">
              {catalog.config_defaults.mutation_reference_days ?? 45} days (non-legal interval)
            </span>
          </div>
        </div>
      </div>

      {/* Exact Area Factors Table */}
      <div className="border border-slate-border bg-white p-5 rounded-sm shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted m-0">
          Standard Land Area Conversion Factors (Square Feet)
        </h3>
        <p className="text-[11px] text-slate-muted">
          All areas are normalized strictly to square feet for mathematical pairwise comparison.
          Regional units (Katha, Bigha, Kani) require explicit reviewer basis entry.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs font-mono">
          <div className="p-2 border border-slate-subtle bg-bone-light rounded-xs">
            <span className="text-[10px] text-slate-muted uppercase block">1 Decimal (শতাংশ)</span>
            <span className="font-bold text-slate-deep">435.6 sq ft</span>
          </div>
          <div className="p-2 border border-slate-subtle bg-bone-light rounded-xs">
            <span className="text-[10px] text-slate-muted uppercase block">1 Acre (একর)</span>
            <span className="font-bold text-slate-deep">43,560 sq ft</span>
          </div>
          <div className="p-2 border border-slate-subtle bg-bone-light rounded-xs">
            <span className="text-[10px] text-slate-muted uppercase block">1 Sq Meter</span>
            <span className="font-bold text-slate-deep">10.7639 sq ft</span>
          </div>
          <div className="p-2 border border-slate-subtle bg-bone-light rounded-xs">
            <span className="text-[10px] text-slate-muted uppercase block">1 Hectare</span>
            <span className="font-bold text-slate-deep">107,639.1 sq ft</span>
          </div>
          <div className="p-2 border border-amber-border bg-amber-surface/40 rounded-xs">
            <span className="text-[10px] text-amber-text uppercase block">Regional Basis</span>
            <span className="font-bold text-amber-text">Case-specific</span>
          </div>
        </div>
      </div>

      {/* Rules Catalog Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-muted m-0">
          Rule Verification Criteria &amp; Failure Modes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.rules.map((rule) => (
            <div
              key={rule.code}
              className="border border-slate-border bg-white rounded-sm p-4 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-subtle pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-subtle text-slate-charcoal px-2 py-0.5 rounded-xs">
                      {rule.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-charcoal m-0">{rule.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-muted">
                    {rule.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-deep leading-relaxed mb-3">
                  {rule.logic}
                </p>

                <div className="space-y-2 text-[11px] bg-bone-light p-2.5 rounded-xs border border-slate-subtle">
                  <div>
                    <span className="font-bold text-burgundy-text">Conflict Condition:</span>{' '}
                    <span className="text-slate-deep">{rule.conflict_condition}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-text">Review Required:</span>{' '}
                    <span className="text-slate-deep">{rule.review_required_condition}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-muted">Insufficient Info:</span>{' '}
                    <span className="text-slate-deep">{rule.insufficient_condition}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-subtle text-[11px] text-slate-muted">
                <span className="font-semibold text-slate-deep">Limitation:</span> {rule.limitations}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
