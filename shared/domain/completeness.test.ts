import { describe, expect, it } from 'vitest';
import { computeCompleteness, missingFields } from './completeness';

describe('completeness', () => {
  it('counts 8 fields for runners and 6 for companions', () => {
    expect(computeCompleteness([{ category: 'full' }, { category: 'companion' }])).toEqual({ filled: 0, total: 14 });
  });
  it('uses companion fields for children and companion fields without room for infants', () => {
    expect(computeCompleteness([{ category: 'child' }])).toEqual({ filled: 0, total: 6 });
    expect(computeCompleteness([{ category: 'infant' }])).toEqual({ filled: 0, total: 5 });
    expect(missingFields({ category: 'infant', passportName: 'A', dob: '2026-01-01', gender: 'male', nationality: 'Philippines' })).toEqual([
      'emergencyContact',
    ]);
  });
  it('asks runner fields of child 10K runners, without room when they have no bed', () => {
    expect(computeCompleteness([{ category: 'childTenK' }])).toEqual({ filled: 0, total: 8 });
    expect(computeCompleteness([{ category: 'childTenKNoBed' }])).toEqual({ filled: 0, total: 7 });
    expect(missingFields({ category: 'childTenKNoBed' })).not.toContain('room');
    expect(missingFields({ category: 'childTenKNoBed' })).toContain('tshirtSize');
  });
  it('does not ask runner fields of cheering children, nor a room of no-bed children', () => {
    expect(missingFields({ category: 'child' })).toEqual(['passportName', 'dob', 'gender', 'nationality', 'room', 'emergencyContact']);
    expect(missingFields({ category: 'childNoBed' })).toEqual(['passportName', 'dob', 'gender', 'nationality', 'emergencyContact']);
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
