import { describe, expect, it } from 'vitest';
import { emptyPromoForm, promoToForm, referralLink, toPromoDoc, validatePromoForm } from './promoAdmin';

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
