import React from 'react';
import type { CaseStatus, FindingStatus } from '../../types';
import { localizeStatus, type Language } from '../../locales';

interface StatusBadgeProps {
  status: FindingStatus | CaseStatus | string;
  size?: 'sm' | 'md';
  lang?: Language;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', lang = 'en' }) => {
  const norm = String(status).toLowerCase();
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  const label = localizeStatus(status, lang);

  switch (norm) {
    case 'conflict_detected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-burgundy-border bg-burgundy-surface text-burgundy-text font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-burgundy-marker" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'review_required':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-amber-border bg-amber-surface text-amber-text font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-marker" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'insufficient_information':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-slate-border bg-slate-subtle text-slate-deep font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-muted" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'no_inconsistency_found':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'not_applicable':
      return <span className={`inline-flex items-center gap-1.5 border border-slate-border bg-slate-50 text-slate-muted font-medium rounded-sm ${pad}`}><span>{label}</span></span>;

    case 'draft':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-slate-border bg-bone-light text-slate-muted font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-border" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'in_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-teal-subtle bg-teal-subtle text-teal-brand font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-brand" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'report_ready':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'archived':
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-slate-border bg-slate-subtle text-slate-muted font-medium rounded-sm ${pad}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-muted" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 border border-slate-border bg-white text-slate-deep rounded-sm ${pad}`}
        >
          <span>{label || status}</span>
        </span>
      );
  }
};
