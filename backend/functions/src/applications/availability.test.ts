import { beforeEach, describe, expect, it } from 'vitest';
import { recomputeAvailability } from './availability';
import { submitApplicationCore } from './submit';
import { clearFirestore, seedTourConfig, testDb, validInput } from '../test/helpers';
import { COL, TOUR_ID } from '../lib/collections';

const now = new Date('2026-10-20T03:00:00Z');

describe('recomputeAvailability', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('writes bib and seat usage, excluding cancelled applications', async () => {
    await submitApplicationCore(testDb(), validInput(), now); // mnl: 2 full + 1 companion
    await submitApplicationCore(testDb(), validInput({ departureId: 'ceb', counts: { full: 0, tenK: 1, companion: 0, child: 0, infant: 0 } }), now);
    const cancelled = validInput();
    await submitApplicationCore(testDb(), cancelled, now);
    await testDb().collection(COL.applications).doc(cancelled.idempotencyKey).update({ status: 'cancelled' });

    await recomputeAvailability(testDb());
    const av = (await testDb().collection(COL.availability).doc(TOUR_ID).get()).data()!;
    expect(av).toMatchObject({
      bibsUsed: 3,
      bibsTotal: 200,
      departures: { mnl: { seatsUsed: 3, seatCapacity: 120 }, ceb: { seatsUsed: 1, seatCapacity: 80 } },
    });
    expect(av.updatedAt).toBeDefined();
  });

  it('counts children and infants as seats (not bibs) and reads older applications without child/infant keys', async () => {
    await submitApplicationCore(testDb(), validInput({ counts: { full: 1, tenK: 0, companion: 1, child: 1, infant: 1 } }), now);
    // 아동·유아 도입 이전에 저장된 신청서 (counts 에 child/infant 키 없음)
    await testDb().collection(COL.applications).doc('legacy').set({ status: 'new', departure: { id: 'mnl' }, counts: { full: 1, tenK: 1, companion: 0 } });
    const av = await recomputeAvailability(testDb());
    expect(av).toMatchObject({ bibsUsed: 3, departures: { mnl: { seatsUsed: 6, seatCapacity: 120 } } });
  });

  it('does nothing when there is no tour config', async () => {
    await clearFirestore();
    expect(await recomputeAvailability(testDb())).toBeNull();
    expect((await testDb().collection(COL.availability).doc(TOUR_ID).get()).exists).toBe(false);
  });
});
