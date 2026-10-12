import { describe, expect, it } from 'vitest';
import { computeCompleteness, missingFields } from './completeness';

describe('completeness', () => {
  it('counts 8 fields for runners and 6 for companions', () => {
    expect(computeCompleteness([{ category: 'full' }, { category: 'companion' }])).toEqual({ filled: 0, total: 14 });
  });
  it('counts only non-blank values', () => {
    const r = computeCompleteness([
      { category: 'tenK', passportName: 'SANTOS MARIA', dob: '1990-05-14', nationality: '   ', room: 'twin' },
    ]);
    expect(r).toEqual({ filled: 3, total: 8 });
  });
  it('lists missing fields for a traveler', () => {
    expect(
      missingFields({
        category: 'companion',
        passportName: 'A',
        dob: '1990-01-01',
        gender: 'male',
        nationality: 'Philippines',
        room: 'twin',
      }),
    ).toEqual(['emergencyContact']);
  });
});
