import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
    return () => previousFocusRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-charcoal/40 backdrop-blur-xs"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidthClass} bg-white border border-slate-border rounded-sm shadow-lg overflow-hidden flex flex-col max-h-[90vh]`}
        role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      onKeyDown={(event) => {
        if (event.key === 'Escape') { onClose(); return; }
        if (event.key !== 'Tab' || !dialogRef.current) return;
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }}
    >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-subtle bg-bone-light flex items-center justify-between">
          <h3 id="modal-headline" className="text-sm font-bold text-slate-charcoal m-0">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-muted hover:text-slate-charcoal text-lg leading-none p-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
