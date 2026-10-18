import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { RecordType, SourceRecord, SurveySeries, Party } from '../../types';
import { Modal } from '../common/Modal';
import { t, localizeRecordType, localizeAreaUnit, localizeAreaValue, type Language } from '../../locales';

interface RecordsViewProps {
  caseId: string;
  parties: Party[];
  onRecordsChanged: () => void;
  inspectedRecordId: string | null;
  lang: Language;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  caseId,
  parties,
  onRecordsChanged,
  inspectedRecordId,
  lang,
}) => {
  const [records, setRecords] = useState<SourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SourceRecord | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ record: SourceRecord; error: string } | null>(null);

  // Form state
  const [recordType, setRecordType] = useState<RecordType>('deed');
  const [sourceReference, setSourceReference] = useState('');
  const [surveySeries, setSurveySeries] = useState<SurveySeries | ''>('RS');
  const [dagNo, setDagNo] = useState('');
  const [khatianNo, setKhatianNo] = useState('');
  const [deedNo, setDeedNo] = useState('');
  const [mutationCaseNo, setMutationCaseNo] = useState('');
  const [dcrNo, setDcrNo] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [areaValue, setAreaValue] = useState<string>('');
  const [areaUnit, setAreaUnit] = useState('decimal');
  const [sellerPartyId, setSellerPartyId] = useState('');
  const [buyerPartyId, setBuyerPartyId] = useState('');
  const [ownerPartyId, setOwnerPartyId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listRecords(caseId, false);
      setRecords(data);
    } catch (err: unknown) {
      setError('Failed to load source records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [caseId]);

  useEffect(() => {
    if (!inspectedRecordId || loading) return;
    document.getElementById(`source-record-${inspectedRecordId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [inspectedRecordId, loading, records]);

  const resetForm = () => {
    setRecordType('deed');
    setSourceReference('');
    setSurveySeries('RS');
    setDagNo('');
    setKhatianNo('');
    setDeedNo('');
    setMutationCaseNo('');
    setDcrNo('');
    setRecordDate('');
    setRegistrationDate('');
    setAreaValue('');
    setAreaUnit('decimal');
    setSellerPartyId('');
    setBuyerPartyId('');
    setOwnerPartyId('');
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingRecord(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rec: SourceRecord) => {
    resetForm();
    setEditingRecord(rec);
    setRecordType(rec.record_type);
    setSourceReference(rec.source_reference);
    setSurveySeries(rec.survey_series || '');
    setDagNo(rec.dag_no || '');
    setKhatianNo(rec.khatian_no || '');
    setDeedNo(rec.deed_no || '');
    setMutationCaseNo(rec.mutation_case_no || '');
    setDcrNo(rec.dcr_no || '');
    setRecordDate(rec.record_date || '');
    setRegistrationDate(rec.registration_date || '');
    setAreaValue(rec.area_value !== null && rec.area_value !== undefined ? String(rec.area_value) : '');
    setAreaUnit(rec.area_unit || 'decimal');
    setSellerPartyId(rec.seller_party_id || '');
    setBuyerPartyId(rec.buyer_party_id || '');
    setOwnerPartyId(rec.owner_party_id || '');
    setIsAddOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceReference.trim()) {
      setFormError(t('ref_required_error', lang));
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      record_type: recordType,
      source_reference: sourceReference.trim(),
      survey_series: surveySeries ? (surveySeries as SurveySeries) : undefined,
      dag_no: dagNo.trim() || undefined,
      khatian_no: khatianNo.trim() || undefined,
      deed_no: deedNo.trim() || undefined,
      mutation_case_no: mutationCaseNo.trim() || undefined,
      dcr_no: dcrNo.trim() || undefined,
      record_date: recordDate || undefined,
      registration_date: registrationDate || undefined,
      area_value: areaValue.trim() ? parseFloat(areaValue) : undefined,
      area_unit: areaUnit.trim() || undefined,
      area_original: areaValue.trim() ? `${areaValue.trim()} ${areaUnit}` : undefined,
      seller_party_id: sellerPartyId || undefined,
      buyer_party_id: buyerPartyId || undefined,
      owner_party_id: ownerPartyId || undefined,
    };

    try {
      if (editingRecord) {
        await api.updateRecord(editingRecord.id, payload);
      } else {
        await api.addRecord(caseId, payload);
      }
      setIsAddOpen(false);
      fetchRecords();
      onRecordsChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.detail);
      } else {
        setFormError('Failed to save source record.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRecord = async (rec: SourceRecord, soft = false) => {
    try {
      await api.deleteRecord(rec.id, soft);
      setDeleteWarning(null);
      fetchRecords();
      onRecordsChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteWarning({ record: rec, error: err.detail });
      } else {
        alert('Failed to delete record.');
      }
    }
  };

  const getPartyLabel = (partyId?: string | null) => {
    if (!partyId) return '—';
    const found = parties.find((p) => p.id === partyId);
    return found ? found.label : partyId;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-charcoal m-0">{t('records_tab_title', lang)}</h3>
          <p className="text-xs text-slate-muted">
            {t('records_tab_desc', lang)}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors"
        >
          {t('add_record_btn', lang)}
        </button>
      </div>

      {error && (
        <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
          {error}
        </div>
      )}

      {/* Citation Delete Restriction Alert */}
      {deleteWarning && (
        <div className="p-4 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm space-y-2">
          <div className="font-bold">{t('delete_restricted_title', lang)}</div>
          <p>{deleteWarning.error}</p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleDeleteRecord(deleteWarning.record, true)}
              className="px-3 py-1 bg-burgundy-marker text-white text-xs font-medium rounded-sm hover:bg-red-800"
            >
              {t('soft_archive_btn', lang)}
            </button>
            <button
              onClick={() => setDeleteWarning(null)}
              className="px-3 py-1 border border-slate-border text-slate-deep text-xs rounded-sm bg-white"
            >
              {t('cancel', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Records Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-muted font-mono animate-pulse">
          {t('loading_records', lang)}
        </div>
      ) : records.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-border rounded-sm bg-bone-light space-y-2">
          <p className="text-xs font-semibold text-slate-charcoal">{t('no_records_title', lang)}</p>
          <p className="text-[11px] text-slate-muted">
            {t('no_records_desc', lang)}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover"
          >
            {t('add_first_record', lang)}
          </button>
        </div>
      ) : (
        <div className="border border-slate-border rounded-lg overflow-x-auto bg-white shadow-2xs">
          <div className="sticky left-0 z-10 px-3 py-1.5 bg-slate-50 border-b border-slate-subtle text-[10px] text-slate-muted sm:hidden">
            {lang === 'bn' ? 'সব তথ্য দেখতে পাশে স্ক্রল করুন' : 'Swipe horizontally to view all record details'}
          </div>
          <table className="w-full min-w-[900px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">{t('col_type', lang)}</th>
                <th className="py-2.5 px-3">{t('col_reference', lang)}</th>
                <th className="py-2.5 px-3">{t('col_survey_plot', lang)}</th>
                <th className="py-2.5 px-3">{t('col_area', lang)}</th>
                <th className="py-2.5 px-3">{t('col_parties', lang)}</th>
                <th className="py-2.5 px-3">{t('col_dates', lang)}</th>
                <th className="py-2.5 px-3 text-right">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-subtle">
              {records.map((r) => (
                <tr
                  key={r.id}
                  id={`source-record-${r.id}`}
                  className={`transition-colors ${inspectedRecordId === r.id ? 'bg-amber-surface ring-2 ring-inset ring-amber-marker' : 'hover:bg-bone/50'}`}
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-deep capitalize">
                    {localizeRecordType(r.record_type, lang)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-charcoal">
                    {r.source_reference}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <span className="bg-bone px-1 py-0.5 border border-slate-subtle rounded-xs mr-1 text-slate-muted">
                      {r.survey_series || 'Series?'}
                    </span>
                    <span>{t('dag_no', lang)}: {r.dag_no || '—'}</span>
                    {r.khatian_no && <span className="text-slate-muted block text-[10px]">{t('khatian_no', lang)}: {r.khatian_no}</span>}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium">
                    {r.area_value !== null && r.area_value !== undefined ? (
                      <span>
                        {r.area_value} <span className="text-slate-muted text-[11px]">{localizeAreaUnit(r.area_unit, lang)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-muted">{localizeAreaValue(r.area_original, lang) || '—'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px]">
                    {r.record_type === 'deed' ? (
                      <div>
                        <span className="text-slate-muted">{t('seller_label', lang)}:</span> {getPartyLabel(r.seller_party_id)}
                        <br />
                        <span className="text-slate-muted">{t('buyer_label', lang)}:</span> {getPartyLabel(r.buyer_party_id)}
                      </div>
                    ) : r.record_type === 'khatian' ? (
                      <div>
                        <span className="text-slate-muted">{t('owner_label', lang)}:</span> {getPartyLabel(r.owner_party_id)}
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-muted">{t('owner_buyer_label', lang)}:</span>{' '}
                        {getPartyLabel(r.owner_party_id || r.buyer_party_id)}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-muted">
                    {r.registration_date ? (
                      <span>{t('reg_short', lang)}: {r.registration_date}</span>
                    ) : r.record_date ? (
                      <span>{t('rec_short', lang)}: {r.record_date}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="text-xs text-teal-brand hover:underline font-medium"
                      >
                        {t('edit', lang)}
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(r)}
                        className="text-xs text-burgundy-text hover:underline"
                      >
                        {t('delete', lang)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Record Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingRecord ? `${t('edit', lang)}: ${editingRecord.source_reference}` : t('add_record_modal_title', lang)}
        maxWidth="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('record_type_label', lang)} <span className="text-burgundy-marker">*</span>
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as RecordType)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white capitalize"
              >
                <option value="deed">{t('deed', lang)}</option>
                <option value="khatian">{t('khatian', lang)}</option>
                <option value="mutation">{t('mutation', lang)}</option>
                <option value="dcr">{t('dcr', lang)}</option>
                <option value="survey_reference">{t('survey_reference', lang)}</option>
                <option value="other">{t('other', lang)}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('ref_label', lang)} <span className="text-burgundy-marker">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'যেমন: দলিল ২০২১/৪০৫ বা আরএস খতিয়ান ৮৮' : 'e.g. Deed 2021/405 or RS Khatian 88'}
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">{t('survey_series', lang)}</label>
              <select
                value={surveySeries}
                onChange={(e) => setSurveySeries(e.target.value as SurveySeries | '')}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
              >
                <option value="">{t('unspecified', lang)}</option>
                <option value="CS">CS ({lang === 'bn' ? 'ক্যাডাস্ট্রাল জরিপ' : 'Cadastral'})</option>
                <option value="SA">SA ({lang === 'bn' ? 'রাষ্ট্রীয় অধিগ্রহণ জরিপ' : 'State Acquisition'})</option>
                <option value="RS">RS ({lang === 'bn' ? 'সংশোধনী জরিপ' : 'Revisional'})</option>
                <option value="BS">{lang === 'bn' ? 'বিএস / সিটি জরিপ' : 'BS / City Survey'}</option>
                <option value="other">{t('other', lang)}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('dag_no', lang)}
              </label>
              <input
                type="text"
                placeholder="e.g. 500"
                value={dagNo}
                onChange={(e) => setDagNo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('khatian_no', lang)}
              </label>
              <input
                type="text"
                placeholder="e.g. 101"
                value={khatianNo}
                onChange={(e) => setKhatianNo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('area_label', lang)}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 30.0"
                value={areaValue}
                onChange={(e) => setAreaValue(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('area_unit', lang)}
              </label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
              >
                <option value="decimal">Decimal / Shotok (শতাংশ = 435.6 sq ft)</option>
                <option value="acre">Acre (একর = 43,560 sq ft)</option>
                <option value="sq_ft">Square feet (বর্গফুট)</option>
                <option value="sq_m">Square meter (বর্গমিটার)</option>
                <option value="katha">Katha (কাঠা - Regional)</option>
                <option value="bigha">Bigha (বিঘা - Regional)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('record_date', lang)}
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('registration_date', lang)}
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
              />
            </div>
          </div>

          {/* Party Linkages */}
          {recordType === 'deed' ? (
            <div className="grid grid-cols-2 gap-3 p-3 bg-bone border border-slate-subtle rounded-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-deep mb-1">
                  {t('seller_party_label', lang)}
                </label>
                <select
                  value={sellerPartyId}
                  onChange={(e) => setSellerPartyId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
                >
                  <option value="">{t('select_party_placeholder', lang)}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-deep mb-1">
                  {t('buyer_party_label', lang)}
                </label>
                <select
                  value={buyerPartyId}
                  onChange={(e) => setBuyerPartyId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
                >
                  <option value="">{t('select_party_placeholder', lang)}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-bone border border-slate-subtle rounded-sm">
              <label className="block text-xs font-semibold text-slate-deep mb-1">
                {t('owner_party_label', lang)}
              </label>
              <select
                value={ownerPartyId}
                onChange={(e) => setOwnerPartyId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden bg-white"
              >
                <option value="">{t('select_party_placeholder', lang)}</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-slate-subtle flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
            >
              {t('cancel', lang)}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors disabled:opacity-50"
            >
              {formSubmitting ? t('saving', lang) : editingRecord ? t('update_record', lang) : t('save_record', lang)}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
