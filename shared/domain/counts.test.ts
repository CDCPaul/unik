import { describe, expect, it } from 'vitest';
import { buildTravelers, runnerCount, totalPax, validateCounts } from './counts';

describe('totalPax / runnerCount', () => {
  it('sums all categories and runners only', () => {
    const c = { full: 2, tenK: 1, companion: 3 };
    expect(totalPax(c)).toBe(6);
    expect(runnerCount(c)).toBe(3);
  });
});

describe('validateCounts', () => {
  it('accepts 1 to 10 travelers', () => {
    expect(validateCounts({ full: 1, tenK: 0, companion: 0 })).toBeNull();
    expect(validateCounts({ full: 4, tenK: 3, companion: 3 })).toBeNull();
  });
  it('rejects zero travelers', () => {
    expect(validateCounts({ full: 0, tenK: 0, companion: 0 })).toBe('At least one traveler is required');
  });
  it('rejects more than 10 travelers', () => {
    expect(validateCounts({ full: 5, tenK: 5, companion: 1 })).toBe('Maximum 10 travelers per application');
  });
  it('rejects negative or fractional counts', () => {
    expect(validateCounts({ full: -1, tenK: 2, companion: 0 })).toBe('Invalid full count');
    expect(validateCounts({ full: 1, tenK: 0.5, companion: 0 })).toBe('Invalid tenK count');
  });
});

describe('buildTravelers', () => {
  it('creates one entry per traveler ordered full, tenK, companion', () => {
    const t = buildTravelers({ full: 1, tenK: 1, companion: 1 });
    expect(t.map((x) => x.category)).toEqual(['full', 'tenK', 'companion']);
  });
  it('keeps provided details per category in order and drops extras', () => {
    const t = buildTravelers({ full: 2, tenK: 0, companion: 1 }, [
      { category: 'companion', passportName: 'C ONE' },
      { category: 'full', passportName: 'F ONE' },
      { category: 'full', passportName: 'F TWO' },
      { category: 'full', passportName: 'F THREE' },
      { category: 'tenK', passportName: 'T ONE' },
    ]);
    expect(t).toEqual([
      { category: 'full', passportName: 'F ONE' },
      { category: 'full', passportName: 'F TWO' },
      { category: 'companion', passportName: 'C ONE' },
    ]);
  });
});
