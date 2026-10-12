import { beforeEach, describe, expect, it } from 'vitest';
import { submitApplicationCore } from './submit';
import { SubmitError } from './errors';
import { baseConfig, clearFirestore, seedPromo, seedTourConfig, testDb, validInput } from '../test/helpers';
import { COL, TOUR_ID } from '../lib/collections';

const now = new Date('2026-10-20T03:00:00Z');

async function expectSubmitError(p: Promise<unknown>, code: string, reason?: string) {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(SubmitError);
  expect(err.code).toBe(code);
  if (reason) expect(err.details?.reason).toBe(reason);
}

describe('submitApplicationCore', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('creates an application with server-side pricing and sequential numbers', async () => {
    const first = await submitApplicationCore(testDb(), { ...validInput(), pricing: { total: 1 } }, now);
    expect(first).toMatchObject({ appNo: 'APP-0001', status: 'new', duplicate: false });
    expect(first.pricing.total).toBe(230000);

    const second = await submitApplicationCore(testDb(), validInput(), now);
    expect(second.appNo).toBe('APP-0002');

    const docs = await testDb().collection(COL.applications).get();
    expect(docs.size).toBe(2);
    const data = docs.docs.find((d) => d.data().appNo === 'APP-0001')!.data();
    expect(data.pricing.total).toBe(230000);
    expect(data.travelers).toHaveLength(3);
    expect(data.completeness).toEqual({ filled: 0, total: 22 });
    expect(data.departure).toEqual({ id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' });
    expect(data.statusHistory[0]).toMatchObject({ status: 'new', by: 'system' });
    expect(data.payments).toEqual([]);
    expect(data.paidTotal).toBe(0);
  });

  it('returns the existing application for a repeated idempotencyKey', async () => {
    const input = validInput();
    const a = await submitApplicationCore(testDb(), input, now);
    const b = await submitApplicationCore(testDb(), input, now);
    expect(b).toMatchObject({ appNo: a.appNo, duplicate: true });
    expect((await testDb().collection(COL.applications).get()).size).toBe(1);
  });

  it('returns the existing application on retry even after applications close', async () => {
    const input = validInput();
    await submitApplicationCore(testDb(), input, now);
    await seedTourConfig({ acceptingApplications: false });
    const retry = await submitApplicationCore(testDb(), input, now);
    expect(retry).toMatchObject({ appNo: 'APP-0001', duplicate: true });
    expect((await testDb().collection(COL.applications).get()).size).toBe(1);
  });

  it('applies a valid promo code', async () => {
    await seedPromo('TA-SUNRISE');
    const r = await submitApplicationCore(testDb(), validInput({ promoCode: 'ta-sunrise' }), now);
    expect(r.pricing.promo).toMatchObject({ code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', discountTotal: 6000 });
    expect(r.pricing.total).toBe(224000);
  });

  it('rejects unknown, inactive and over-limit promo codes', async () => {
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ promoCode: 'NOPE' }), now), 'promo_invalid', 'not_found');
    await seedPromo('TA-OFF', { active: false });
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ promoCode: 'TA-OFF' }), now), 'promo_invalid', 'inactive');
    await seedPromo('TA-SMALL', { maxPax: 4 });
    await submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now); // 3 pax used
    await expectSubmitError(
      submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now),
      'promo_invalid',
      'limit_reached',
    );
  });

  it('rejects when applications are closed or the departure is closed', async () => {
    await seedTourConfig({ acceptingApplications: false });
    await expectSubmitError(submitApplicationCore(testDb(), validInput(), now), 'closed');
    await seedTourConfig();
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ departureId: 'xyz' }), now), 'departure_closed');
  });

  it('rejects a departure whose configured prices are missing or not whole non-negative numbers', async () => {
    const [mnl, ceb] = baseConfig.departures;
    const broken = (over: Record<string, unknown>) => ({ ...mnl, ...over }) as typeof mnl;
    const bad = [
      broken({ prices: { tenK: 75000, companion: 70000 } }), // full 누락
      broken({ prices: { ...mnl.prices, tenK: -1 } }),
      broken({ prices: { ...mnl.prices, companion: 70000.5 } }),
      broken({ singleSupplement: null }),
    ];
    for (const departure of bad) {
      await seedTourConfig({ departures: [departure, ceb] });
      await expectSubmitError(submitApplicationCore(testDb(), validInput(), now), 'departure_closed');
    }
    await seedTourConfig({ depositPerPax: -5 });
    await expectSubmitError(submitApplicationCore(testDb(), validInput(), now), 'departure_closed');
    expect((await testDb().collection(COL.applications).get()).size).toBe(0);
  });

  it('puts the application on the waitlist when bibs run out', async () => {
    await seedTourConfig({ bibQuota: { total: 3 } });
    expect((await submitApplicationCore(testDb(), validInput(), now)).status).toBe('new'); // 2 bibs
    expect((await submitApplicationCore(testDb(), validInput(), now)).status).toBe('waitlist'); // needs 2, 1 left
    const companionsOnly = validInput({ counts: { full: 0, tenK: 0, companion: 2 } });
    expect((await submitApplicationCore(testDb(), companionsOnly, now)).status).toBe('new');
  });

  it('two concurrent submissions for the last bib: exactly one gets it', async () => {
    await seedTourConfig({ bibQuota: { total: 1 } });
    const solo = () => validInput({ counts: { full: 1, tenK: 0, companion: 0 } });
    const results = await Promise.all([
      submitApplicationCore(testDb(), solo(), now),
      submitApplicationCore(testDb(), solo(), now),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(['new', 'waitlist']);
    expect(results.map((r) => r.appNo).sort()).toEqual(['APP-0001', 'APP-0002']);
  });

  it('stores the counter so numbering survives restarts', async () => {
    await submitApplicationCore(testDb(), validInput(), now);
    const counter = await testDb().collection(COL.counters).doc(TOUR_ID).get();
    expect(counter.data()).toEqual({ appSeq: 1 });
  });

  it('rate-limits many applications from the same email within an hour', async () => {
    for (let i = 0; i < 5; i++) {
      await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now);
    }
    const err = await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now).then(
      () => null,
      (e) => e,
    );
    expect(err).toBeInstanceOf(SubmitError);
    expect(err.code).toBe('rate_limited');
    const other = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
    other.lead = { ...other.lead, email: 'someone.else@example.com' };
    expect((await submitApplicationCore(testDb(), other, now)).status).toBe('new');
  });

  it('rate-limits many applications from the same client IP hash within an hour', async () => {
    for (let i = 0; i < 10; i++) {
      const input = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
      input.lead = { ...input.lead, email: `p${i}@example.com` };
      await submitApplicationCore(testDb(), input, now, { clientIpHash: 'abc' });
    }
    const input = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
    input.lead = { ...input.lead, email: 'p99@example.com' };
    await expectSubmitError(submitApplicationCore(testDb(), input, now, { clientIpHash: 'abc' }), 'rate_limited');
    expect((await submitApplicationCore(testDb(), input, now, { clientIpHash: 'other' })).status).toBe('new');
  });

  it('ignores submissions older than an hour for rate limiting', async () => {
    const earlier = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    for (let i = 0; i < 5; i++) {
      await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), earlier);
    }
    expect((await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now)).status).toBe('new');
  });
});
