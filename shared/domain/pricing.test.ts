import { describe, expect, it } from 'vitest';
import { computePricing } from './pricing';
import type { PricingInput } from './pricing';

const departure = {
  prices: { full: 80000, tenK: 75000, companion: 70000 },
  singleSupplement: 15000,
};

function input(over: Partial<PricingInput> = {}): PricingInput {
  return {
    departure,
    counts: { full: 2, tenK: 0, companion: 1 },
    travelers: [{}, {}, {}],
    promo: null,
    depositPerPax: 10000,
    ...over,
  };
}

describe('computePricing', () => {
  it('prices each category without promo and omits zero lines', () => {
    const p = computePricing(input());
    expect(p.lines).toEqual([
      { category: 'full', qty: 2, unitPrice: 80000, amount: 160000 },
      { category: 'companion', qty: 1, unitPrice: 70000, amount: 70000 },
    ]);
    expect(p.subtotal).toBe(230000);
    expect(p.promo).toBeNull();
    expect(p.total).toBe(230000);
    expect(p.depositDue).toBe(30000);
  });

  it('applies a fixed discount per person', () => {
    const p = computePricing(
      input({ promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', discountType: 'fixed', discountValue: 2000 } }),
    );
    expect(p.promo).toEqual({ code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 });
    expect(p.total).toBe(224000);
  });

  it('applies a percent discount on base prices, floored to the peso', () => {
    const p = computePricing(
      input({
        counts: { full: 0, tenK: 1, companion: 0 },
        travelers: [{}],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 3.33 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(2497); // 75000 * 3.33% = 2497.5
    expect(p.total).toBe(72503);
  });

  it('adds single supplements and never discounts them', () => {
    const p = computePricing(
      input({
        travelers: [{ room: 'single' }, {}, { room: 'twin' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 5 },
      }),
    );
    expect(p.singleSupplements).toBe(15000);
    expect(p.subtotal).toBe(245000);
    expect(p.promo?.discountTotal).toBe(11500); // 5% of 230000
    expect(p.total).toBe(233500);
  });

  it('caps a fixed discount at the base price', () => {
    const p = computePricing(
      input({
        counts: { full: 1, tenK: 0, companion: 0 },
        travelers: [{ room: 'single' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 100000 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(80000);
    expect(p.total).toBe(15000);
  });
});
