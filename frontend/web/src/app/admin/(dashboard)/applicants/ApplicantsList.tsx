'use client';

import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { APPLICATION_STATUSES, CATEGORIES, formatPHP } from '@unik/shared/domain';
import type { ApplicationStatus, TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { applicationsCsv, downloadCsv, travelersCsv } from '@/lib/admin/csv';
import { CATEGORY_SHORT_KEYS, STATUS_BADGE, STATUS_KEYS, countsMessages, formatManila } from '@/lib/admin/format';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { MessageKey } from '@/lib/admin/i18n/translate';
import { DEFAULT_FILTERS, computeKpis, filterApplications, statusCounts } from '@/lib/admin/list';
import type { ListFilters } from '@/lib/admin/list';

export function ApplicantsList({
  apps,
  config,
  selectedId,
  onSelect,
}: {
  apps: ApplicationRecord[];
  config: TourConfig | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useAdminT();
  const [filters, setFilters] = useState<ListFilters>(DEFAULT_FILTERS);
  const filtered = useMemo(() => filterApplications(apps, filters), [apps, filters]);
  const counts = useMemo(() => statusCounts(apps), [apps]);
  const kpi = useMemo(() => computeKpis(apps), [apps]);
  const departureOptions = useMemo(() => {
    const m = new Map<string, string>();
    config?.departures.forEach((d) => m.set(d.id, d.label));
    apps.forEach((a) => m.has(a.departure.id) || m.set(a.departure.id, a.departure.label || a.departure.id));
    return [...m.entries()];
  }, [apps, config]);
  const promoOptions = useMemo(() => [...new Set(apps.map((a) => a.pricing.promo?.code).filter(Boolean) as string[])].sort(), [apps]);
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const set = <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const kpis: [MessageKey, string, string?][] = [
    ['applicants.kpi.applications', String(kpi.applications)],
    ['applicants.kpi.travelers', String(kpi.travelers), CATEGORIES.map((c) => t('counts.itemShort', { n: kpi.byCategory[c], category: { key: CATEGORY_SHORT_KEYS[c] } })).join(' · ')],
    [
      'applicants.kpi.confirmedRunners',
      String(kpi.confirmedRunners),
      config
        ? t('applicants.kpi.confirmedTravelersOfBibs', { n: kpi.confirmedTravelers, total: config.bibQuota.total })
        : t('applicants.kpi.confirmedTravelers', { n: kpi.confirmedTravelers }),
    ],
    ['applicants.kpi.missingInfo', String(kpi.incomplete), t('applicants.kpi.missingInfoSub')],
  ];
  const columns: MessageKey[] = ['applicants.col.appNo', 'applicants.col.lead', 'applicants.col.departure', 'applicants.col.pax', 'applicants.col.promo', 'applicants.col.total', 'applicants.col.paid', 'applicants.col.info', 'applicants.col.status'];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.applicants')}</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn-secondary" onClick={() => downloadCsv(`applications-${today}.csv`, applicationsCsv(filtered))}><Download className="h-4 w-4" /> {t('applicants.exportApplications')}</button>
          <button type="button" className="admin-btn-secondary" onClick={() => downloadCsv(`travelers-${today}.csv`, travelersCsv(filtered))}><Download className="h-4 w-4" /> {t('applicants.exportTravelers')}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <div key={label} className="admin-card p-4">
            <p className="text-xs font-semibold text-slate-500">{t(label)}</p>
            <p className={`text-2xl font-bold ${label === 'applicants.kpi.missingInfo' && kpi.incomplete > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
            {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('applicants.statusFilter')}>
        {(['all', ...APPLICATION_STATUSES] as (ApplicationStatus | 'all')[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filters.status === s}
            onClick={() => set('status', s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${filters.status === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            {s === 'all' ? t('common.all') : t(STATUS_KEYS[s])} {counts[s]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">{t('applicants.filter.departure')}
          <select className="admin-input !w-auto !py-1.5" value={filters.departureId} onChange={(e) => set('departureId', e.target.value)}>
            <option value="all">{t('common.all')}</option>
            {departureOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">{t('applicants.filter.promo')}
          <select className="admin-input !w-auto !py-1.5" value={filters.promo} onChange={(e) => set('promo', e.target.value)}>
            <option value="all">{t('common.all')}</option>
            <option value="direct">{t('applicants.filter.direct')}</option>
            {promoOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="h-4 w-4" checked={filters.incompleteOnly} onChange={(e) => set('incompleteOnly', e.target.checked)} /> {t('applicants.filter.missingOnly')}</label>
        <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" aria-label={t('applicants.search')} placeholder={t('applicants.searchPlaceholder')} className="admin-input !pl-9 !py-1.5" value={filters.search} onChange={(e) => set('search', e.target.value)} />
        </div>
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>{columns.map((h) => <th key={h} className="admin-table-header">{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={9} className="admin-table-cell text-slate-500">{t('applicants.noMatch')}</td></tr> : null}
            {filtered.map((a) => {
              const complete = a.completeness.filled >= a.completeness.total;
              return (
                <tr key={a.id} onClick={() => onSelect(a.id)} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selectedId === a.id ? 'bg-blue-50' : ''}`}>
                  <td className="admin-table-cell"><button type="button" data-app-id={a.id} aria-current={selectedId === a.id ? 'true' : undefined} className="font-bold text-slate-900 underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); onSelect(a.id); }}>{a.appNo}</button></td>
                  <td className="admin-table-cell"><div className="font-semibold">{a.lead.firstName} {a.lead.lastName}</div><div className="text-xs text-slate-500">{formatManila(a.createdAt)}</div></td>
                  <td className="admin-table-cell">{a.departure.id.toUpperCase()}</td>
                  <td className="admin-table-cell" title={countsMessages(a.counts).map((m) => t(m)).join(', ')}>{CATEGORIES.map((c) => a.counts[c]).join(' / ')}</td>
                  <td className="admin-table-cell">{a.pricing.promo?.code ?? t('common.direct')}</td>
                  <td className="admin-table-cell">{formatPHP(a.pricing.total)}</td>
                  <td className="admin-table-cell">{formatPHP(a.paidTotal)}</td>
                  <td className={`admin-table-cell font-semibold ${complete ? 'text-green-700' : 'text-amber-700'}`}>{a.completeness.filled}/{a.completeness.total}</td>
                  <td className="admin-table-cell"><span className={`admin-badge ${STATUS_BADGE[a.status]}`}>{t(STATUS_KEYS[a.status])}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
