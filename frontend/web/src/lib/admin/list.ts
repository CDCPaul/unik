import { APPLICATION_STATUSES, totalPax } from '@unik/shared/domain';
import type { ApplicationStatus, Counts } from '@unik/shared/domain';
import type { ApplicationRecord } from './applicationDoc';

export const CONFIRMED_STATUSES: readonly ApplicationStatus[] = ['deposit_paid', 'fully_paid', 'confirmed'];

export interface ListFilters {
  status: ApplicationStatus | 'all';
  departureId: string; // 'all' | departure id
  promo: string; // 'all' | 'direct' | code
  incompleteOnly: boolean;
  search: string;
}

export const DEFAULT_FILTERS: ListFilters = { status: 'all', departureId: 'all', promo: 'all', incompleteOnly: false, search: '' };

// 결합 발음 구별 기호(U+0300–U+036F) 제거 후 소문자화
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function matchesSearch(a: ApplicationRecord, raw: string): boolean {
  const q = fold(raw.trim());
  if (!q) return true;
  const hay = fold(`${a.appNo} ${a.lead.firstName} ${a.lead.lastName} ${a.lead.email}`);
  if (hay.includes(q)) return true;
  // 전화번호 검색: 숫자만, 앞자리 0 제거 후 6자리 이상일 때만 (짧은 숫자가 엉뚱한 번호에 걸리지 않게)
  const digits = q.replace(/\D/g, '').replace(/^0+/, '');
  return digits.length >= 6 && `${a.lead.phoneDial}${a.lead.phoneNumber}`.replace(/\D/g, '').includes(digits);
}

export function filterApplications(apps: ApplicationRecord[], f: ListFilters): ApplicationRecord[] {
  return apps
    .filter((a) => f.status === 'all' || a.status === f.status)
    .filter((a) => f.departureId === 'all' || a.departure.id === f.departureId)
    .filter((a) => {
      const code = a.pricing.promo?.code ?? null;
      if (f.promo === 'all') return true;
      if (f.promo === 'direct') return code === null;
      return code === f.promo;
    })
    .filter((a) => !f.incompleteOnly || a.completeness.filled < a.completeness.total)
    .filter((a) => matchesSearch(a, f.search))
    .sort((x, y) => (y.createdAt?.getTime() ?? 0) - (x.createdAt?.getTime() ?? 0));
}

export function statusCounts(apps: ApplicationRecord[]): Record<ApplicationStatus | 'all', number> {
  const out = Object.fromEntries([['all', apps.length], ...APPLICATION_STATUSES.map((s) => [s, 0])]) as Record<ApplicationStatus | 'all', number>;
  for (const a of apps) out[a.status] += 1;
  return out;
}

export function computeKpis(apps: ApplicationRecord[]) {
  const active = apps.filter((a) => a.status !== 'cancelled');
  const byCategory: Counts = { full: 0, tenK: 0, companion: 0 };
  for (const a of active) {
    byCategory.full += a.counts.full;
    byCategory.tenK += a.counts.tenK;
    byCategory.companion += a.counts.companion;
  }
  return {
    applications: active.length,
    travelers: totalPax(byCategory),
    byCategory,
    confirmedTravelers: active.filter((a) => CONFIRMED_STATUSES.includes(a.status)).reduce((s, a) => s + totalPax(a.counts), 0),
    incomplete: active.filter((a) => a.completeness.filled < a.completeness.total).length,
  };
}

export interface PromoStat {
  applications: number;
  pax: number;
  confirmedPax: number;
  netSales: number;
  discountTotal: number;
}

export function promoStats(apps: ApplicationRecord[]): Record<string, PromoStat> {
  const out: Record<string, PromoStat> = {};
  for (const a of apps) {
    const code = a.pricing.promo?.code;
    if (!code || a.status === 'cancelled') continue;
    const s = (out[code] ??= { applications: 0, pax: 0, confirmedPax: 0, netSales: 0, discountTotal: 0 });
    s.applications += 1;
    s.pax += totalPax(a.counts);
    if (CONFIRMED_STATUSES.includes(a.status)) {
      s.confirmedPax += totalPax(a.counts);
      s.netSales += a.pricing.total;
      s.discountTotal += a.pricing.promo?.discountTotal ?? 0;
    }
  }
  return out;
}
