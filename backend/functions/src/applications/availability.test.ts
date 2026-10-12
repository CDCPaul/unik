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
    await submitApplicationCore(testDb(), validInput({ departureId: 'ceb', counts: { full: 0, tenK: 1, companion: 0 } }), now);
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

  it('does nothing when there is no tour config', async () => {
    await clearFirestore();
    expect(await recomputeAvailability(testDb())).toBeNull();
    expect((await testDb().collection(COL.availability).doc(TOUR_ID).get()).exists).toBe(false);
  });
});
