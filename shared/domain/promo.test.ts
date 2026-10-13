import { describe, expect, it } from 'vitest';
import {
  describeDiscount,
  evaluatePromo,
  isValidPromoCodeFormat,
  manilaDate,
  normalizePromoCode,
  promoUsagePax,
} from './promo';
import type { ApplicationSummary } from './types';

const now = new Date('2026-10-20T03:00:00Z');
const active = { active: true, validUntil: null, maxPax: null };

describe('promo code format', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizePromoCode('  ta-sunrise ')).toBe('TA-SUNRISE');
  });
  it('accepts A-Z, 0-9 and hyphen, 3 to 20 chars', () => {
    expect(isValidPromoCodeFormat('TA-SUNRISE')).toBe(true);
    expect(isValidPromoCodeFormat('AB')).toBe(false);
    expect(isValidPromoCodeFormat('TA_SUNRISE')).toBe(true);
    expect(isValidPromoCodeFormat('GRH_C')).toBe(true);
    expect(isValidPromoCodeFormat('TA SUN')).toBe(false);
    expect(isValidPromoCodeFormat('TA.SUN')).toBe(false);
    expect(isValidPromoCodeFormat('A'.repeat(21))).toBe(false);
  });
});

describe('evaluatePromo', () => {
  it('rejects a missing code', () => {
    expect(evaluatePromo(null, { now, usedPax: 0, requestedPax: 1 })).toEqual({ valid: false, reason: 'not_found' });
  });
  it('rejects an inactive code', () => {
    expect(evaluatePromo({ ...active, active: false }, { now, usedPax: 0, requestedPax: 1 })).toEqual({
      valid: false,
      reason: 'inactive',
    });
  });
  it('uses Manila date for expiry', () => {
    const promo = { ...active, validUntil: '2026-10-31' };
    expect(manilaDate(new Date('2026-10-31T15:59:00Z'))).toBe('2026-10-31');
    expect(evaluatePromo(promo, { now: new Date('2026-10-31T15:59:00Z'), usedPax: 0, requestedPax: 1 })).toEqual({
      valid: true,
    });
    expect(evaluatePromo(promo, { now: new Date('2026-10-31T16:00:00Z'), usedPax: 0, requestedPax: 1 })).toEqual({
      valid: false,
      reason: 'expired',
    });
  });
  it('enforces maxPax including the requested travelers', () => {
    const promo = { ...active, maxPax: 10 };
    expect(evaluatePromo(promo, { now, usedPax: 8, requestedPax: 2 })).toEqual({ valid: true });
    expect(evaluatePromo(promo, { now, usedPax: 8, requestedPax: 3 })).toEqual({ valid: false, reason: 'limit_reached' });
  });
});

describe('promoUsagePax', () => {
  it('counts every status except cancelled for the given code', () => {
    const apps: ApplicationSummary[] = [
      { status: 'new', departureId: 'mnl', counts: { full: 2, tenK: 0, companion: 1, child: 0, infant: 0 }, promoCode: 'TA-A' },
      { status: 'waitlist', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 }, promoCode: 'TA-A' },
      { status: 'cancelled', departureId: 'mnl', counts: { full: 4, tenK: 0, companion: 0, child: 0, infant: 0 }, promoCode: 'TA-A' },
      { status: 'confirmed', departureId: 'ceb', counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 }, promoCode: 'TA-B' },
      { status: 'new', departureId: 'ceb', counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 }, promoCode: null },
    ];
    expect(promoUsagePax(apps, 'TA-A')).toBe(4);
  });
  it('does not count infants toward the limit (they get no discount)', () => {
    const apps: ApplicationSummary[] = [
      { status: 'new', departureId: 'mnl', counts: { full: 2, tenK: 0, companion: 0, child: 1, infant: 2 }, promoCode: 'TA-A' },
    ];
    expect(promoUsagePax(apps, 'TA-A')).toBe(3);
  });
});

describe('describeDiscount', () => {
  it('describes fixed and percent discounts', () => {
    expect(describeDiscount('fixed', 2000)).toBe('PHP 2,000 off per person');
    expect(describeDiscount('percent', 5)).toBe('5% off');
  });
});
