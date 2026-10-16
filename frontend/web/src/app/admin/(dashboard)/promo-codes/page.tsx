'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatPHP, manilaDate, normalizePromoCode } from '@unik/shared/domain';
import type { PromoCode } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { CONFIRMED_STATUSES, promoStats } from '@/lib/admin/list';
import { discountLabel, emptyPromoForm, isPromoExpired, promoToForm, referralLink, toPromoDoc, validatePromoForm } from '@/lib/admin/promoAdmin';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { MessageKey, Msg } from '@/lib/admin/i18n/translate';
import type { PromoForm } from '@/lib/admin/promoAdmin';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { createPromoCode, deletePromoCode, subscribePromoCodes, updatePromoCode } from '@/lib/services/admin/promoCodes';

export default function PromoCodesPage() {
  const { t } = useAdminT();
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyPromoForm());
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, Msg>>({});
  const [message, setMessage] = useState<Msg | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<MessageKey | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off1 = subscribePromoCodes(setCodes, () => setLoadError('promo.loadFailed'));
    const off2 = subscribeApplications(setApps, () => setLoadError('common.loadApplicationsFailed'));
    return () => {
      off1();
      off2();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const stats = useMemo(() => promoStats(apps ?? []), [apps]);
  const manilaToday = manilaDate(new Date());
  const everUsed = useMemo(() => new Set((apps ?? []).map((a) => a.pricing.promo?.code).filter(Boolean) as string[]), [apps]);

  if (loadError) return <p className="admin-card p-6 text-red-600">{t(loadError)}</p>;
  // 삭제 버튼은 신청 사용 이력(everUsed)에 의존하므로 두 스냅샷이 모두 로드된 뒤에만 렌더
  if (!codes || !apps) return <Loader2 aria-label={t('common.loading')} className="h-6 w-6 animate-spin text-slate-400" />;

  const active = apps.filter((a) => a.status !== 'cancelled');
  const viaAgency = active.filter((a) => a.pricing.promo);
  const original = editing ? codes.find((c) => c.code === editing) : undefined;
  const discountChanged =
    !!original && (original.discountType !== form.discountType || String(original.discountValue) !== form.discountValue.trim());

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setMessage(null);
    setErrors((e) => {
      if (!(k in e)) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  function startNew() {
    setEditing(null);
    setForm(emptyPromoForm());
    setErrors({});
    setMessage(null);
  }

  function startEdit(p: PromoCode) {
    setEditing(p.code);
    setForm(promoToForm(p));
    setErrors({});
    setMessage(null);
  }

  async function save() {
    setMessage(null);
    const found = validatePromoForm(form, { isNew: editing === null, existingCodes: codes!.map((c) => c.code) });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      if (editing === null) {
        const code = normalizePromoCode(form.code);
        await createPromoCode(code, toPromoDoc(form), getCurrentUser()?.email ?? 'unknown');
        setMessage({ key: 'promo.created', params: { code } });
        setEditing(code);
        setForm((f) => ({ ...f, code }));
      } else {
        await updatePromoCode(editing, toPromoDoc(form));
        setMessage({ key: 'promo.saved' });
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'exists') setErrors({ code: { key: 'promo.error.codeExists' } });
      else {
        console.error(e);
        setMessage({ key: 'common.saveFailed' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(referralLink(code));
      setCopied(code);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt(t('common.copyLinkPrompt'), referralLink(code));
    }
  }

  async function remove(code: string) {
    if (!window.confirm(t('promo.deleteConfirm', { code }))) return;
    try {
      await deletePromoCode(code);
      if (editing === code) startNew();
    } catch (e) {
      console.error(e);
      setMessage({ key: 'promo.deleteFailed', params: { code } });
    }
  }

  const kpis: [MessageKey, string][] = [
    ['promo.kpi.activeCodes', String(codes.filter((c) => c.active).length)],
    ['promo.kpi.applicationsViaAgencies', t('promo.kpi.nOfTotal', { n: viaAgency.length, total: active.length })],
    ['promo.kpi.travelersViaAgencies', String(Object.values(stats).reduce((s, x) => s + x.pax, 0))],
    ['promo.kpi.discountsGiven', formatPHP(viaAgency.filter((a) => CONFIRMED_STATUSES.includes(a.status)).reduce((s, a) => s + (a.pricing.promo?.discountTotal ?? 0), 0))],
  ];
  const columns: (MessageKey | '')[] = ['promo.col.code', 'promo.col.agency', 'promo.col.discount', 'promo.col.validUntil', 'promo.col.apps', 'promo.col.pax', 'promo.col.confirmedPax', 'promo.col.netSales', 'promo.col.status', ''];
  const errorText = (k: string) => (errors[k] ? <span className="text-xs font-semibold text-red-600">{t(errors[k])}</span> : null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.promoCodes')}</h1>
        <button type="button" className="admin-btn-primary" onClick={startNew}><Plus className="h-4 w-4" /> {t('promo.newCode')}</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="admin-card p-4">
            <p className="text-xs font-semibold text-slate-500">{t(label)}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="admin-card min-w-0 flex-[999_1_640px] overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                {columns.map((h, i) => (
                  <th key={h || `col-${i}`} className="admin-table-header">{h ? t(h) : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={10} className="admin-table-cell text-slate-500">{t('promo.empty')}</td></tr>
              ) : null}
              {codes.map((c) => {
                const s = stats[c.code];
                return (
                  <tr key={c.code} className="border-t border-slate-100">
                    <td className="admin-table-cell font-bold">{c.code}</td>
                    <td className="admin-table-cell"><div className="font-semibold">{c.agencyName}</div><div className="text-xs text-slate-500">{[c.contactName, c.contactInfo].filter(Boolean).join(' · ')}</div></td>
                    <td className="admin-table-cell">{t(discountLabel(c.discountType, c.discountValue))}</td>
                    <td className="admin-table-cell">{c.validUntil || t('promo.noExpiry')}</td>
                    <td className="admin-table-cell">{s?.applications ?? 0}</td>
                    <td className="admin-table-cell">
                      {s?.pax ?? 0}
                      {c.maxPax !== null && c.maxPax !== undefined ? (
                        <span className="block text-xs text-slate-500" title={t('promo.limitHint')}>{t('promo.limit', { used: s?.quotaPax ?? 0, max: c.maxPax })}</span>
                      ) : null}
                    </td>
                    <td className="admin-table-cell font-semibold">{s?.confirmedPax ?? 0}</td>
                    <td className="admin-table-cell">{formatPHP(s?.netSales ?? 0)}</td>
                    <td className="admin-table-cell">
                      <span className={`admin-badge ${c.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{c.active ? t('promo.active') : t('promo.paused')}</span>
                      {isPromoExpired(c.validUntil, manilaToday) ? <span className="admin-badge ml-1 bg-amber-100 text-amber-800">{t('promo.expired')}</span> : null}
                    </td>
                    <td className="admin-table-cell">
                      <div className="flex gap-2">
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => void copy(c.code)} aria-label={t('promo.copyLinkLabel', { code: c.code })}>
                          {copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === c.code ? t('common.copied') : t('promo.copyLink')}
                        </button>
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => startEdit(c)} aria-label={t('promo.editCode', { code: c.code })}><Pencil className="h-4 w-4" /> {t('common.edit')}</button>
                        {!everUsed.has(c.code) ? (
                          <button type="button" className="admin-btn-danger !px-3 !py-1.5 text-xs" onClick={() => void remove(c.code)} aria-label={t('promo.deleteCode', { code: c.code })}><Trash2 className="h-4 w-4" /> {t('common.delete')}</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form
          className="admin-card flex min-w-0 flex-[1_1_320px] flex-col gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 className="text-lg font-bold text-slate-900">{editing ? t('promo.editCode', { code: editing }) : t('promo.form.newTitle')}</h2>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.code')}
            <input className="admin-input font-bold uppercase" value={form.code} readOnly={editing !== null} onChange={(e) => set('code', e.target.value)} />
            {errorText('code')}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.agencyName')}
            <input className="admin-input" value={form.agencyName} onChange={(e) => set('agencyName', e.target.value)} />
            {errorText('agencyName')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.contactName')}<input className="admin-input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.contactInfo')}<input className="admin-input" value={form.contactInfo} onChange={(e) => set('contactInfo', e.target.value)} /></label>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700">{t('promo.form.discount')}</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'fixed'} onChange={() => set('discountType', 'fixed')} /> {t('promo.form.fixed')}</label>
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'percent'} onChange={() => set('discountType', 'percent')} /> {t('promo.form.percent')}</label>
            </div>
            <input aria-label={t('promo.form.discountAmount')} className="admin-input" inputMode="numeric" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} />
            {errorText('discountValue')}
            {discountChanged ? <span className="text-xs text-slate-500">{t('promo.form.newApplicationsOnly')}</span> : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.validUntil')}
              <input type="date" className="admin-input" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
              {errorText('validUntil')}
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.maxPax')}
              <input className="admin-input" inputMode="numeric" placeholder={t('promo.form.noLimit')} value={form.maxPax} onChange={(e) => set('maxPax', e.target.value)} />
              {errorText('maxPax')}
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> {t('promo.form.active')}</label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">{t('promo.form.notes')}<textarea className="admin-input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
          {form.code.trim() ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs"><span className="font-semibold text-slate-500">{t('promo.form.referralLink')} </span><span className="break-all font-bold text-slate-900">{referralLink(normalizePromoCode(form.code))}</span></p>
          ) : null}
          {editing && everUsed.has(editing) ? <p className="text-xs text-slate-500">{t('promo.form.usedCannotDelete')}</p> : null}
          {message ? <p role="status" className="text-sm font-semibold text-slate-700">{t(message)}</p> : null}
          <button type="submit" disabled={saving} className="admin-btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? t('promo.form.saveChanges') : t('promo.form.create')}</button>
        </form>
      </div>
    </div>
  );
}
