'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { describeDiscount, formatPHP, manilaDate, normalizePromoCode } from '@unik/shared/domain';
import type { PromoCode } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { CONFIRMED_STATUSES, promoStats } from '@/lib/admin/list';
import { emptyPromoForm, isPromoExpired, promoToForm, referralLink, toPromoDoc, validatePromoForm } from '@/lib/admin/promoAdmin';
import type { PromoForm } from '@/lib/admin/promoAdmin';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { createPromoCode, deletePromoCode, subscribePromoCodes, updatePromoCode } from '@/lib/services/admin/promoCodes';

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyPromoForm());
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off1 = subscribePromoCodes(setCodes, () => setLoadError('Could not load promo codes.'));
    const off2 = subscribeApplications(setApps, () => setLoadError('Could not load applications.'));
    return () => {
      off1();
      off2();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const stats = useMemo(() => promoStats(apps ?? []), [apps]);
  const manilaToday = manilaDate(new Date());
  const everUsed = useMemo(() => new Set((apps ?? []).map((a) => a.pricing.promo?.code).filter(Boolean) as string[]), [apps]);

  if (loadError) return <p className="admin-card p-6 text-red-600">{loadError}</p>;
  // 삭제 버튼은 신청 사용 이력(everUsed)에 의존하므로 두 스냅샷이 모두 로드된 뒤에만 렌더
  if (!codes || !apps) return <Loader2 aria-label="Loading" className="h-6 w-6 animate-spin text-slate-400" />;

  const active = apps.filter((a) => a.status !== 'cancelled');
  const viaAgency = active.filter((a) => a.pricing.promo);
  const original = editing ? codes.find((c) => c.code === editing) : undefined;
  const discountChanged =
    !!original && (original.discountType !== form.discountType || String(original.discountValue) !== form.discountValue.trim());

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setMessage('');
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
    setMessage('');
  }

  function startEdit(p: PromoCode) {
    setEditing(p.code);
    setForm(promoToForm(p));
    setErrors({});
    setMessage('');
  }

  async function save() {
    setMessage('');
    const found = validatePromoForm(form, { isNew: editing === null, existingCodes: codes!.map((c) => c.code) });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      if (editing === null) {
        const code = normalizePromoCode(form.code);
        await createPromoCode(code, toPromoDoc(form), getCurrentUser()?.email ?? 'unknown');
        setMessage(`Created ${code}.`);
        setEditing(code);
        setForm((f) => ({ ...f, code }));
      } else {
        await updatePromoCode(editing, toPromoDoc(form));
        setMessage('Saved. Changes apply to new applications only.');
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'exists') setErrors({ code: 'This code already exists.' });
      else {
        console.error(e);
        setMessage('Save failed. Please try again.');
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
      window.prompt('Copy this link:', referralLink(code));
    }
  }

  async function remove(code: string) {
    if (!window.confirm(`Delete promo code ${code}? This cannot be undone.`)) return;
    try {
      await deletePromoCode(code);
      if (editing === code) startNew();
    } catch (e) {
      console.error(e);
      setMessage(`Could not delete ${code}. Please try again.`);
    }
  }

  const kpis = [
    ['Active codes', String(codes.filter((c) => c.active).length)],
    ['Applications via agencies', `${viaAgency.length} of ${active.length}`],
    ['Travelers via agencies', String(Object.values(stats).reduce((s, x) => s + x.pax, 0))],
    ['Discounts given (confirmed)', formatPHP(viaAgency.filter((a) => CONFIRMED_STATUSES.includes(a.status)).reduce((s, a) => s + (a.pricing.promo?.discountTotal ?? 0), 0))],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Promo codes</h1>
        <button type="button" className="admin-btn-primary" onClick={startNew}><Plus className="h-4 w-4" /> New code</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="admin-card p-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="admin-card min-w-0 flex-[999_1_640px] overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                {['Code', 'Travel agency', 'Discount', 'Valid until', 'Apps', 'Pax', 'Confirmed pax', 'Net sales', 'Status', ''].map((h, i) => (
                  <th key={h || `col-${i}`} className="admin-table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={10} className="admin-table-cell text-slate-500">No promo codes yet.</td></tr>
              ) : null}
              {codes.map((c) => {
                const s = stats[c.code];
                return (
                  <tr key={c.code} className="border-t border-slate-100">
                    <td className="admin-table-cell font-bold">{c.code}</td>
                    <td className="admin-table-cell"><div className="font-semibold">{c.agencyName}</div><div className="text-xs text-slate-500">{[c.contactName, c.contactInfo].filter(Boolean).join(' · ')}</div></td>
                    <td className="admin-table-cell">{describeDiscount(c.discountType, c.discountValue)}</td>
                    <td className="admin-table-cell">{c.validUntil || 'No expiry'}</td>
                    <td className="admin-table-cell">{s?.applications ?? 0}</td>
                    <td className="admin-table-cell">
                      {s?.pax ?? 0}
                      {c.maxPax !== null && c.maxPax !== undefined ? (
                        <span className="block text-xs text-slate-500" title="Infants do not count toward the limit">limit {s?.quotaPax ?? 0} / {c.maxPax}</span>
                      ) : null}
                    </td>
                    <td className="admin-table-cell font-semibold">{s?.confirmedPax ?? 0}</td>
                    <td className="admin-table-cell">{formatPHP(s?.netSales ?? 0)}</td>
                    <td className="admin-table-cell">
                      <span className={`admin-badge ${c.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{c.active ? 'Active' : 'Paused'}</span>
                      {isPromoExpired(c.validUntil, manilaToday) ? <span className="admin-badge ml-1 bg-amber-100 text-amber-800">Expired</span> : null}
                    </td>
                    <td className="admin-table-cell">
                      <div className="flex gap-2">
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => void copy(c.code)} aria-label={`Copy referral link for ${c.code}`}>
                          {copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === c.code ? 'Copied' : 'Copy link'}
                        </button>
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => startEdit(c)} aria-label={`Edit ${c.code}`}><Pencil className="h-4 w-4" /> Edit</button>
                        {!everUsed.has(c.code) ? (
                          <button type="button" className="admin-btn-danger !px-3 !py-1.5 text-xs" onClick={() => void remove(c.code)} aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /> Delete</button>
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
          <h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${editing}` : 'New promo code'}</h2>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Code
            <input className="admin-input font-bold uppercase" value={form.code} readOnly={editing !== null} onChange={(e) => set('code', e.target.value)} />
            {errors.code ? <span className="text-xs font-semibold text-red-600">{errors.code}</span> : null}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Travel agency name
            <input className="admin-input" value={form.agencyName} onChange={(e) => set('agencyName', e.target.value)} />
            {errors.agencyName ? <span className="text-xs font-semibold text-red-600">{errors.agencyName}</span> : null}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Contact person<input className="admin-input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Phone / email<input className="admin-input" value={form.contactInfo} onChange={(e) => set('contactInfo', e.target.value)} /></label>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700">Discount</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'fixed'} onChange={() => set('discountType', 'fixed')} /> Fixed PHP per person</label>
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'percent'} onChange={() => set('discountType', 'percent')} /> Percent</label>
            </div>
            <input aria-label="Discount amount" className="admin-input" inputMode="numeric" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} />
            {errors.discountValue ? <span className="text-xs font-semibold text-red-600">{errors.discountValue}</span> : null}
            {discountChanged ? <span className="text-xs text-slate-500">Changes apply to new applications only.</span> : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Valid until
              <input type="date" className="admin-input" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
              {errors.validUntil ? <span className="text-xs font-semibold text-red-600">{errors.validUntil}</span> : null}
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Max travelers (infants not counted)
              <input className="admin-input" inputMode="numeric" placeholder="No limit" value={form.maxPax} onChange={(e) => set('maxPax', e.target.value)} />
              {errors.maxPax ? <span className="text-xs font-semibold text-red-600">{errors.maxPax}</span> : null}
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active</label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Notes<textarea className="admin-input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
          {form.code.trim() ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs"><span className="font-semibold text-slate-500">Referral link: </span><span className="break-all font-bold text-slate-900">{referralLink(normalizePromoCode(form.code))}</span></p>
          ) : null}
          {editing && everUsed.has(editing) ? <p className="text-xs text-slate-500">This code has been used, so it can&apos;t be deleted. Pause instead: untick Active.</p> : null}
          {message ? <p role="status" className="text-sm font-semibold text-slate-700">{message}</p> : null}
          <button type="submit" disabled={saving} className="admin-btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save changes' : 'Create code'}</button>
        </form>
      </div>
    </div>
  );
}
