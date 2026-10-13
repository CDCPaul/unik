import { describe, expect, it } from 'vitest';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';
import { applyPayment, normalizeLead, parseAmount, planCountsApply, planTravelersSave, recalculate, repriceForTravelers, paidTotalOf, statusChangeWarnings, validateLead, validateTravelers, voidPayment } from './edits';

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
  it('keeps the original per-traveler deposit when the current config deposit changes', () => {
    const r = recalculate(app, { counts: { full: 1, tenK: 0, companion: 1 } }, { ...config, depositPerPax: 15000 });
    if ('error' in r) throw new Error(r.error);
    expect(r.pricing.depositDue).toBe(20000);
  });
  it('warns when a paid-up application now totals more than was paid', () => {
    const grown = { counts: { full: 1, tenK: 0, companion: 1 } };
    const paid: ApplicationRecord = { ...app, status: 'fully_paid', paidTotal: 78000 };
    const r = recalculate(paid, grown, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.warnings).toEqual(['New total PHP 146,000 is more than the PHP 78,000 paid — review the status.']);
    const confirmed: ApplicationRecord = { ...app, status: 'confirmed', paidTotal: 78000 };
    const c = recalculate(confirmed, grown, config);
    if ('error' in c) throw new Error(c.error);
    expect(c.warnings).toHaveLength(1);
  });
  it('gives no warning for an unpaid application', () => {
    const r = recalculate(app, { counts: { full: 1, tenK: 0, companion: 1 } }, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.warnings).toEqual([]);
  });
});

describe('repriceForTravelers', () => {
  const snap: ApplicationRecord = {
    ...app,
    counts: { full: 2, tenK: 0, companion: 0 },
    travelers: [{ category: 'full', passportName: 'A', room: 'twin' }, { category: 'full', room: 'twin' }],
    pricing: {
      lines: [{ category: 'full', qty: 2, unitPrice: 70000, amount: 140000 }],
      singleSupplements: 0,
      subtotal: 140000,
      promo: { code: 'TA-OLD', agencyName: 'Old', type: 'fixed', value: 2000, discountTotal: 4000 },
      total: 136000,
      depositDue: 20000,
    },
  };
  const changed: TourConfig = { ...config, depositPerPax: 99999, departures: [{ ...config.departures[0], prices: { full: 90000, tenK: 85000, companion: 80000 } }] };
  it('keeps snapshot pricing for a name-only edit even when config prices changed', () => {
    const r = repriceForTravelers(snap, [{ category: 'full', passportName: 'A EDITED', room: 'twin' }, { category: 'full', room: 'twin' }], changed);
    if ('error' in r) throw new Error(r.error);
    expect(r.pricing).toEqual(snap.pricing);
    expect(r.travelers[0].passportName).toBe('A EDITED');
  });
  it('only moves single supplements/subtotal/total when a room becomes single', () => {
    const r = repriceForTravelers(snap, [{ category: 'full', room: 'single' }, { category: 'full', room: 'twin' }], changed);
    if ('error' in r) throw new Error(r.error);
    expect(r.pricing.lines).toEqual(snap.pricing.lines);
    expect(r.pricing.promo).toEqual(snap.pricing.promo);
    expect(r.pricing.singleSupplements).toBe(15000);
    expect(r.pricing.subtotal).toBe(155000);
    expect(r.pricing.total).toBe(151000);
    expect(r.pricing.depositDue).toBe(20000);
  });
  it('still saves when the departure was removed, using the existing per-single amount', () => {
    const withSingle: ApplicationRecord = {
      ...snap,
      travelers: [{ category: 'full', room: 'single' }, { category: 'full', room: 'twin' }],
      pricing: { ...snap.pricing, singleSupplements: 12000, subtotal: 152000, total: 148000 },
    };
    const gone = { ...config, departures: [] };
    const two = repriceForTravelers(withSingle, [{ category: 'full', room: 'single' }, { category: 'full', room: 'single' }], gone);
    if ('error' in two) throw new Error(two.error);
    expect(two.pricing.singleSupplements).toBe(24000);
    expect(two.pricing.total).toBe(160000);
    const none = repriceForTravelers(snap, [{ category: 'full', room: 'single' }, { category: 'full' }], gone);
    if ('error' in none) throw new Error(none.error);
    expect(none.pricing.singleSupplements).toBe(0);
    expect(none.pricing).toEqual(snap.pricing);
  });
  it('warns like recalculate when a paid-up application now totals more than was paid', () => {
    const paid: ApplicationRecord = { ...snap, status: 'fully_paid', paidTotal: 136000 };
    const r = repriceForTravelers(paid, [{ category: 'full', room: 'single' }, { category: 'full', room: 'twin' }], config);
    if ('error' in r) throw new Error(r.error);
    expect(r.warnings).toHaveLength(1);
  });
});

describe('transactional plans', () => {
  const two: ApplicationRecord = {
    ...app,
    counts: { full: 2, tenK: 0, companion: 0 },
    travelers: [{ category: 'full', passportName: 'A' }, { category: 'full', passportName: 'B' }],
    pricing: { lines: [{ category: 'full', qty: 2, unitPrice: 80000, amount: 160000 }], singleSupplements: 0, subtotal: 160000, promo: null, total: 160000, depositDue: 20000 },
  };
  const baseT = two.travelers;
  it('merges traveler edits onto the live doc without repricing and keeps other staff edits', () => {
    const live: ApplicationRecord = { ...two, travelers: [{ category: 'full', passportName: 'A', nationality: 'Filipino' }, { category: 'full', passportName: 'B' }] };
    const plan = planTravelersSave(live, two.counts, baseT, [{ category: 'full', passportName: 'A' }, { category: 'full', passportName: 'B2' }], { ...config, departures: [{ ...config.departures[0], prices: { full: 1, tenK: 1, companion: 1 } }] });
    if (!('fields' in plan)) throw new Error('expected fields');
    expect(plan.fields.travelers).toEqual([{ category: 'full', passportName: 'A', nationality: 'Filipino' }, { category: 'full', passportName: 'B2' }]);
    expect(plan.fields.pricing).toEqual(two.pricing);
  });
  it('conflicts when counts changed live or the same field changed', () => {
    expect(planTravelersSave({ ...two, counts: { full: 3, tenK: 0, companion: 0 } }, two.counts, baseT, baseT, config)).toEqual({ conflict: true });
    const live: ApplicationRecord = { ...two, travelers: [{ category: 'full', passportName: 'A LIVE' }, two.travelers[1]] };
    expect(planTravelersSave(live, two.counts, baseT, [{ category: 'full', passportName: 'A DRAFT' }, two.travelers[1]], config)).toEqual({ conflict: true });
  });
  it('applies counts only when the live counts still equal the base counts', () => {
    const plan = planCountsApply(two, two.counts, { full: 2, tenK: 0, companion: 1 }, config);
    if (!('fields' in plan)) throw new Error('expected fields');
    expect(plan.fields).toMatchObject({ counts: { full: 2, tenK: 0, companion: 1 }, pricing: { total: 230000 } });
    expect(planCountsApply({ ...two, counts: { full: 1, tenK: 0, companion: 0 } }, two.counts, { full: 2, tenK: 0, companion: 1 }, config)).toEqual({ conflict: true });
    expect(planCountsApply(two, two.counts, { full: 0, tenK: 0, companion: 0 }, config)).toMatchObject({ error: expect.any(String) });
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
  it('accepts only plain digits or properly grouped thousands', () => {
    expect(parseAmount('10,50')).toBeNull();
    expect(parseAmount('1,5')).toBeNull();
    expect(parseAmount('10php00')).toBeNull();
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('007')).toBe(7);
  });
  it('rejects amounts above 10,000,000', () => {
    expect(parseAmount('10000001')).toBeNull();
    expect(parseAmount('10,000,000')).toBe(10000000);
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
  it('never suggests a status for a waitlisted application', () => {
    expect(applyPayment({ ...app, status: 'waitlist' }, pay()).suggestedStatus).toBeNull();
  });
  it('voids a payment (kept in the list) and recomputes the total without it', () => {
    const withTwo = { ...app, payments: [pay(), pay({ id: 'p2', amount: 3000 })], paidTotal: 13000 };
    const at = new Date('2026-10-21T01:00:00Z');
    const r = voidPayment(withTwo, 'p1', 'boss@cebudirectclub.com', at);
    expect(r.paidTotal).toBe(3000);
    expect(r.payments).toHaveLength(2);
    expect(r.payments[0]).toMatchObject({ id: 'p1', amount: 10000, voidedAt: at, voidedBy: 'boss@cebudirectclub.com' });
    expect(r.payments[1].voidedAt).toBeUndefined();
  });
  it('does not re-void an already voided payment', () => {
    const at = new Date('2026-10-21T01:00:00Z');
    const once = voidPayment({ ...app, payments: [pay()], paidTotal: 10000 }, 'p1', 'a@x.co', at);
    const twice = voidPayment({ ...app, payments: once.payments, paidTotal: 0 }, 'p1', 'b@x.co', new Date());
    expect(twice.payments[0]).toMatchObject({ voidedBy: 'a@x.co', voidedAt: at });
  });
  it('paidTotalOf and applyPayment ignore voided payments', () => {
    const voided = pay({ id: 'v', amount: 50000, voidedAt: new Date(), voidedBy: 'a@x.co' });
    expect(paidTotalOf([voided, pay({ id: 'p2', amount: 3000 })])).toBe(3000);
    const r = applyPayment({ ...app, payments: [voided], paidTotal: 0 }, pay({ id: 'p3', amount: 10000 }));
    expect(r).toMatchObject({ paidTotal: 10000, suggestedStatus: 'deposit_paid' });
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
  it('trims the dial code', () => {
    expect(normalizeLead({ ...app.lead, phoneDial: ' +63 ' }).phoneDial).toBe('+63');
  });
  it('uses a character-cleanup message for control characters and a length message for overlong text', () => {
    expect(validateTravelers([{ category: 'full', nationality: 'PH\u0007' }], '2026-10-20')).toEqual({ 'travelers.0.nationality': 'Remove unusual characters.' });
    expect(validateTravelers([{ category: 'full', nationality: 'x'.repeat(61) }], '2026-10-20')).toEqual({ 'travelers.0.nationality': 'Max 60 characters.' });
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
