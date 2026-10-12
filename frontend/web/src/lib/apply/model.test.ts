import { describe, expect, it } from 'vitest';
import { applyReducer, estimatePricing, initialApplyState, toSubmitPayload, validateForSubmit } from './model';
import type { ApplyState } from './model';
import type { TourConfig } from '@unik/shared/domain';

const config = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [
    { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: '', seatCapacity: 120, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 },
  ],
} satisfies TourConfig;

function filled(): ApplyState {
  let s = initialApplyState('key-1');
  s = applyReducer(s, { type: 'setDeparture', departureId: 'mnl' });
  s = applyReducer(s, { type: 'setLead', field: 'firstName', value: 'Maria' });
  s = applyReducer(s, { type: 'setLead', field: 'lastName', value: 'Santos' });
  s = applyReducer(s, { type: 'setLead', field: 'email', value: 'maria@example.com' });
  s = applyReducer(s, { type: 'setLead', field: 'phoneNumber', value: '(0917) 123-4567' });
  return applyReducer(s, { type: 'setAgreed', value: true });
}

describe('applyReducer', () => {
  it('starts with one full marathon runner and the stored promo code', () => {
    const s = initialApplyState('k', 'TA-SUNRISE');
    expect(s.counts).toEqual({ full: 1, tenK: 0, companion: 0 });
    expect(s.travelers).toEqual([{ category: 'full' }]);
    expect(s.promoInput).toBe('TA-SUNRISE');
  });
  it('keeps travelers in sync with counts and preserves entered details', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'passportName', value: 'SANTOS MARIA' });
    s = applyReducer(s, { type: 'changeCount', category: 'companion', delta: 1 });
    expect(s.travelers).toEqual([{ category: 'full', passportName: 'SANTOS MARIA' }, { category: 'companion' }]);
  });
  it('never goes below 1 or above 10 travelers', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'changeCount', category: 'full', delta: -1 });
    expect(s.counts.full).toBe(1);
    for (let i = 0; i < 12; i++) s = applyReducer(s, { type: 'changeCount', category: 'tenK', delta: 1 });
    expect(s.counts.full + s.counts.tenK + s.counts.companion).toBe(10);
  });
  it('starts with submitAttempted=false and records markSubmitAttempted', () => {
    let s = initialApplyState('k');
    expect(s.submitAttempted).toBe(false);
    s = applyReducer(s, { type: 'markSubmitAttempted' });
    expect(s.submitAttempted).toBe(true);
  });
  it('does not send submitAttempted to the server', () => {
    const p = toSubmitPayload(applyReducer(filled(), { type: 'markSubmitAttempted' }));
    expect('submitAttempted' in p).toBe(false);
  });
  it('drops an applied promo when the code input changes', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'promoApplied', promo: { code: 'TA-A', agencyName: 'A', discountType: 'fixed', discountValue: 1000, description: 'x' } });
    s = applyReducer(s, { type: 'setPromoInput', value: 'ta-a' });
    expect(s.promo?.code).toBe('TA-A');
    s = applyReducer(s, { type: 'setPromoInput', value: 'TA-B' });
    expect(s.promo).toBeNull();
  });
});

describe('validateForSubmit', () => {
  it('passes a minimally filled form', () => {
    expect(validateForSubmit(filled(), '2026-10-13')).toEqual({});
  });
  it('reports every missing required field', () => {
    const errors = validateForSubmit(initialApplyState('k'), '2026-10-13');
    expect(Object.keys(errors).sort()).toEqual(
      ['agreedToTerms', 'departureId', 'lead.email', 'lead.firstName', 'lead.lastName', 'lead.phoneNumber'].sort(),
    );
  });
  it('validates optional traveler fields only when filled', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'dob', value: '2027-02-30' });
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'passportName', value: 'www.spam.com' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({
      'travelers.0.dob': expect.any(String),
      'travelers.0.passportName': expect.any(String),
    });
  });
});

describe('validateForSubmit matches server rules', () => {
  it('rejects an email longer than 120 characters after trim', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setLead', field: 'email', value: `${'a'.repeat(115)}@x.com` });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({ 'lead.email': expect.any(String) });
  });
  it('accepts an email of exactly 120 characters', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setLead', field: 'email', value: `${'a'.repeat(114)}@x.com` });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({});
  });
  it('rejects special requests longer than 1000 characters', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setSpecialRequests', value: 'a'.repeat(1001) });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({ specialRequests: 'Please shorten your request (max 1000 characters).' });
  });
  it('accepts special requests of exactly 1000 characters', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setSpecialRequests', value: 'a'.repeat(1000) });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({});
  });
  it('rejects control characters in special requests', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setSpecialRequests', value: 'hello\u0007world' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({ specialRequests: 'Please remove unusual characters.' });
  });
  it('allows newlines and tabs in special requests', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setSpecialRequests', value: 'Vegetarian meal\n\tPlease seat me near the aisle\r\n' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({});
  });
  it('rejects a promo code with a space', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setPromoInput', value: 'ta sunrise' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({
      promoInput: 'Promo codes use letters, numbers and hyphens (3–20 characters).',
    });
  });
  it('accepts a well-formed promo code', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setPromoInput', value: 'ta-sunrise' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({});
  });
  it('does not re-check the format of an applied promo', () => {
    let s = filled();
    s = applyReducer(s, { type: 'promoApplied', promo: { code: 'TA-A', agencyName: 'A', discountType: 'fixed', discountValue: 1000, description: 'x' } });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({});
  });
});

describe('toSubmitPayload', () => {
  it('normalizes phone, trims and drops empty optional values', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'nationality', value: '  ' });
    s = applyReducer(s, { type: 'setPromoInput', value: ' ta-x ' });
    const p = toSubmitPayload(s);
    expect(p.lead.phoneNumber).toBe('0917 123-4567');
    expect(p.travelers).toEqual([{ category: 'full' }]);
    expect(p.promoCode).toBe('TA-X');
    expect(p.specialRequests).toBeUndefined();
    expect(p.idempotencyKey).toBe('key-1');
    expect(p.website).toBe('');
  });
  it('omits promoCode and specialRequests keys entirely for an empty form', () => {
    const p = toSubmitPayload(filled());
    expect('promoCode' in p).toBe(false);
    expect('specialRequests' in p).toBe(false);
  });
});

describe('estimatePricing', () => {
  it('prices the selected departure with the applied promo', () => {
    let s = filled();
    s = applyReducer(s, { type: 'promoApplied', promo: { code: 'TA-A', agencyName: 'A', discountType: 'fixed', discountValue: 2000, description: 'x' } });
    expect(estimatePricing(s, config)?.total).toBe(78000);
  });
  it('returns null without a departure', () => {
    expect(estimatePricing(initialApplyState('k'), config)).toBeNull();
  });
});
