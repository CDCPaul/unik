'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { formatPHP, totalPax } from '@unik/shared/domain';
import type { Availability, Departure, TourConfig } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { parseAmount } from '@/lib/admin/edits';
import { canRemoveDeparture, defaultTourConfig, newDeparture, validateTourConfig } from '@/lib/admin/tourSettings';
import type { DepartureUsage } from '@/lib/admin/tourSettings';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { saveTourConfig, subscribeAvailability, subscribeTourConfig } from '@/lib/services/admin/tourConfig';

const num = (raw: string): number => (raw.trim() === '' || raw.trim() === '0' ? 0 : parseAmount(raw) ?? NaN);

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

export default function TourSettingsPage() {
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [exists, setExists] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const offConfig = subscribeTourConfig(
      (c) => {
        // 편집 중 덮어쓰지 않도록 최초 1회만 채운다
        setConfig((prev) => prev ?? c ?? defaultTourConfig());
        setExists(c !== null);
        setSavedIds(c?.departures.map((d) => d.id) ?? []);
      },
      () => setLoadError('Could not load tour settings.'),
    );
    const offApps = subscribeApplications(setApps, () => setLoadError('Could not load applications.'));
    const offAv = subscribeAvailability(setAvailability);
    return () => {
      offConfig();
      offApps();
      offAv();
    };
  }, []);

  const usage: DepartureUsage = useMemo(() => {
    const u: DepartureUsage = {};
    for (const a of apps) {
      if (a.status === 'cancelled') continue;
      const e = (u[a.departure.id] ??= { seatsUsed: 0, applications: 0 });
      e.applications += 1;
      if (a.status !== 'waitlist') e.seatsUsed += totalPax(a.counts);
    }
    return u;
  }, [apps]);

  if (loadError) return <p className="admin-card p-6 text-red-600">{loadError}</p>;
  if (!config) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;

  const setDep = (i: number, patch: Partial<Departure>) =>
    setConfig({ ...config, departures: config.departures.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  async function save() {
    if (!config) return;
    const { errors: found, warnings } = validateTourConfig(config, usage);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Please fix the highlighted fields.');
      return;
    }
    if (warnings.length > 0 && !window.confirm(`${warnings.join('\n')}\n\nSave anyway?`)) return;
    setSaving(true);
    setMessage('');
    try {
      await saveTourConfig(config, getCurrentUser()?.email ?? 'unknown');
      setSavedIds(config.departures.map((d) => d.id));
      setExists(true);
      setMessage('Saved.');
    } catch (e) {
      console.error(e);
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
      {!exists ? <p className="admin-card p-4 text-sm text-amber-800">Not set up yet — fill in and save.</p> : null}

      <section className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-slate-900 sm:col-span-2">Applications</h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5" checked={config.acceptingApplications} onChange={(e) => setConfig({ ...config, acceptingApplications: e.target.checked })} />
          Accepting applications on the website
        </label>
        <Field label="Deposit per traveler (PHP)" error={errors.depositPerPax}>
          <input className="admin-input" inputMode="numeric" value={String(config.depositPerPax)} onChange={(e) => setConfig({ ...config, depositPerPax: num(e.target.value) })} />
        </Field>
        <Field label={`Race bibs (used ${availability?.bibsUsed ?? 0})`} error={errors['bibQuota.total']}>
          <input className="admin-input" inputMode="numeric" value={String(config.bibQuota.total)} onChange={(e) => setConfig({ ...config, bibQuota: { total: num(e.target.value) } })} />
        </Field>
        <Field label="Maya payment link (optional)" error={errors.mayaPaymentLinkBase}>
          <input className="admin-input" placeholder="https://mymaya.me/yourstore" value={config.mayaPaymentLinkBase ?? ''} onChange={(e) => setConfig({ ...config, mayaPaymentLinkBase: e.target.value })} />
        </Field>
        <Field label="Staff notification emails (one per line)" error={errors.notifyEmails}>
          <textarea className="admin-input" rows={3} value={config.notifyEmails.join('\n')} onChange={(e) => setConfig({ ...config, notifyEmails: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) })} />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Departures</h2>
          <button type="button" className="admin-btn-secondary" onClick={() => setConfig({ ...config, departures: [...config.departures, newDeparture()] })}>
            <Plus className="h-4 w-4" /> Add departure
          </button>
        </div>
        {errors['departures.removed'] ? (
          <p role="alert" className="admin-card p-4 text-sm font-semibold text-red-600">{errors['departures.removed']}</p>
        ) : null}
        {config.departures.map((d, i) => {
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
                <input className="admin-input" inputMode="numeric" value={String(d.seatCapacity)} onChange={(e) => setDep(i, { seatCapacity: num(e.target.value) })} />
              </Field>
              {(['full', 'tenK', 'companion'] as const).map((k) => (
                <Field key={k} label={`${k === 'full' ? 'Full marathon' : k === 'tenK' ? '10K' : 'Companion'} price (PHP)`} error={errors[`${p}.prices.${k}`]}>
                  <input className="admin-input" inputMode="numeric" value={String(d.prices[k])} onChange={(e) => setDep(i, { prices: { ...d.prices, [k]: num(e.target.value) } })} />
                </Field>
              ))}
              <Field label="Single room supplement (PHP)" error={errors[`${p}.singleSupplement`]}>
                <input className="admin-input" inputMode="numeric" value={String(d.singleSupplement)} onChange={(e) => setDep(i, { singleSupplement: num(e.target.value) })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Flight info (shown on the Tour page)">
                  <textarea className="admin-input" rows={2} value={d.flightInfo} onChange={(e) => setDep(i, { flightInfo: e.target.value })} />
                </Field>
              </div>
              <div className="flex items-end justify-between gap-3 sm:col-span-3">
                <p className="text-xs text-slate-500">
                  Prices: {formatPHP(Number.isFinite(d.prices.full) ? d.prices.full : 0)} / {formatPHP(Number.isFinite(d.prices.tenK) ? d.prices.tenK : 0)} / {formatPHP(Number.isFinite(d.prices.companion) ? d.prices.companion : 0)}
                </p>
                <button
                  type="button"
                  className="admin-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!removable}
                  title={removable ? 'Remove departure' : 'Has applications — close it instead (untick Open).'}
                  onClick={() => setConfig({ ...config, departures: config.departures.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
