import { describe, expect, it } from 'vitest';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';
import { applyPayment, normalizeLead, parseAmount, recalculate, statusChangeWarnings, validateLead, validateTravelers, withoutPayment } from './edits';

const config: TourConfig = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [{ id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: '', seatCapacity: 120, isOpen: false, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 }],
};

const app: ApplicationRecord = {
  id: 'a1',
  appNo: 'APP-0001',
  status: 'contacted',
  departure: { id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23' },
  lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
  counts: { full: 1, tenK: 0, companion: 0 },
  travelers: [{ category: 'full', passportName: 'SANTOS MARIA' }],
  completeness: { filled: 1, total: 8 },
  pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: { code: 'TA-OLD', agencyName: 'Old', type: 'fixed', value: 2000, discountTotal: 2000 }, total: 78000, depositDue: 10000 },
  payments: [],
  paidTotal: 0,
  specialRequests: null,
  staffNotes: null,
  statusHistory: [],
  createdAt: null,
  notifications: null,
};

const pay = (over: Partial<PaymentRecord> = {}): PaymentRecord => ({ id: 'p1', type: 'deposit', method: 'maya_qr', amount: 10000, paidAt: new Date('2026-10-20T00:00:00Z'), recordedBy: 's@cebudirectclub.com', ...over });

describe('recalculate', () => {
  it('keeps the original promo terms when counts change, even if the departure is now closed', () => {
    const r = recalculate(app, { counts: { full: 1, tenK: 0, companion: 1 } }, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.travelers).toEqual([{ category: 'full', passportName: 'SANTOS MARIA' }, { category: 'companion' }]);
    expect(r.pricing.promo).toMatchObject({ code: 'TA-OLD', discountTotal: 4000 });
    expect(r.pricing.total).toBe(146000);
    expect(r.pricing.depositDue).toBe(20000);
    expect(r.completeness).toEqual({ filled: 1, total: 14 });
  });
  it('reprices single supplements when a traveler room changes', () => {
    const r = recalculate(app, { travelers: [{ category: 'full', room: 'single' }] }, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.pricing.singleSupplements).toBe(15000);
  });
  it('rejects invalid counts and a departure missing from settings', () => {
    expect(recalculate(app, { counts: { full: 0, tenK: 0, companion: 0 } }, config)).toEqual({ error: 'At least one traveler is required' });
    expect(recalculate(app, { counts: { full: 2, tenK: 0, companion: 0 } }, { ...config, departures: [] })).toMatchObject({ error: expect.stringContaining('tour settings') });
    expect(recalculate(app, { counts: { full: 2, tenK: 0, companion: 0 } }, null)).toMatchObject({ error: expect.any(String) });
  });
});

describe('parseAmount', () => {
  it('accepts formatted whole pesos', () => {
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('₱10,000')).toBe(10000);
    expect(parseAmount('PHP 2 500')).toBe(2500);
  });
  it('rejects decimals, zero, negatives and junk', () => {
    expect(parseAmount('10000.50')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});

describe('payments', () => {
  it('suggests deposit_paid when the deposit is reached', () => {
    expect(applyPayment(app, pay())).toMatchObject({ paidTotal: 10000, suggestedStatus: 'deposit_paid' });
  });
  it('suggests fully_paid when the total is reached', () => {
    const r = applyPayment({ ...app, status: 'deposit_paid', payments: [pay()], paidTotal: 10000 }, pay({ id: 'p2', type: 'balance', amount: 68000 }));
    expect(r).toMatchObject({ paidTotal: 78000, suggestedStatus: 'fully_paid' });
  });
  it('does not suggest a downgrade or touch cancelled/confirmed', () => {
    expect(applyPayment({ ...app, status: 'confirmed' }, pay()).suggestedStatus).toBeNull();
    expect(applyPayment({ ...app, status: 'cancelled' }, pay()).suggestedStatus).toBeNull();
    expect(applyPayment(app, pay({ amount: 5000 })).suggestedStatus).toBeNull();
  });
  it('removes a payment and recomputes the total', () => {
    const withTwo = { ...app, payments: [pay(), pay({ id: 'p2', amount: 3000 })], paidTotal: 13000 };
    expect(withoutPayment(withTwo, 'p1')).toEqual({ payments: [pay({ id: 'p2', amount: 3000 })], paidTotal: 3000 });
  });
});

describe('statusChangeWarnings', () => {
  it('warns when confirming with missing traveler info or unpaid balance', () => {
    expect(statusChangeWarnings(app, 'confirmed')).toEqual([
      'Traveler details are incomplete (1/8).',
      'Only PHP 0 of PHP 78,000 has been recorded as paid.',
    ]);
    expect(statusChangeWarnings({ ...app, completeness: { filled: 8, total: 8 }, paidTotal: 78000 }, 'confirmed')).toEqual([]);
    expect(statusChangeWarnings(app, 'contacted')).toEqual([]);
  });
});

describe('lead and traveler edits', () => {
  it('normalizes email and phone', () => {
    expect(normalizeLead({ ...app.lead, email: '  Maria@Example.COM ', phoneNumber: '(0917) 123-4567' })).toMatchObject({ email: 'maria@example.com', phoneNumber: '0917 123-4567' });
  });
  it('validates lead fields with the shared rules', () => {
    expect(validateLead(app.lead)).toEqual({});
    expect(Object.keys(validateLead({ ...app.lead, firstName: '', email: 'x', phoneNumber: '12' })).sort()).toEqual(['lead.email', 'lead.firstName', 'lead.phoneNumber']);
  });
  it('validates only filled traveler fields', () => {
    expect(validateTravelers([{ category: 'full' }], '2026-10-20')).toEqual({});
    expect(validateTravelers([{ category: 'full', passportName: 'www.x.com', dob: '2027-02-30' }], '2026-10-20')).toEqual({
      'travelers.0.passportName': expect.any(String),
      'travelers.0.dob': expect.any(String),
    });
  });
});
