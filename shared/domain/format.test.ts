import { describe, expect, it } from 'vitest';
import { describeCounts, formatAppNo, formatPHP } from './format';

describe('format', () => {
  it('formats application numbers with 4-digit padding', () => {
    expect(formatAppNo(1)).toBe('APP-0001');
    expect(formatAppNo(12345)).toBe('APP-12345');
  });
  it('formats pesos with thousands separators', () => {
    expect(formatPHP(230000)).toBe('PHP 230,000');
    expect(formatPHP(0)).toBe('PHP 0');
  });
  it('describes counts skipping zero categories', () => {
    expect(describeCounts({ full: 2, tenK: 0, companion: 1, child: 0, infant: 0 })).toBe('2 Full Marathon, 1 Companion');
  });
});
