import { describe, expect, it } from 'vitest';
import { computeAvailability, exceedsCapacity } from './availability';
import type { ApplicationSummary } from './types';

const config = {
  bibQuota: { total: 3 },
  departures: [
    { id: 'mnl', seatCapacity: 4 },
    { id: 'ceb', seatCapacity: 10 },
  ] as never[],
};

const apps: ApplicationSummary[] = [
  { status: 'new', departureId: 'mnl', counts: { full: 2, tenK: 0, companion: 1 }, promoCode: null },
  { status: 'cancelled', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: null },
  { status: 'waitlist', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: null },
  { status: 'contacted', departureId: 'ceb', counts: { full: 0, tenK: 0, companion: 1 }, promoCode: null },
];

describe('computeAvailability', () => {
  it('excludes cancelled and waitlisted applications', () => {
    expect(computeAvailability(config, apps)).toEqual({
      bibsUsed: 2,
      bibsTotal: 3,
      departures: { mnl: { seatsUsed: 3, seatCapacity: 4 }, ceb: { seatsUsed: 1, seatCapacity: 10 } },
    });
  });
  it('ignores seats for departures no longer in config but still counts their bibs', () => {
    const av = computeAvailability(config, [
      ...apps,
      { status: 'new', departureId: 'old', counts: { full: 1, tenK: 0, companion: 2 }, promoCode: null },
    ]);
    expect(av.bibsUsed).toBe(3);
    expect(Object.keys(av.departures)).toEqual(['mnl', 'ceb']);
  });
});

describe('exceedsCapacity', () => {
  const av = computeAvailability(config, apps); // bibs 2/3, mnl 3/4
  it('detects bib overflow', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 2, tenK: 0, companion: 0 })).toBe(true);
  });
  it('allows exactly filling bibs and seats', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe(false);
  });
  it('detects seat overflow even for companions', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 0, tenK: 0, companion: 2 })).toBe(true);
  });
  it('treats an unknown departure as full', () => {
    expect(exceedsCapacity(av, 'xyz', { full: 0, tenK: 0, companion: 1 })).toBe(true);
  });
});
