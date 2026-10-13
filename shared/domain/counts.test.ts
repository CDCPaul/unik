import { describe, expect, it } from 'vitest';
import { adultCount, buildTravelers, normalizeCounts, runnerCount, totalPax, validateCounts } from './counts';

describe('totalPax / runnerCount', () => {
  it('sums all categories and runners only', () => {
    const c = { full: 2, tenK: 1, companion: 3, child: 0, infant: 0 };
    expect(totalPax(c)).toBe(6);
    expect(runnerCount(c)).toBe(3);
  });
});

describe('child / infant counts', () => {
  const family = { full: 1, tenK: 0, companion: 1, child: 2, infant: 1 };
  it('counts children and infants as travelers but not as runners or adults', () => {
    expect(totalPax(family)).toBe(5);
    expect(runnerCount(family)).toBe(1);
    expect(adultCount(family)).toBe(2);
  });
});

describe('normalizeCounts', () => {
  it('fills missing child/infant keys of older applications with 0', () => {
    expect(normalizeCounts({ full: 2, tenK: 0, companion: 1 })).toEqual({ full: 2, tenK: 0, companion: 1, child: 0, infant: 0 });
  });
  it('turns invalid values into 0 and ignores unknown keys', () => {
    expect(normalizeCounts({ full: -1, tenK: 1.5, companion: '2', child: null, infant: 1, extra: 4 })).toEqual({
      full: 0,
      tenK: 0,
      companion: 0,
      child: 0,
      infant: 1,
    });
  });
  it('returns all zeros for a missing or non-object value', () => {
    const zero = { full: 0, tenK: 0, companion: 0, child: 0, infant: 0 };
    expect(normalizeCounts(undefined)).toEqual(zero);
    expect(normalizeCounts(null)).toEqual(zero);
    expect(normalizeCounts('x')).toEqual(zero);
  });
});

describe('validateCounts', () => {
  it('accepts children and infants travelling with adults', () => {
    expect(validateCounts({ full: 1, tenK: 0, companion: 1, child: 3, infant: 2 })).toBeNull();
    expect(validateCounts({ full: 0, tenK: 0, companion: 1, child: 1, infant: 1 })).toBeNull();
  });
  it('requires at least one adult when children or infants travel', () => {
    const msg = 'Children and infants must travel with at least one adult.';
    expect(validateCounts({ full: 0, tenK: 0, companion: 0, child: 1, infant: 0 })).toBe(msg);
    expect(validateCounts({ full: 0, tenK: 0, companion: 0, child: 0, infant: 1 })).toBe(msg);
    expect(validateCounts({ full: 0, tenK: 0, companion: 0, child: 2, infant: 1 })).toBe(msg);
  });
  it('allows at most one infant per adult', () => {
    const msg = 'Each infant must travel with an adult (one infant per adult).';
    expect(validateCounts({ full: 1, tenK: 0, companion: 0, child: 0, infant: 2 })).toBe(msg);
    expect(validateCounts({ full: 1, tenK: 1, companion: 0, child: 0, infant: 2 })).toBeNull();
  });
  it('counts children and infants towards the 10-traveler maximum', () => {
    expect(validateCounts({ full: 2, tenK: 0, companion: 2, child: 6, infant: 1 })).toBe('Maximum 10 travelers per application');
    expect(validateCounts({ full: 2, tenK: 0, companion: 2, child: 4, infant: 2 })).toBeNull();
  });
  it('rejects invalid child / infant counts', () => {
    expect(validateCounts({ full: 1, tenK: 0, companion: 0, child: -1, infant: 0 })).toBe('Invalid child count');
    expect(validateCounts({ full: 1, tenK: 0, companion: 0, child: 0, infant: 0.5 })).toBe('Invalid infant count');
  });
  it('accepts 1 to 10 travelers', () => {
    expect(validateCounts({ full: 1, tenK: 0, companion: 0, child: 0, infant: 0 })).toBeNull();
    expect(validateCounts({ full: 4, tenK: 3, companion: 3, child: 0, infant: 0 })).toBeNull();
  });
  it('rejects zero travelers', () => {
    expect(validateCounts({ full: 0, tenK: 0, companion: 0, child: 0, infant: 0 })).toBe('At least one traveler is required');
  });
  it('rejects more than 10 travelers', () => {
    expect(validateCounts({ full: 5, tenK: 5, companion: 1, child: 0, infant: 0 })).toBe('Maximum 10 travelers per application');
  });
  it('rejects negative or fractional counts', () => {
    expect(validateCounts({ full: -1, tenK: 2, companion: 0, child: 0, infant: 0 })).toBe('Invalid full count');
    expect(validateCounts({ full: 1, tenK: 0.5, companion: 0, child: 0, infant: 0 })).toBe('Invalid tenK count');
  });
});

describe('buildTravelers', () => {
  it('creates one entry per traveler ordered full, tenK, companion, child, infant', () => {
    const t = buildTravelers({ full: 1, tenK: 1, companion: 1, child: 1, infant: 1 });
    expect(t.map((x) => x.category)).toEqual(['full', 'tenK', 'companion', 'child', 'infant']);
  });
  it('drops the room choice for infants (they share an adult room) but keeps it for children', () => {
    const t = buildTravelers({ full: 1, tenK: 0, companion: 0, child: 1, infant: 1 }, [
      { category: 'infant', passportName: 'I ONE', room: 'single' },
      { category: 'child', room: 'single' },
    ]);
    expect(t).toEqual([{ category: 'full' }, { category: 'child', room: 'single' }, { category: 'infant', passportName: 'I ONE' }]);
  });
  it('keeps provided details per category in order and drops extras', () => {
    const t = buildTravelers({ full: 2, tenK: 0, companion: 1, child: 0, infant: 0 }, [
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
