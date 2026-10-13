import { describe, expect, it } from 'vitest';
import {
  EMAIL_PATTERN,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  hasControlChars,
  hasControlCharsExceptWhitespace,
  hasLinkOrMarkup,
  isValidBirthDate,
  PASSPORT_NAME_MAX,
  isValidName,
  isValidPassportName,
  normalizePhoneNumber,
} from './validation';

describe('names', () => {
  it('accepts real-world names', () => {
    for (const n of ['María José', "O'Neil-Santos", 'Dela Cruz', '김민지', 'Ñino']) expect(isValidName(n)).toBe(true);
  });
  it('rejects blank, too long, control characters, links and markup', () => {
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('A'.repeat(61))).toBe(false);
    expect(isValidName('Maria\nBcc: x')).toBe(false);
    expect(isValidName('visit www.spam.com')).toBe(false);
    expect(isValidName('http://x.y')).toBe(false);
    expect(isValidName('<b>x</b>')).toBe(false);
  });
  it('exposes the low-level checks', () => {
    expect(hasControlChars('a\u0007b')).toBe(true);
    expect(hasControlCharsExceptWhitespace('line1\nline2\tx')).toBe(false);
    expect(hasLinkOrMarkup('WWW.x.com')).toBe(true);
  });
});

describe('passport names', () => {
  it('allows up to 80 characters, longer than a regular name', () => {
    expect(PASSPORT_NAME_MAX).toBe(80);
    expect(isValidPassportName('A'.repeat(80))).toBe(true);
    expect(isValidPassportName('A'.repeat(81))).toBe(false);
    expect(isValidName('A'.repeat(80))).toBe(false);
  });
  it('trims before measuring and accepts real passport names', () => {
    for (const n of ['  SANTOS MARIA JOSE  ', "O'NEIL-SANTOS ANNE", '김민지', 'DELA CRUZ, JUAN']) expect(isValidPassportName(n)).toBe(true);
  });
  it('rejects blank, control characters, links and markup', () => {
    for (const n of ['', '   ', 'MARIA' + String.fromCharCode(10) + 'Bcc: x', 'a' + String.fromCharCode(7) + 'b', 'www.spam.com', 'https://x.y', '<b>MARIA</b>']) {
      expect(isValidPassportName(n), JSON.stringify(n)).toBe(false);
    }
  });
});

describe('phone', () => {
  it('normalizes Philippine formats so they pass the pattern', () => {
    expect(normalizePhoneNumber('(0917) 123-4567')).toBe('0917 123-4567');
    expect(normalizePhoneNumber('0917.123.4567')).toBe('0917 123 4567');
    expect(normalizePhoneNumber('  917   123 4567 ')).toBe('917 123 4567');
    expect(PHONE_NUMBER_PATTERN.test(normalizePhoneNumber('(0917) 123-4567'))).toBe(true);
  });
  it('validates dial codes', () => {
    expect(PHONE_DIAL_PATTERN.test('+63')).toBe(true);
    expect(PHONE_DIAL_PATTERN.test('63')).toBe(false);
  });
});

describe('email', () => {
  it('accepts normal addresses and rejects obvious garbage', () => {
    expect(EMAIL_PATTERN.test('maria@example.com')).toBe(true);
    expect(EMAIL_PATTERN.test('maria@example')).toBe(false);
    expect(EMAIL_PATTERN.test('maria example.com')).toBe(false);
  });
});

describe('isValidBirthDate', () => {
  const today = '2026-10-13';
  it('accepts real past dates', () => {
    expect(isValidBirthDate('1990-05-14', today)).toBe(true);
    expect(isValidBirthDate('2026-10-13', today)).toBe(true);
  });
  it('rejects impossible, future and too-old dates', () => {
    expect(isValidBirthDate('2027-02-30', today)).toBe(false);
    expect(isValidBirthDate('1990-13-01', today)).toBe(false);
    expect(isValidBirthDate('2026-10-14', today)).toBe(false);
    expect(isValidBirthDate('1899-12-31', today)).toBe(false);
    expect(isValidBirthDate('14/05/1990', today)).toBe(false);
  });
});
