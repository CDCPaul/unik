import { describe, expect, it } from 'vitest';
import { STATUS_LABELS, formatManila } from './format';

describe('format', () => {
  it('formats Manila time', () => {
    expect(formatManila(new Date('2026-10-19T16:30:00Z'))).toBe('2026-10-20 00:30');
    expect(formatManila(null)).toBe('—');
  });
  it('labels every status', () => {
    expect(STATUS_LABELS.deposit_paid).toBe('Deposit paid');
    expect(Object.keys(STATUS_LABELS)).toHaveLength(7);
  });
});
