import { describe, expect, it } from 'vitest';
import type { Traveler } from '@unik/shared/domain';
import { cleanTraveler, defaultPaymentType, droppedTravelers, droppedWarning, leadChanges, mergeTravelerEdits, paidAtFromDate, paidExceedsNote } from './detailHelpers';

const travelers: Traveler[] = [
  { category: 'full', passportName: 'SANTOS MARIA' },
  { category: 'full' },
  { category: 'tenK', nationality: 'Filipino' },
  { category: 'companion', passportName: ' LEE JIN ' },
];

describe('droppedTravelers', () => {
  it('returns nothing when counts grow or stay', () => {
    expect(droppedTravelers(travelers, { full: 2, tenK: 1, companion: 1, child: 0, infant: 0 })).toEqual([]);
    expect(droppedTravelers(travelers, { full: 3, tenK: 2, companion: 1, child: 0, infant: 0 })).toEqual([]);
  });
  it('drops the trailing travelers of each shrinking category, numbered by position', () => {
    const d = droppedTravelers(travelers, { full: 1, tenK: 0, companion: 1, child: 0, infant: 0 });
    expect(d.map((x) => [x.position, x.category, x.name, x.hasDetails])).toEqual([
      [2, 'full', null, false],
      [3, 'tenK', null, true],
    ]);
    expect(droppedWarning(d[0])).toBe('Traveler 2 (Full Marathon) details will be removed: no details.');
    expect(droppedWarning(d[1])).toContain('partial details');
  });
  it('handles child and infant travelers', () => {
    const family: Traveler[] = [{ category: 'full' }, { category: 'child', passportName: 'KID' }, { category: 'infant' }];
    const d = droppedTravelers(family, { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 });
    expect(d.map((x) => [x.position, x.category, x.name])).toEqual([
      [2, 'child', 'KID'],
      [3, 'infant', null],
    ]);
    expect(droppedWarning(d[1])).toBe('Traveler 3 (Infant (under 2)) details will be removed: no details.');
  });
  it('names the traveler when a passport name exists', () => {
    const d = droppedTravelers(travelers, { full: 1, tenK: 1, companion: 0, child: 0, infant: 0 });
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

describe('mergeTravelerEdits', () => {
  const base: Traveler[] = [
    { category: 'full', passportName: 'A ONE', nationality: 'Filipino' },
    { category: 'full', passportName: 'B TWO' },
    { category: 'companion' },
  ];
  const counts = { base: { full: 2, tenK: 0, companion: 1, child: 0, infant: 0 }, live: { full: 2, tenK: 0, companion: 1, child: 0, infant: 0 } };
  const edit = (i: number, patch: Partial<Traveler>) => base.map((t, j) => (j === i ? { ...t, ...patch } : { ...t }));

  it('reapplies only the user-changed fields onto the live travelers (no conflict)', () => {
    const live: Traveler[] = [{ ...base[0], room: 'single' }, { ...base[1], dob: '1990-01-01' }, { ...base[2] }];
    const r = mergeTravelerEdits(base, edit(1, { passportName: 'B TWO EDITED' }), live, counts);
    expect(r).toEqual({
      merged: [{ category: 'full', passportName: 'A ONE', nationality: 'Filipino', room: 'single' }, { category: 'full', passportName: 'B TWO EDITED', dob: '1990-01-01' }, { category: 'companion' }],
    });
  });
  it('treats blank and missing values as equal and can clear a field', () => {
    const r = mergeTravelerEdits(base, edit(0, { nationality: '' }), base.map((t) => ({ ...t })), counts);
    expect(r).toEqual({ merged: [{ category: 'full', passportName: 'A ONE' }, base[1], base[2]] });
  });
  it('reports a conflict when the same field changed live since the snapshot', () => {
    const live = base.map((t, i) => (i === 1 ? { ...t, passportName: 'B TWO (STAFF)' } : { ...t }));
    expect(mergeTravelerEdits(base, edit(1, { passportName: 'B TWO EDITED' }), live, counts)).toEqual({ conflict: true });
  });
  it('is not a conflict when live already holds the same value the user typed', () => {
    const live = base.map((t, i) => (i === 1 ? { ...t, passportName: 'SAME' } : { ...t }));
    expect(mergeTravelerEdits(base, edit(1, { passportName: 'SAME' }), live, counts)).toEqual({ merged: live });
  });
  it('reports a conflict when an edited traveler no longer exists live', () => {
    expect(mergeTravelerEdits(base, edit(2, { passportName: 'C' }), base.slice(0, 2), counts)).toEqual({ conflict: true });
  });
  it('ignores untouched travelers that were removed live', () => {
    expect(mergeTravelerEdits(base, edit(0, { room: 'twin' }), base.slice(0, 2), counts)).toEqual({ merged: [{ ...base[0], room: 'twin' }, base[1]] });
  });
  it('reports a conflict when the live traveler at that index changed category', () => {
    const live: Traveler[] = [base[0], { category: 'tenK' }, base[2]];
    expect(mergeTravelerEdits(base, edit(1, { passportName: 'X' }), live, counts)).toEqual({ conflict: true });
  });

  describe('counts guard (index shift)', () => {
    const t: Traveler[] = [{ category: 'full', passportName: 'A' }, { category: 'tenK', passportName: 'B' }, { category: 'tenK' }];
    const editC = t.map((x, i) => (i === 2 ? { ...x, dob: '1990-05-05' } : { ...x }));
    const c = { full: 1, tenK: 2, companion: 0, child: 0, infant: 0 };
    it('earlier category grew -> conflict (indexes shifted)', () => {
      const live: Traveler[] = [t[0], { category: 'full' }, t[1], t[2]];
      expect(mergeTravelerEdits(t, editC, live, { base: c, live: { ...c, full: 2 } })).toEqual({ conflict: true });
    });
    it('later category grew -> conflict', () => {
      const live: Traveler[] = [...t, { category: 'companion' }];
      expect(mergeTravelerEdits(t, editC, live, { base: c, live: { ...c, companion: 1, child: 0, infant: 0 } })).toEqual({ conflict: true });
    });
    it('counts unchanged + field edits -> merges', () => {
      expect(mergeTravelerEdits(t, editC, t, { base: c, live: { ...c } })).toEqual({ merged: editC });
    });
  });
});

describe('defaultPaymentType', () => {
  it('is deposit until the deposit is covered', () => {
    expect(defaultPaymentType(0, 10000)).toBe('deposit');
    expect(defaultPaymentType(9999, 10000)).toBe('deposit');
    expect(defaultPaymentType(10000, 10000)).toBe('balance');
    expect(defaultPaymentType(0, 0)).toBe('balance');
  });
});
