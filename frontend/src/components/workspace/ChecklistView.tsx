import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ChecklistItem, ChecklistStatus } from '../../types';
import { t, localizeChecklistLabel, localizeStatus, formatDigits, type Language } from '../../locales';

interface ChecklistViewProps {
  caseId: string;
  lang: Language;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({ caseId, lang }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [caseId]);

  const fetchChecklist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getChecklist(caseId);
      setItems(data);
    } catch (err: unknown) {
      setError(lang === 'bn' ? 'যাচাই চেকলিস্ট লোড করতে সমস্যা হয়েছে।' : 'Failed to load verification checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (item: ChecklistItem, newStatus: ChecklistStatus) => {
    try {
      const updated = await api.updateChecklistItem(item.id, { status: newStatus });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (err: unknown) {
      alert(lang === 'bn' ? 'চেকলিস্ট আইটেম আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update checklist item status.');
    }
  };

  const handleSaveNote = async (itemId: string) => {
    setSavingNote(true);
    try {
      const updated = await api.updateChecklistItem(itemId, { completion_note: noteText.trim() });
      setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
      setEditingNoteId(null);
    } catch (err: unknown) {
      alert(lang === 'bn' ? 'পর্যালোচকের নোট সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to save reviewer note.');
    } finally {
      setSavingNote(false);
    }
  };

  const completedCount = items.filter((it) => it.status === 'reviewer_completed').length;

  return (
    <div className="space-y-4">
      {/* Honest Scope Disclosure */}
      <div className="p-4 border border-teal-brand/30 bg-teal-subtle/50 text-slate-deep text-xs rounded-sm space-y-1.5">
        <div className="font-bold text-teal-brand flex items-center justify-between">
          <span>{t('checklist_title', lang)}</span>
          <span className="font-mono text-[11px]">
            {formatDigits(completedCount, lang)} / {formatDigits(items.length, lang)}{' '}
            {lang === 'bn' ? 'পর্যালোচক কর্তৃক যাচাইকৃত' : 'Completed by Reviewer'}
          </span>
        </div>
        <p className="text-slate-muted leading-relaxed">{t('checklist_notice', lang)}</p>
      </div>

      {error && (
        <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-muted font-mono animate-pulse">
          {lang === 'bn' ? 'যাচাই চেকলিস্ট লোড হচ্ছে...' : 'Loading verification checklist...'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`border rounded-sm p-4 bg-white shadow-2xs transition-colors space-y-2.5 ${
                item.status === 'reviewer_completed'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : item.status === 'not_applicable'
                  ? 'border-slate-border opacity-70 bg-bone-light'
                  : 'border-slate-border'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-slate-muted pt-0.5">
                    {formatDigits(idx + 1, lang)}.
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-charcoal m-0">
                      {localizeChecklistLabel(item.label, lang)}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-slate-muted mt-0.5 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 border border-slate-subtle bg-bone p-0.5 rounded-xs shrink-0">
                  <button
                    onClick={() => handleStatusChange(item, 'pending')}
                    className={`px-2 py-0.5 text-[11px] rounded-xs font-medium transition-colors ${
                      item.status === 'pending'
                        ? 'bg-slate-deep text-white font-semibold'
                        : 'text-slate-muted hover:text-slate-deep'
                    }`}
                  >
                    {t('pending', lang)}
                  </button>
                  <button
                    onClick={() => handleStatusChange(item, 'reviewer_completed')}
                    className={`px-2 py-0.5 text-[11px] rounded-xs font-medium transition-colors ${
                      item.status === 'reviewer_completed'
                        ? 'bg-emerald-700 text-white font-semibold'
                        : 'text-slate-muted hover:text-emerald-800'
                    }`}
                  >
                    ✓ {lang === 'bn' ? 'যাচাই সম্পন্ন' : 'Verified'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(item, 'not_applicable')}
                    className={`px-2 py-0.5 text-[11px] rounded-xs font-medium transition-colors ${
                      item.status === 'not_applicable'
                        ? 'bg-slate-charcoal text-white font-semibold'
                        : 'text-slate-muted hover:text-slate-deep'
                    }`}
                  >
                    {localizeStatus('not_applicable', lang)}
                  </button>
                </div>
              </div>

              {/* Reviewer Note */}
              <div className="pt-2 border-t border-slate-subtle/80 flex items-start justify-between text-xs">
                {editingNoteId === item.id ? (
                  <div className="w-full space-y-2">
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={
                        lang === 'bn'
                          ? 'নথির ভলিউম নম্বর, ভূমি অফিসের রসিদ, বা যাচাইয়ের তারিখ লিখুন...'
                          : 'Record certified volume number, land office verification receipt, or date checked...'
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1 border border-slate-border text-[11px] text-slate-deep rounded-sm"
                      >
                        {t('cancel', lang)}
                      </button>
                      <button
                        onClick={() => handleSaveNote(item.id)}
                        disabled={savingNote}
                        className="px-2.5 py-1 bg-teal-brand text-white text-[11px] font-medium rounded-sm hover:bg-teal-hover disabled:opacity-50"
                      >
                        {savingNote ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : t('save', lang)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-muted">
                      <strong className="text-slate-deep">{t('reviewer_note', lang)}:</strong>{' '}
                      {item.completion_note || (
                        <em className="text-slate-muted">
                          {lang === 'bn' ? 'কোনো নোট নেই।' : 'No note recorded.'}
                        </em>
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setNoteText(item.completion_note || '');
                      }}
                      className="text-[11px] text-teal-brand hover:underline font-medium ml-2 cursor-pointer"
                    >
                      {item.completion_note
                        ? (lang === 'bn' ? 'নোট সম্পাদনা' : 'Edit Note')
                        : (lang === 'bn' ? '+ নোট যোগ করুন' : '+ Add Note')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
