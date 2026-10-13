import { describe, expect, it } from 'vitest';
import type { Traveler } from '@unik/shared/domain';
import { cleanTraveler, droppedTravelers, droppedWarning, leadChanges, paidAtFromDate, paidExceedsNote } from './detailHelpers';

const travelers: Traveler[] = [
  { category: 'full', passportName: 'SANTOS MARIA' },
  { category: 'full' },
  { category: 'tenK', nationality: 'Filipino' },
  { category: 'companion', passportName: ' LEE JIN ' },
];

describe('droppedTravelers', () => {
  it('returns nothing when counts grow or stay', () => {
    expect(droppedTravelers(travelers, { full: 2, tenK: 1, companion: 1 })).toEqual([]);
    expect(droppedTravelers(travelers, { full: 3, tenK: 2, companion: 1 })).toEqual([]);
  });
  it('drops the trailing travelers of each shrinking category, numbered by position', () => {
    const d = droppedTravelers(travelers, { full: 1, tenK: 0, companion: 1 });
    expect(d.map((x) => [x.position, x.category, x.name, x.hasDetails])).toEqual([
      [2, 'full', null, false],
      [3, 'tenK', null, true],
    ]);
    expect(droppedWarning(d[0])).toBe('Traveler 2 (Full Marathon) details will be removed: no details.');
    expect(droppedWarning(d[1])).toContain('partial details');
  });
  it('names the traveler when a passport name exists', () => {
    const d = droppedTravelers(travelers, { full: 1, tenK: 1, companion: 0 });
    expect(droppedWarning(d[d.length - 1])).toBe('Traveler 4 (Companion) details will be removed: LEE JIN.');
  });
});

describe('paidExceedsNote', () => {
  it('only warns when paid is above the new total', () => {
    expect(paidExceedsNote(10000, 10000)).toBeNull();
    expect(paidExceedsNote(10000, 12000)).toBeNull();
    expect(paidExceedsNote(100000, 78000)).toBe('Paid amount exceeds the new total by PHP 22,000 — consider a refund.');
  });
});

describe('paidAtFromDate', () => {
  it('uses 12:00 Manila (04:00Z) of that date', () => {
    expect(paidAtFromDate('2026-10-20')?.toISOString()).toBe('2026-10-20T04:00:00.000Z');
  });
  it('rejects malformed or impossible dates', () => {
    expect(paidAtFromDate('')).toBeNull();
    expect(paidAtFromDate('2026-02-30')).toBeNull();
    expect(paidAtFromDate('20/10/2026')).toBeNull();
  });
});

describe('cleanTraveler', () => {
  it('trims strings and removes empty or undefined fields', () => {
    expect(cleanTraveler({ category: 'full', passportName: ' A B ', dob: '', nationality: undefined, room: 'twin' })).toEqual({ category: 'full', passportName: 'A B', room: 'twin' });
  });
});

describe('leadChanges', () => {
  it('lists only changed fields with dotted paths', () => {
    const prev = { firstName: 'A', lastName: 'B', email: 'a@b.co', phoneDial: '+63', phoneNumber: '9171234567', viber: true, whatsapp: false };
    expect(leadChanges(prev, { ...prev, email: 'c@d.co', whatsapp: true })).toEqual({ 'lead.email': 'c@d.co', 'lead.whatsapp': true });
    expect(leadChanges(prev, prev)).toEqual({});
  });
});
