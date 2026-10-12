import { beforeEach, describe, expect, it } from 'vitest';
import { checkPromoCodeCore } from './promo';
import { submitApplicationCore } from './submit';
import { clearFirestore, seedPromo, seedTourConfig, testDb, validInput } from '../test/helpers';

const now = new Date('2026-10-20T03:00:00Z');

describe('checkPromoCodeCore', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('returns not_found for unknown or malformed codes', async () => {
    expect(await checkPromoCodeCore(testDb(), { code: 'NOPE' }, now)).toEqual({ valid: false, reason: 'not_found' });
    expect(await checkPromoCodeCore(testDb(), { code: 'a_b' }, now)).toEqual({ valid: false, reason: 'not_found' });
  });

  it('returns agency and discount for a valid code, case-insensitive', async () => {
    await seedPromo('TA-SUNRISE');
    expect(await checkPromoCodeCore(testDb(), { code: ' ta-sunrise ', pax: 3 }, now)).toEqual({
      valid: true,
      code: 'TA-SUNRISE',
      agencyName: 'Sunrise Travel',
      discountType: 'fixed',
      discountValue: 2000,
      description: 'PHP 2,000 off per person',
    });
  });

  it('accounts for existing usage when checking maxPax', async () => {
    await seedPromo('TA-SMALL', { maxPax: 4 });
    await submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now); // 3 pax
    expect(await checkPromoCodeCore(testDb(), { code: 'TA-SMALL', pax: 1 }, now)).toMatchObject({ valid: true });
    expect(await checkPromoCodeCore(testDb(), { code: 'TA-SMALL', pax: 2 }, now)).toEqual({
      valid: false,
      reason: 'limit_reached',
    });
  });
});
