import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, ApiError } from '../../api/client';
import type { VerificationCase } from '../../types';
import { t, type Language } from '../../locales';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (createdCase: VerificationCase) => void;
  lang?: Language;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
  lang = 'en',
}) => {
  const [caseCode, setCaseCode] = useState('');
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Gazipur');
  const [upazila, setUpazila] = useState('Sreepur');
  const [mouza, setMouza] = useState('Telihati');
  const [jlNumber, setJlNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCode.trim() || !title.trim()) {
      setError(lang === 'bn' ? 'কেস কোড ও শিরোনাম আবশ্যক।' : 'Case code and title are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.createCase({
        case_code: caseCode.trim(),
        title: title.trim(),
        district: district.trim() || undefined,
        upazila: upazila.trim() || undefined,
        mouza: mouza.trim() || undefined,
        jl_number: jlNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        provenance: 'user_entered',
      });
      onCaseCreated(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(lang === 'bn' ? 'কেস তৈরি করতে সমস্যা হয়েছে।' : 'Failed to create case. Please check connectivity.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lang === 'bn' ? 'নতুন যাচাই কেস তৈরি' : 'Create New Verification Case'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              {lang === 'bn' ? 'কেস কোড' : 'Case Code'} <span className="text-burgundy-marker">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. JT-2026-01"
              value={caseCode}
              onChange={(e) => setCaseCode(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              {lang === 'bn' ? 'উৎস ধরন' : 'Data Provenance'}
            </label>
            <div className="w-full px-2.5 py-1.5 border border-slate-subtle bg-bone text-xs text-slate-muted rounded-sm flex items-center justify-between">
              <span>{lang === 'bn' ? 'কাল্পনিক (ডেমো)' : 'Synthetic (fictional)'}</span>
              <span className="text-[10px] uppercase font-bold text-teal-brand">Safe Demo</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-deep mb-1">
            {lang === 'bn' ? 'কেসের শিরোনাম' : 'Case Title'} <span className="text-burgundy-marker">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sreepur Mouza Dag 500 Transfer Chain Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">{t('district', lang)}</label>
            <input
              type="text"
              placeholder="Gazipur"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">{t('upazila', lang)}</label>
            <input
              type="text"
              placeholder="Sreepur"
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">{t('mouza', lang)}</label>
            <input
              type="text"
              placeholder="Telihati"
              value={mouza}
              onChange={(e) => setMouza(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-deep mb-1">{t('jl_number', lang)}</label>
          <input
            type="text"
            placeholder="e.g. 14"
            value={jlNumber}
            onChange={(e) => setJlNumber(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-deep mb-1">
            {lang === 'bn' ? 'প্রাথমিক তদন্ত নোট' : 'Investigation Notes'}
          </label>
          <textarea
            rows={2}
            placeholder="Add initial reviewer context, stated holding background, or seller claims..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
          />
        </div>

        <div className="pt-2 border-t border-slate-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
          >
            {t('cancel', lang)}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors disabled:opacity-50"
          >
            {submitting ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating Case...') : t('create_case', lang)}
          </button>
        </div>
      </form>
    </Modal>
  );
};
