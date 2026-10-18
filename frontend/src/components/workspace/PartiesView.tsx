import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { Party, PlotCrosswalk, SurveySeries } from '../../types';
import { Modal } from '../common/Modal';
import { t, type Language } from '../../locales';

interface PartiesViewProps {
  caseId: string;
  onDataChanged: () => void;
  lang: Language;
}

export const PartiesView: React.FC<PartiesViewProps> = ({ caseId, onDataChanged, lang }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [crosswalks, setCrosswalks] = useState<PlotCrosswalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Party modal
  const [isPartyOpen, setIsPartyOpen] = useState(false);
  const [partyLabel, setPartyLabel] = useState('');
  const [initialAliases, setInitialAliases] = useState('');

  // Alias modal
  const [targetParty, setTargetParty] = useState<Party | null>(null);
  const [newAliasText, setNewAliasText] = useState('');

  // Crosswalk modal
  const [isCrosswalkOpen, setIsCrosswalkOpen] = useState(false);
  const [seriesA, setSeriesA] = useState<SurveySeries>('RS');
  const [dagA, setDagA] = useState('');
  const [seriesB, setSeriesB] = useState<SurveySeries>('BS');
  const [dagB, setDagB] = useState('');
  const [basisNote, setBasisNote] = useState('');
  const [confirmedByReviewer, setConfirmedByReviewer] = useState(true);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [partiesData, crosswalkData] = await Promise.all([
        api.listParties(caseId),
        api.listCrosswalk(caseId),
      ]);
      setParties(partiesData);
      setCrosswalks(crosswalkData);
    } catch (err: unknown) {
      setError('Failed to load parties and crosswalk mappings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyLabel.trim()) return;

    setFormSubmitting(true);
    setFormError(null);
    try {
      const aliasesList = initialAliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await api.createParty(caseId, {
        label: partyLabel.trim(),
        aliases: aliasesList,
      });
      setIsPartyOpen(false);
      setPartyLabel('');
      setInitialAliases('');
      fetchData();
      onDataChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.detail);
      } else {
        setFormError('Failed to create party.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetParty || !newAliasText.trim()) return;

    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.addPartyAlias(targetParty.id, {
        alias_text: newAliasText.trim(),
        confirmed_by_reviewer: true,
      });
      setTargetParty(null);
      setNewAliasText('');
      fetchData();
      onDataChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.detail);
      } else {
        setFormError('Failed to add alias.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateCrosswalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dagA.trim() || !dagB.trim()) {
      setFormError('Both plot dag numbers are required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.createCrosswalk(caseId, {
        series_a: seriesA,
        dag_a: dagA.trim(),
        series_b: seriesB,
        dag_b: dagB.trim(),
        basis_note: basisNote.trim() || undefined,
        confirmed_by_reviewer: confirmedByReviewer,
      });
      setIsCrosswalkOpen(false);
      setDagA('');
      setDagB('');
      setBasisNote('');
      fetchData();
      onDataChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.detail);
      } else {
        setFormError('Failed to add crosswalk mapping.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
          {error}
        </div>
      )}

      {/* 1. Confirmed Parties Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-charcoal m-0">{t('parties_tab_title', lang)}</h3>
            <p className="text-xs text-slate-muted">
              {t('parties_tab_desc', lang)}
            </p>
          </div>
          <button
            onClick={() => {
              setPartyLabel('');
              setInitialAliases('');
              setFormError(null);
              setIsPartyOpen(true);
            }}
            className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors"
          >
            {t('create_party_btn', lang)}
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-muted font-mono animate-pulse">{t('loading_parties', lang)}</div>
        ) : parties.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-border rounded-sm bg-bone-light text-xs text-slate-muted">
            {t('no_parties_msg', lang)}
          </div>
        ) : (
          <div className="border border-slate-border rounded-lg overflow-x-auto bg-white shadow-2xs">
            <table className="w-full min-w-[640px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">{t('col_canonical_label', lang)}</th>
                  <th className="py-2.5 px-3">{t('col_linked_aliases', lang)}</th>
                  <th className="py-2.5 px-3 text-right">{t('actions', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-subtle">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-bone/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-charcoal">
                      <span className="font-mono text-teal-brand mr-2">[{p.id.slice(0, 8)}]</span>
                      {p.label}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.aliases && p.aliases.length > 0 ? (
                          p.aliases.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-xs text-[11px] ${
                                a.confirmed_by_reviewer
                                  ? 'border-slate-border bg-bone text-slate-deep'
                                  : 'border-amber-border bg-amber-surface text-amber-text'
                              }`}
                            >
                              <span>{a.alias_text}</span>
                              {a.confirmed_by_reviewer ? (
                                <span className="text-[9px] text-emerald-700 font-bold">&#10003;</span>
                              ) : (
                                <span className="text-[9px] text-amber-marker font-bold">?</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-muted italic text-[11px]">{t('no_aliases_msg', lang)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setTargetParty(p);
                          setNewAliasText('');
                          setFormError(null);
                        }}
                        className="text-xs text-teal-brand hover:underline font-medium"
                      >
                        {t('add_alias_btn', lang)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Plot Crosswalk Section */}
      <div className="space-y-3 pt-4 border-t border-slate-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-charcoal m-0">{t('crosswalk_section_title', lang)}</h3>
            <p className="text-xs text-slate-muted">
              {t('crosswalk_section_desc', lang)}
            </p>
          </div>
          <button
            onClick={() => {
              setDagA('');
              setDagB('');
              setBasisNote('');
              setFormError(null);
              setIsCrosswalkOpen(true);
            }}
            className="px-3 py-1.5 border border-slate-border text-slate-deep bg-white hover:bg-bone text-xs font-medium rounded-sm transition-colors"
          >
            {t('add_crosswalk_btn', lang)}
          </button>
        </div>

        {crosswalks.length === 0 ? (
          <div className="p-5 text-center border border-dashed border-slate-border rounded-sm bg-bone-light text-xs text-slate-muted">
            {t('no_crosswalk_msg', lang)}
          </div>
        ) : (
          <div className="border border-slate-border rounded-lg overflow-x-auto bg-white shadow-2xs">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-subtle bg-bone text-slate-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">{t('col_survey_a', lang)}</th>
                  <th className="py-2.5 px-3">{t('col_survey_b', lang)}</th>
                  <th className="py-2.5 px-3">{t('col_basis_note', lang)}</th>
                  <th className="py-2.5 px-3 text-right">{t('col_review_status', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-subtle">
                {crosswalks.map((cw) => (
                  <tr key={cw.id} className="hover:bg-bone/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium">
                      <span className="font-bold text-slate-charcoal">{cw.series_a}</span> Dag {cw.dag_a}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">
                      <span className="font-bold text-slate-charcoal">{cw.series_b}</span> Dag {cw.dag_b}
                    </td>
                    <td className="py-2.5 px-3 text-slate-deep">
                      {cw.basis_note || <span className="text-slate-muted italic">{t('no_note_recorded', lang)}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cw.confirmed_by_reviewer ? (
                        <span className="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-sm">
                          <span>{t('status_confirmed', lang)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-amber-border bg-amber-surface text-amber-text text-[10px] font-medium px-2 py-0.5 rounded-sm">
                          <span>{t('status_unconfirmed', lang)}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Party */}
      <Modal isOpen={isPartyOpen} onClose={() => setIsPartyOpen(false)} title="Create Confirmed Party Identity">
        <form onSubmit={handleCreateParty} className="space-y-4">
          {formError && (
            <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              Canonical Party Label <span className="text-burgundy-marker">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Party P1 (Original Owner)"
              value={partyLabel}
              onChange={(e) => setPartyLabel(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              Initial Name Spellings (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Md. Rahman, Mohammad Rahman, M. Rahman"
              value={initialAliases}
              onChange={(e) => setInitialAliases(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>

          <div className="pt-2 border-t border-slate-subtle flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPartyOpen(false)}
              className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Party'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Alias */}
      <Modal isOpen={targetParty !== null} onClose={() => setTargetParty(null)} title={`Add Name Variation to ${targetParty?.label}`}>
        <form onSubmit={handleAddAlias} className="space-y-4">
          {formError && (
            <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              Raw Name Spelling as Written on Document
            </label>
            <input
              type="text"
              required
              placeholder="e.g. মোঃ আবদুর রহমান"
              value={newAliasText}
              onChange={(e) => setNewAliasText(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>

          <div className="pt-2 border-t border-slate-subtle flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTargetParty(null)}
              className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Adding...' : 'Link Alias'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Crosswalk */}
      <Modal isOpen={isCrosswalkOpen} onClose={() => setIsCrosswalkOpen(false)} title="Add Cross-Survey Plot Crosswalk Entry">
        <form onSubmit={handleCreateCrosswalk} className="space-y-4">
          {formError && (
            <div className="p-3 border border-burgundy-border bg-burgundy-surface text-burgundy-text text-xs rounded-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-bone border border-slate-subtle rounded-sm space-y-2">
              <label className="block text-xs font-semibold text-slate-deep">Earlier Survey Series</label>
              <select
                value={seriesA}
                onChange={(e) => setSeriesA(e.target.value as SurveySeries)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand bg-white"
              >
                <option value="CS">CS</option>
                <option value="SA">SA</option>
                <option value="RS">RS</option>
              </select>
              <input
                type="text"
                required
                placeholder="Dag number (e.g. 140)"
                value={dagA}
                onChange={(e) => setDagA(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand font-mono"
              />
            </div>

            <div className="p-3 bg-bone border border-slate-subtle rounded-sm space-y-2">
              <label className="block text-xs font-semibold text-slate-deep">Later Survey Series</label>
              <select
                value={seriesB}
                onChange={(e) => setSeriesB(e.target.value as SurveySeries)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand bg-white"
              >
                <option value="RS">RS</option>
                <option value="BS">BS / City Survey</option>
              </select>
              <input
                type="text"
                required
                placeholder="Dag number (e.g. 285)"
                value={dagB}
                onChange={(e) => setDagB(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-deep mb-1">
              Verification Basis Note
            </label>
            <input
              type="text"
              placeholder="e.g. Verified through certified CS to RS settlement map crosswalk ledger"
              value={basisNote}
              onChange={(e) => setBasisNote(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-border text-xs rounded-sm focus:border-teal-brand focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmCrosswalk"
              checked={confirmedByReviewer}
              onChange={(e) => setConfirmedByReviewer(e.target.checked)}
              className="rounded-xs border-slate-border text-teal-brand focus:ring-teal-brand"
            />
            <label htmlFor="confirmCrosswalk" className="text-xs text-slate-deep font-medium cursor-pointer">
              Mark mapping as confirmed by reviewer (unconfirmed mappings trigger review warnings in R01)
            </label>
          </div>

          <div className="pt-2 border-t border-slate-subtle flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCrosswalkOpen(false)}
              className="px-3 py-1.5 border border-slate-border text-xs text-slate-deep rounded-sm hover:bg-bone transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-3 py-1.5 bg-teal-brand text-white text-xs font-medium rounded-sm hover:bg-teal-hover transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Add Mapping'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
