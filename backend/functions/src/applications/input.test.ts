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
  it('accepts and normalizes Philippine phone formats', () => {
    const r = parseSubmitInput(validInput({ lead: { ...validInput().lead, phoneNumber: '(0917) 123-4567' } }));
    expect(r.lead.phoneNumber).toBe('0917 123-4567');
  });
  it('rejects an email without a dotted domain', () => {
    expect(() => parseSubmitInput(validInput({ lead: { ...validInput().lead, email: 'maria@example' } }))).toThrow(SubmitError);
  });
  it('rejects a malformed promo code', () => {
    expect(() => parseSubmitInput(validInput({ promoCode: 'TA_SUNRISE' }))).toThrow(SubmitError);
  });

  describe('input hardening', () => {
    const lead = (over: Record<string, unknown>) => ({ lead: { ...validInput().lead, ...over } });
    const traveler = (over: Record<string, unknown>) => ({
      counts: { full: 1, tenK: 0, companion: 0 },
      travelers: [{ category: 'full', ...over }],
    });

    it('accepts ordinary international names', () => {
      const r = parseSubmitInput(validInput(lead({ firstName: 'María José', lastName: "O'Neil-Santos" })));
      expect(r.lead.firstName).toBe('María José');
      expect(r.lead.lastName).toBe("O'Neil-Santos");
      expect(() => parseSubmitInput(validInput(lead({ firstName: 'Juan', lastName: 'Dela Cruz' })))).not.toThrow();
    });
    it('rejects control characters in lead names', () => {
      expect(() => parseSubmitInput(validInput(lead({ firstName: 'Ma\u0000ria' })))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput(lead({ lastName: 'San\ntos' })))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput(lead({ lastName: 'San\u007Ftos' })))).toThrow(SubmitError);
    });
    it('rejects links and markup in lead names', () => {
      expect(() => parseSubmitInput(validInput(lead({ firstName: '<b>Maria</b>' })))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput(lead({ lastName: 'Santos>' })))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput(lead({ firstName: 'visit http://evil.example' })))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput(lead({ lastName: 'WWW.evil.example' })))).toThrow(SubmitError);
    });
    it('rejects control characters in traveler text fields', () => {
      for (const field of ['passportName', 'nationality', 'emergencyContact', 'expectedFinish', 'recentMarathon']) {
        expect(() => parseSubmitInput(validInput(traveler({ [field]: 'bad\u0007value' })))).toThrow(SubmitError);
      }
      expect(() => parseSubmitInput(validInput(traveler({ passportName: 'a\nb' })))).toThrow(SubmitError);
    });
    it('allows newlines and tabs only in specialRequests', () => {
      expect(parseSubmitInput(validInput({ specialRequests: 'line1\r\nline2\tok' })).specialRequests).toBe(
        'line1\r\nline2\tok',
      );
      expect(() => parseSubmitInput(validInput({ specialRequests: 'bad\u0000text' }))).toThrow(SubmitError);
      expect(() => parseSubmitInput(validInput({ specialRequests: 'bad\u001Btext' }))).toThrow(SubmitError);
    });
    it('requires dob to be a real calendar date between 1900-01-01 and today', () => {
      const dob = (v: string) => validInput(traveler({ dob: v }));
      expect(parseSubmitInput(dob('1990-05-17')).travelers[0].dob).toBe('1990-05-17');
      expect(parseSubmitInput(dob('2000-02-29')).travelers[0].dob).toBe('2000-02-29');
      expect(() => parseSubmitInput(dob('2027-02-30'))).toThrow(SubmitError);
      expect(() => parseSubmitInput(dob('1990-13-01'))).toThrow(SubmitError);
      expect(() => parseSubmitInput(dob('2001-02-29'))).toThrow(SubmitError);
      expect(() => parseSubmitInput(dob('1899-12-31'))).toThrow(SubmitError);
      expect(() => parseSubmitInput(dob('2999-01-01'))).toThrow(SubmitError);
    });
  });
});
