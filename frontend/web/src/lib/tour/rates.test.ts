import { describe, expect, it } from 'vitest';
import type { Category } from '@unik/shared/domain';
import { allSameRates, groupDeparturesByRates, sameRates, splitFlightLegs } from './rates';

const PRICES: Record<Category, number> = {
  full: 85000,
  tenK: 80000,
  companion: 75000,
  childTenK: 70000,
  childTenKNoBed: 60000,
  child: 65000,
  childNoBed: 55000,
  infant: 15000,
};
const dep = (id: string, over: Partial<Record<Category, unknown>> = {}, singleSupplement: number = 8000) => ({
  id,
  prices: { ...PRICES, ...over } as Record<Category, number>,
  singleSupplement,
});

describe('sameRates', () => {
  it('is true for identical prices and single supplement', () => {
    expect(sameRates(dep('a'), dep('b'))).toBe(true);
  });
  it('is false when one category price differs', () => {
    expect(sameRates(dep('a'), dep('b', { infant: 16000 }))).toBe(false);
  });
  it('is false when the single supplement differs', () => {
    expect(sameRates(dep('a'), dep('b', {}, 9000))).toBe(false);
  });
  it('treats missing and invalid prices as the same "no price"', () => {
    expect(sameRates(dep('a', { infant: undefined }), dep('b', { infant: -1 }))).toBe(true);
    expect(sameRates(dep('a', { infant: undefined }), dep('b'))).toBe(false);
  });
  it('copes with a missing prices object', () => {
    const bare = { prices: undefined as unknown as Record<Category, number>, singleSupplement: 8000 };
    const empty = dep('b', Object.fromEntries(Object.keys(PRICES).map((k) => [k, undefined])));
    expect(sameRates(bare, empty)).toBe(true);
  });
});

describe('groupDeparturesByRates / allSameRates', () => {
  it('puts all departures in one group when prices match (current setup)', () => {
    const deps = [dep('tag'), dep('ceb'), dep('crk')];
    expect(groupDeparturesByRates(deps).map((g) => g.map((d) => d.id))).toEqual([['tag', 'ceb', 'crk']]);
    expect(allSameRates(deps)).toBe(true);
  });
  it('splits only the departure that differs, keeping first-seen order', () => {
    const deps = [dep('tag', { full: 90000 }), dep('ceb'), dep('crk')];
    expect(groupDeparturesByRates(deps).map((g) => g.map((d) => d.id))).toEqual([['tag'], ['ceb', 'crk']]);
    expect(allSameRates(deps)).toBe(false);
  });
  it('is true for zero or one departure', () => {
    expect(allSameRates([])).toBe(true);
    expect(allSameRates([dep('tag')])).toBe(true);
    expect(groupDeparturesByRates([])).toEqual([]);
  });
});

describe('splitFlightLegs', () => {
  it('labels exactly two legs as outbound and return', () => {
    expect(splitFlightLegs('Jin Air LJ044 TAG–ICN 18 Mar 23:00–04:35 (+1) · LJ043 ICN–TAG 22 Mar 18:00–22:00')).toEqual([
      { label: 'Outbound', text: 'Jin Air LJ044 TAG–ICN 18 Mar 23:00–04:35 (+1)' },
      { label: 'Return', text: 'LJ043 ICN–TAG 22 Mar 18:00–22:00' },
    ]);
  });
  it('keeps other counts unlabelled, one leg per line', () => {
    expect(splitFlightLegs('A · B · C')).toEqual([{ text: 'A' }, { text: 'B' }, { text: 'C' }]);
    expect(splitFlightLegs('Flights to be announced')).toEqual([{ text: 'Flights to be announced' }]);
  });
  it('drops empty parts and handles empty input', () => {
    expect(splitFlightLegs('')).toEqual([]);
    expect(splitFlightLegs(undefined)).toEqual([]);
    expect(splitFlightLegs(' A ·  · B · C ')).toEqual([{ text: 'A' }, { text: 'B' }, { text: 'C' }]);
  });
});
