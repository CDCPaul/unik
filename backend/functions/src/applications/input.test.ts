import { describe, expect, it } from 'vitest';
import { parseSubmitInput } from './input';
import { SubmitError } from './errors';
import { validInput } from '../test/helpers';

describe('parseSubmitInput', () => {
  it('normalizes email, promo code and blank optional fields', () => {
    const r = parseSubmitInput(
      validInput({
        promoCode: ' ta-sunrise ',
        travelers: [{ category: 'full', passportName: '  ', dob: '', room: 'single' }],
      }),
    );
    expect(r.lead.email).toBe('maria@example.com');
    expect(r.promoCode).toBe('TA-SUNRISE');
    expect(r.travelers[0]).toEqual({ category: 'full', passportName: undefined, dob: undefined, room: 'single' });
  });
  it('treats an empty promo code as none', () => {
    expect(parseSubmitInput(validInput({ promoCode: '' })).promoCode).toBeUndefined();
  });
  it('rejects a filled honeypot', () => {
    expect(() => parseSubmitInput(validInput({ website: 'http://spam' }))).toThrow(SubmitError);
  });
  it('rejects zero travelers and missing terms agreement', () => {
    expect(() => parseSubmitInput(validInput({ counts: { full: 0, tenK: 0, companion: 0 } }))).toThrow(
      'At least one traveler is required',
    );
    expect(() => parseSubmitInput(validInput({ agreedToTerms: false }))).toThrow(SubmitError);
  });
  it('rejects a malformed promo code', () => {
    expect(() => parseSubmitInput(validInput({ promoCode: 'TA_SUNRISE' }))).toThrow(SubmitError);
  });
});
