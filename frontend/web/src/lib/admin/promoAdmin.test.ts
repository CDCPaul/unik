import { describe, expect, it } from 'vitest';
import { describeDiscount } from '@unik/shared/domain';
import { discountLabel, emptyPromoForm, isPromoExpired, promoToForm, referralLink, toPromoDoc, validatePromoForm } from './promoAdmin';
import { translate } from './i18n/translate';

const form = () => ({ ...emptyPromoForm(), code: 'ta-sunrise', agencyName: 'Sunrise Travel', discountValue: '2,000' });

describe('validatePromoForm', () => {
  it('accepts a normalized new code', () => {
    expect(validatePromoForm(form(), { isNew: true, existingCodes: [] })).toEqual({});
  });
  it('rejects duplicates and bad formats', () => {
    expect(validatePromoForm(form(), { isNew: true, existingCodes: ['TA-SUNRISE'] })).toHaveProperty('code');
    expect(validatePromoForm({ ...form(), code: 'ta sunrise' }, { isNew: true, existingCodes: [] })).toHaveProperty('code');
    expect(validatePromoForm({ ...form(), agencyName: ' ' }, { isNew: true, existingCodes: [] })).toHaveProperty('agencyName');
  });
  it('limits discount values by type', () => {
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '0' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '5.5' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '100' }, { isNew: true, existingCodes: [] })).toEqual({});
    expect(validatePromoForm({ ...form(), discountValue: '1,000,001' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
  });
  it('validates optional expiry and max travelers', () => {
    expect(validatePromoForm({ ...form(), validUntil: '2027-02-30' }, { isNew: true, existingCodes: [] })).toHaveProperty('validUntil');
    expect(validatePromoForm({ ...form(), maxPax: '0' }, { isNew: true, existingCodes: [] })).toHaveProperty('maxPax');
    expect(validatePromoForm({ ...form(), validUntil: '2027-01-31', maxPax: '20' }, { isNew: true, existingCodes: [] })).toEqual({});
    expect(validatePromoForm({ ...form(), maxPax: '10php00' }, { isNew: true, existingCodes: [] })).toHaveProperty('maxPax');
  });
});

describe('toPromoDoc / promoToForm / referralLink', () => {
  it('converts blanks to null and numbers to integers', () => {
    expect(toPromoDoc(form())).toEqual({
      agencyName: 'Sunrise Travel',
      contactName: '',
      contactInfo: '',
      discountType: 'fixed',
      discountValue: 2000,
      validUntil: null,
      maxPax: null,
      active: true,
      notes: '',
    });
  });
  it('round-trips an existing code', () => {
    const f = promoToForm({ code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 5, validUntil: '2027-01-31', maxPax: 10, active: false });
    expect(f).toMatchObject({ code: 'TA-X', discountValue: '5', validUntil: '2027-01-31', maxPax: '10', active: false });
  });
  it('builds the shareable link', () => {
    expect(referralLink('TA-SUNRISE')).toBe('https://unik.ph/apply?code=TA-SUNRISE');
  });
});

describe('validatePromoForm messages', () => {
  it('keeps the English wording and translates to Korean', () => {
    const e = validatePromoForm(form(), { isNew: true, existingCodes: ['TA-SUNRISE'] });
    expect(translate('en', e.code)).toBe('This code already exists.');
    expect(translate('ko', e.code)).toBe('이미 있는 코드입니다.');
  });
});

describe('discountLabel', () => {
  it('matches the shared describeDiscount in English', () => {
    for (const [type, value] of [['fixed', 0], ['fixed', 2000], ['percent', 5]] as const) {
      expect(translate('en', discountLabel(type, value))).toBe(describeDiscount(type, value));
    }
  });
  it('translates to Korean', () => {
    expect(translate('ko', discountLabel('fixed', 0))).toBe('추천 코드(할인 없음)');
    expect(translate('ko', discountLabel('fixed', 2000))).toBe('1인당 PHP 2,000 할인');
    expect(translate('ko', discountLabel('percent', 5))).toBe('5% 할인');
  });
});

describe('isPromoExpired', () => {
  it('is expired only when validUntil is before today (Manila)', () => {
    expect(isPromoExpired('2026-10-12', '2026-10-13')).toBe(true);
    expect(isPromoExpired('2026-10-13', '2026-10-13')).toBe(false);
    expect(isPromoExpired('2026-12-01', '2026-10-13')).toBe(false);
    expect(isPromoExpired(null, '2026-10-13')).toBe(false);
    expect(isPromoExpired(undefined, '2026-10-13')).toBe(false);
    expect(isPromoExpired('', '2026-10-13')).toBe(false);
  });
});
