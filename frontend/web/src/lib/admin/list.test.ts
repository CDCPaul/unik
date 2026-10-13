import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, computeKpis, filterApplications, promoStats, statusCounts } from './list';
import type { ApplicationRecord } from './applicationDoc';

function app(over: Partial<ApplicationRecord>): ApplicationRecord {
  return {
    id: over.appNo ?? 'x',
    appNo: 'APP-0000',
    status: 'new',
    departure: { id: 'mnl', label: 'Manila', departDate: '', returnDate: '' },
    lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: false, whatsapp: false },
    counts: { full: 1, tenK: 0, companion: 0 },
    travelers: [{ category: 'full' }],
    completeness: { filled: 8, total: 8 },
    pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: null, total: 80000, depositDue: 10000 },
    payments: [],
    paidTotal: 0,
    specialRequests: null,
    staffNotes: null,
    statusHistory: [],
    createdAt: new Date('2026-10-19T00:00:00Z'),
    notifications: null,
    ...over,
  };
}
const promo = (code: string, discountTotal = 2000) => ({ code, agencyName: code, type: 'fixed' as const, value: 2000, discountTotal });

const apps = [
  app({ id: 'a1', appNo: 'APP-0001', createdAt: new Date('2026-10-19T00:00:00Z') }),
  app({ id: 'a2', appNo: 'APP-0002', status: 'confirmed', counts: { full: 2, tenK: 0, companion: 1 }, pricing: { lines: [], singleSupplements: 0, subtotal: 230000, promo: promo('TA-A', 6000), total: 224000, depositDue: 30000 }, createdAt: new Date('2026-10-20T00:00:00Z') }),
  app({ id: 'a3', appNo: 'APP-0003', status: 'cancelled', pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: promo('TA-A'), total: 78000, depositDue: 10000 }, createdAt: new Date('2026-10-21T00:00:00Z') }),
  app({ id: 'a4', appNo: 'APP-0004', departure: { id: 'ceb', label: 'Cebu', departDate: '', returnDate: '' }, completeness: { filled: 2, total: 8 }, lead: { firstName: 'José', lastName: 'Reyes', email: 'jose@x.com', phoneDial: '+63', phoneNumber: '0918 000 1111', viber: false, whatsapp: true }, createdAt: new Date('2026-10-22T00:00:00Z') }),
];

describe('filterApplications', () => {
  it('sorts newest first by default', () => {
    expect(filterApplications(apps, DEFAULT_FILTERS).map((a) => a.appNo)).toEqual(['APP-0004', 'APP-0003', 'APP-0002', 'APP-0001']);
  });
  it('filters by status, departure, promo, direct and incomplete', () => {
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, status: 'confirmed' }).map((a) => a.id)).toEqual(['a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, departureId: 'ceb' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, promo: 'TA-A' }).map((a) => a.id)).toEqual(['a3', 'a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, promo: 'direct' }).map((a) => a.id)).toEqual(['a4', 'a1']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, incompleteOnly: true }).map((a) => a.id)).toEqual(['a4']);
  });
  it('searches app number, name, email and phone digits, accent-insensitive', () => {
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'app-0002' }).map((a) => a.id)).toEqual(['a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'jose reyes' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: '09180001111' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'JOSE@X' }).map((a) => a.id)).toEqual(['a4']);
  });
});

describe('statusCounts / computeKpis', () => {
  it('counts each status and all', () => {
    const c = statusCounts(apps);
    expect(c.all).toBe(4);
    expect(c.new).toBe(2);
    expect(c.cancelled).toBe(1);
    expect(c.waitlist).toBe(0);
  });
  it('excludes cancelled from KPIs', () => {
    expect(computeKpis(apps)).toEqual({
      applications: 3,
      travelers: 5,
      byCategory: { full: 4, tenK: 0, companion: 1 },
      confirmedTravelers: 3,
      incomplete: 1,
    });
  });
});

describe('promoStats', () => {
  it('aggregates per code excluding cancelled; sales and discounts count confirmed only', () => {
    expect(promoStats(apps)).toEqual({
      'TA-A': { applications: 1, pax: 3, confirmedPax: 3, netSales: 224000, discountTotal: 6000 },
    });
  });
});
