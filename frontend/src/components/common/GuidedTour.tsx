/**
 * GuidedTour — lightweight bilingual first-time tour component.
 * No external dependencies. Uses React portals + localStorage for persistence.
 * 7 steps covering the core JomiTrace workflow.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t, formatDigits, type Language } from '../../locales';

const TOUR_DISMISSED_KEY = 'jomitrace_tour_dismissed';

interface Step {
  titleKey: string;
  descKey: string;
  /** Optional CSS selector for data-tour attribute. May not exist on first load. */
  targetAttr?: string;
}

const STEPS: Step[] = [
  { titleKey: 'tour_step1_title', descKey: 'tour_step1_desc', targetAttr: '[data-tour="ledger-overview"]' },
  { titleKey: 'tour_step2_title', descKey: 'tour_step2_desc', targetAttr: '[data-tour="ledger-scenarios"]' },
  { titleKey: 'tour_step3_title', descKey: 'tour_step3_desc', targetAttr: '[data-tour="workspace-evidence"]' },
  { titleKey: 'tour_step4_title', descKey: 'tour_step4_desc', targetAttr: '[data-tour="timeline-tab"]' },
  { titleKey: 'tour_step5_title', descKey: 'tour_step5_desc', targetAttr: '[data-tour="checklist-tab"]' },
  { titleKey: 'tour_step6_title', descKey: 'tour_step6_desc', targetAttr: '[data-tour="audit-tab"]' },
  { titleKey: 'tour_step7_title', descKey: 'tour_step7_desc', targetAttr: '[data-tour="report-tab"]' },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, lang }) => {
  const [step, setStep] = useState(0);
  const [targetFound, setTargetFound] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstActionRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const selector = STEPS[step].targetAttr;
    let highlighted: HTMLElement | null = null;
    const updateTarget = () => {
      const target = selector ? document.querySelector<HTMLElement>(selector) : null;
      setTargetFound(Boolean(target));
      if (!target) {
        highlighted = null;
        setTargetRect(null);
        return;
      }
      if (target !== highlighted) {
        target.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
        highlighted = target;
      }
      setTargetRect(target.getBoundingClientRect());
    };
    updateTarget();
    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
      setTargetRect(null);
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = () => onClose();

  const handleDontShow = () => {
    try {
      localStorage.setItem(TOUR_DISMISSED_KEY, '1');
    } catch {
      // localStorage may be unavailable
    }
    onClose();
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tour_welcome_title', lang)}
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 sm:p-6"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
          return;
        }
        if (event.key === 'Tab' && dialogRef.current) {
          const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-0 bg-slate-charcoal/55" aria-hidden="true" />
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none border-2 border-teal-brand rounded-md shadow-[0_0_0_3px_rgba(23,63,58,0.22)] z-[1001] transition-all"
          style={{ left: targetRect.left - 3, top: targetRect.top - 3, width: targetRect.width + 6, height: targetRect.height + 6 }}
        />
      )}
      <div
        ref={dialogRef}
        className="bg-white border border-slate-border rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto text-xs space-y-4 p-5 fixed left-1/2 z-[1002]"
        style={targetRect
          ? {
              transform: 'translateX(-50%)',
              ...(targetRect.top + targetRect.height / 2 > window.innerHeight / 2 ? { top: '1rem' } : { bottom: '1rem' }),
            }
          : { top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-teal-brand font-bold mb-0.5">
              {lang === 'bn' ? `ধাপ ${step + 1} / ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
            </div>
            <h2 className="text-sm font-bold text-slate-charcoal m-0">{t(current.titleKey, lang)}</h2>
          </div>
          <button
            ref={firstActionRef}
            onClick={handleSkip}
            className="text-slate-muted hover:text-slate-deep text-xs shrink-0 mt-0.5 cursor-pointer"
            title={t('tour_skip', lang)}
          >
            ✕
          </button>
        </div>

        {/* Step indicator dots */}
        <div className="flex gap-1.5 items-center">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === step ? 'bg-teal-brand' : 'bg-slate-border hover:bg-slate-muted'
              }`}
              title={`${t('tour_step_short', lang)} ${formatDigits(i + 1, lang)}`}
            />
          ))}
        </div>

        {/* Description */}
        <p className="text-slate-deep leading-relaxed">{t(current.descKey, lang)}</p>
        {!targetFound && (
          <p className="text-amber-text bg-amber-surface border border-amber-border rounded-sm p-2" role="status">
            {t('tour_target_unavailable', lang)}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-subtle">
          <button
            onClick={handleDontShow}
            className="text-[11px] text-slate-muted hover:text-slate-deep underline cursor-pointer"
          >
            {t('tour_dont_show', lang)}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors cursor-pointer"
              >
                {t('tour_back', lang)}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-teal-brand text-white text-xs font-semibold rounded-sm hover:bg-teal-hover transition-colors cursor-pointer"
            >
              {isLast ? t('tour_finish', lang) : t('tour_next', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

/**
 * Returns true if the user has previously dismissed the tour.
 * Safe to call on server-side render (returns false if localStorage unavailable).
 */
export function isTourDismissed(): boolean {
  try {
    return localStorage.getItem(TOUR_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}
