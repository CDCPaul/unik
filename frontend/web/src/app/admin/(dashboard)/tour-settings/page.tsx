'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT_LABELS, formatPHP, isValidPrice } from '@unik/shared/domain';
import type { Availability, Category, Departure, TourConfig } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { parseAmount } from '@/lib/admin/edits';
import { canRemoveDeparture, computeDepartureUsage, defaultTourConfig, newDeparture, validateTourConfig } from '@/lib/admin/tourSettings';
import type { DepartureUsage } from '@/lib/admin/tourSettings';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { saveTourConfig, subscribeAvailability, subscribeTourConfig } from '@/lib/services/admin/tourConfig';
import type { TourConfigMeta } from '@/lib/services/admin/tourConfig';

// 잘못된 입력은 NaN 으로 두어 validateTourConfig 가 오류로 표시하게 한다 (저장 시에만 변환)
const num = (raw: string): number => (raw.trim() === '' || raw.trim() === '0' ? 0 : parseAmount(raw) ?? NaN);
// 가격은 다섯 유형 모두 필수: 빈 칸은 0 이 아니라 오류
const priceNum = (raw: string): number => (raw.trim() === '' ? NaN : num(raw));

const PRICE_FIELD_LABELS: Record<Category, string> = {
  full: 'Full marathon',
  tenK: '10K',
  companion: 'Companion',
  child: CATEGORY_LABELS.child,
  infant: CATEGORY_LABELS.infant,
};

const STALE_MESSAGE = 'Tour settings were changed by someone else. Reload to see their changes before saving.';
const IN_USE_HINT = 'Has applications — close it instead (untick Open).';

// 숫자 칸은 입력 중인 문자열 그대로 보관한다.
type FormDeparture = Omit<Departure, 'seatCapacity' | 'prices' | 'singleSupplement'> & {
  seatCapacity: string;
  prices: Record<Category, string>;
  singleSupplement: string;
};
type FormState = {
  acceptingApplications: boolean;
  depositPerPax: string;
  bibTotal: string;
  maya: string;
  emails: string;
  departures: FormDeparture[];
};

const toFormDeparture = (d: Departure): FormDeparture => ({
  id: d.id,
  label: d.label,
  departDate: d.departDate,
  returnDate: d.returnDate,
  flightInfo: d.flightInfo,
  isOpen: d.isOpen,
  seatCapacity: String(d.seatCapacity),
  // 예전 설정에는 child/infant 가격이 없다 → 빈 칸으로 보여주고 저장 전에 입력하게 한다
  prices: Object.fromEntries(CATEGORIES.map((c) => [c, isValidPrice(d.prices?.[c]) ? String(d.prices[c]) : ''])) as Record<Category, string>,
  singleSupplement: String(d.singleSupplement),
});

const toForm = (c: TourConfig): FormState => ({
  acceptingApplications: c.acceptingApplications,
  depositPerPax: String(c.depositPerPax),
  bibTotal: String(c.bibQuota.total),
  maya: c.mayaPaymentLinkBase ?? '',
  emails: c.notifyEmails.join('\n'),
  departures: c.departures.map(toFormDeparture),
});

function toConfig(f: FormState, base: TourConfig): TourConfig {
  return {
    ...base,
    acceptingApplications: f.acceptingApplications,
    depositPerPax: num(f.depositPerPax),
    bibQuota: { ...base.bibQuota, total: num(f.bibTotal) },
    mayaPaymentLinkBase: f.maya,
    notifyEmails: f.emails.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
    departures: f.departures.map((d) => ({
      id: d.id,
      label: d.label,
      departDate: d.departDate,
      returnDate: d.returnDate,
      flightInfo: d.flightInfo,
      isOpen: d.isOpen,
      seatCapacity: num(d.seatCapacity),
      prices: Object.fromEntries(CATEGORIES.map((c) => [c, priceNum(d.prices[c])])) as Record<Category, number>,
      singleSupplement: num(d.singleSupplement),
    })),
  };
}

const priceLabel = (raw: string) => {
  const n = priceNum(raw);
  return Number.isFinite(n) ? formatPHP(n) : '—';
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

type Loaded = { exists: boolean; updatedAtMs: number | null };

export default function TourSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [base, setBase] = useState<TourConfig>(defaultTourConfig);
  const [exists, setExists] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [stale, setStale] = useState(false);

  // 폼을 채운 시점의 서버 상태 / 최신 스냅샷 / 내 저장 직후 스냅샷 흡수 여부
  const loadedRef = useRef<Loaded | null>(null);
  const latestRef = useRef<{ config: TourConfig | null; meta: TourConfigMeta } | null>(null);
  const adoptRef = useRef(false);

  const fill = useCallback((c: TourConfig | null, meta: TourConfigMeta) => {
    const cfg = c ?? defaultTourConfig();
    setForm(toForm(cfg));
    setBase(cfg);
    setExists(c !== null);
    setSavedIds(c?.departures.map((d) => d.id) ?? []);
    setStale(false);
    setErrors({});
    setMessage('');
    loadedRef.current = { exists: c !== null, updatedAtMs: meta.updatedAtMs };
  }, []);

  useEffect(() => {
    const offConfig = subscribeTourConfig(
      (c, meta) => {
        if (meta.pending) return; // 내 쓰기가 아직 서버에 반영되기 전 스냅샷
        latestRef.current = { config: c, meta };
        const loaded = loadedRef.current;
        if (!loaded) {
          fill(c, meta);
          return;
        }
        if (loaded.exists === (c !== null) && loaded.updatedAtMs === meta.updatedAtMs) return;
        if (adoptRef.current && c !== null) {
          // 방금 내가 저장한 결과 — 폼은 그대로 두고 기준만 갱신
          adoptRef.current = false;
          loadedRef.current = { exists: true, updatedAtMs: meta.updatedAtMs };
          return;
        }
        setStale(true);
      },
      () => setLoadError('Could not load tour settings.'),
    );
    const offApps = subscribeApplications(
      (list) => {
        setApps(list);
        setAppsLoaded(true);
      },
      () => setLoadError('Could not load applications.'),
    );
    const offAv = subscribeAvailability(setAvailability);
    return () => {
      offConfig();
      offApps();
      offAv();
    };
  }, [fill]);

  const usage: DepartureUsage = useMemo(() => computeDepartureUsage(apps), [apps]);

  if (loadError) return <p className="admin-card p-6 text-red-600">{loadError}</p>;
  if (!form || !appsLoaded) return <Loader2 aria-label="Loading" className="h-6 w-6 animate-spin text-slate-400" />;

  // 편집하면 이전 저장 결과/오류 표시를 지운다
  const edit = (fn: (f: FormState) => FormState) => {
    setForm(fn(form));
    setErrors({});
    setMessage('');
  };
  const setDep = (i: number, patch: Partial<FormDeparture>) =>
    edit((f) => ({ ...f, departures: f.departures.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  function reload() {
    const latest = latestRef.current;
    if (latest) fill(latest.config, latest.meta);
  }

  async function save() {
    if (!form || !appsLoaded) return;
    if (stale) {
      setMessage(STALE_MESSAGE);
      return;
    }
    const config = toConfig(form, base);
    const { errors: found, warnings } = validateTourConfig(config, usage);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Please fix the highlighted fields.');
      return;
    }
    if (warnings.length > 0 && !window.confirm(`${warnings.join('\n')}\n\nSave anyway?`)) return;
    setSaving(true);
    setMessage('');
    adoptRef.current = true;
    try {
      await saveTourConfig(config, getCurrentUser()?.email ?? 'unknown');
      setSavedIds(config.departures.map((d) => d.id));
      setExists(true);
      setMessage('Saved.');
    } catch (e) {
      console.error(e);
      adoptRef.current = false;
      setMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Tour settings</h1>
        <div className="flex items-center gap-3">
          {message ? <span role="status" className="text-sm font-semibold text-slate-600">{message}</span> : null}
          <button type="button" onClick={() => void save()} disabled={saving} className="admin-btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
      {stale ? (
        <div role="alert" className="admin-card flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <span>{STALE_MESSAGE}</span>
          <button type="button" className="admin-btn-secondary" onClick={reload}>Reload</button>
        </div>
      ) : null}
      {!exists ? <p className="admin-card p-4 text-sm text-amber-800">Not set up yet — fill in and save.</p> : null}

      <section className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-slate-900 sm:col-span-2">Applications</h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5" checked={form.acceptingApplications} onChange={(e) => edit((f) => ({ ...f, acceptingApplications: e.target.checked }))} />
          Accepting applications on the website
        </label>
        <Field label="Deposit per traveler (PHP)" error={errors.depositPerPax}>
          <input className="admin-input" inputMode="numeric" value={form.depositPerPax} onChange={(e) => edit((f) => ({ ...f, depositPerPax: e.target.value }))} />
        </Field>
        <Field label={`Race bibs (used ${availability?.bibsUsed ?? 0})`} error={errors['bibQuota.total']}>
          <input className="admin-input" inputMode="numeric" value={form.bibTotal} onChange={(e) => edit((f) => ({ ...f, bibTotal: e.target.value }))} />
        </Field>
        <Field label="Maya payment link (optional)" error={errors.mayaPaymentLinkBase}>
          <input className="admin-input" placeholder="https://mymaya.me/yourstore" value={form.maya} onChange={(e) => edit((f) => ({ ...f, maya: e.target.value }))} />
        </Field>
        <Field label="Staff notification emails (one per line)" error={errors.notifyEmails}>
          <textarea className="admin-input" rows={3} value={form.emails} onChange={(e) => edit((f) => ({ ...f, emails: e.target.value }))} />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Departures</h2>
          <button type="button" className="admin-btn-secondary" onClick={() => edit((f) => ({ ...f, departures: [...f.departures, toFormDeparture(newDeparture())] }))}>
            <Plus className="h-4 w-4" /> Add departure
          </button>
        </div>
        {errors['departures.removed'] ? (
          <p role="alert" className="admin-card p-4 text-sm font-semibold text-red-600">{errors['departures.removed']}</p>
        ) : null}
        {form.departures.map((d, i) => {
          const p = `departures.${i}`;
          const locked = savedIds.includes(d.id) && d.id !== '';
          const removable = canRemoveDeparture(usage, d.id);
          return (
            <div key={i} className="admin-card grid gap-4 p-6 sm:grid-cols-3">
              <Field label="ID" error={errors[`${p}.id`]}>
                <input className="admin-input" value={d.id} readOnly={locked} onChange={(e) => setDep(i, { id: e.target.value.trim().toLowerCase() })} />
              </Field>
              <Field label="Label" error={errors[`${p}.label`]}>
                <input className="admin-input" value={d.label} onChange={(e) => setDep(i, { label: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-800">
                <input type="checkbox" className="h-5 w-5" checked={d.isOpen} onChange={(e) => setDep(i, { isOpen: e.target.checked })} /> Open for applications
              </label>
              <Field label="Depart" error={errors[`${p}.departDate`]}>
                <input type="date" className="admin-input" value={d.departDate} onChange={(e) => setDep(i, { departDate: e.target.value })} />
              </Field>
              <Field label="Return" error={errors[`${p}.returnDate`]}>
                <input type="date" className="admin-input" value={d.returnDate} onChange={(e) => setDep(i, { returnDate: e.target.value })} />
              </Field>
              <Field label={`Seats (taken ${usage[d.id]?.seatsUsed ?? 0})`} error={errors[`${p}.seatCapacity`]}>
                <input className="admin-input" inputMode="numeric" value={d.seatCapacity} onChange={(e) => setDep(i, { seatCapacity: e.target.value })} />
              </Field>
              {CATEGORIES.map((k) => (
                <Field key={k} label={`${PRICE_FIELD_LABELS[k]} price (PHP)`} error={errors[`${p}.prices.${k}`]}>
                  <input className="admin-input" inputMode="numeric" value={d.prices[k]} onChange={(e) => setDep(i, { prices: { ...d.prices, [k]: e.target.value } })} />
                </Field>
              ))}
              <Field label="Single room supplement (PHP)" error={errors[`${p}.singleSupplement`]}>
                <input className="admin-input" inputMode="numeric" value={d.singleSupplement} onChange={(e) => setDep(i, { singleSupplement: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Flight info (shown on the Tour page)">
                  <textarea className="admin-input" rows={2} value={d.flightInfo} onChange={(e) => setDep(i, { flightInfo: e.target.value })} />
                </Field>
              </div>
              <div className="flex items-start justify-between gap-3 sm:col-span-3">
                <p className="text-xs text-slate-500">
                  Prices: {CATEGORIES.map((k) => `${CATEGORY_SHORT_LABELS[k]} ${priceLabel(d.prices[k])}`).join(' / ')}
                </p>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    className="admin-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!removable}
                    aria-label={`Remove departure ${d.label || d.id}`}
                    title={removable ? 'Remove departure' : IN_USE_HINT}
                    onClick={() => edit((f) => ({ ...f, departures: f.departures.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                  {!removable ? <p className="text-xs text-slate-500">{IN_USE_HINT}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
