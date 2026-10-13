import { describe, expect, it } from 'vitest';
import { computeDepositDue, computePricing, inferDepositPerPax, missingPriceCategories, promoEligiblePax } from './pricing';
import type { PricingInput } from './pricing';

const departure = {
  prices: { full: 80000, tenK: 75000, companion: 70000, child: 50000, infant: 8000 },
  singleSupplement: 15000,
};

function input(over: Partial<PricingInput> = {}): PricingInput {
  return {
    departure,
    counts: { full: 2, tenK: 0, companion: 1, child: 0, infant: 0 },
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
        counts: { full: 0, tenK: 1, companion: 0, child: 0, infant: 0 },
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
        counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 },
        travelers: [{ room: 'single' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 100000 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(80000);
    expect(p.total).toBe(15000);
  });

  it('caps the deposit at the total when a 100% promo makes the total 0', () => {
    const p = computePricing(
      input({ promo: { code: 'TA-FREE', agencyName: 'X', discountType: 'percent', discountValue: 100 } }),
    );
    expect(p.total).toBe(0);
    expect(p.depositDue).toBe(0);
  });

  it('caps the deposit at the total when the total is below the per-pax deposit sum', () => {
    const p = computePricing(
      input({
        counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 },
        travelers: [{}],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 75000 },
        depositPerPax: 10000,
      }),
    );
    expect(p.total).toBe(5000);
    expect(p.depositDue).toBe(5000);
  });

  it('keeps the full per-pax deposit when the total exceeds it', () => {
    expect(computePricing(input()).depositDue).toBe(30000);
  });
});

describe('child and infant pricing', () => {
  const family = { full: 1, tenK: 0, companion: 1, child: 2, infant: 1 };
  const familyTravelers = [{ category: 'full' as const }, { category: 'companion' as const }, { category: 'child' as const }, { category: 'child' as const }, { category: 'infant' as const }];

  it('prices a mixed family per category', () => {
    const p = computePricing(input({ counts: family, travelers: familyTravelers }));
    expect(p.lines).toEqual([
      { category: 'full', qty: 1, unitPrice: 80000, amount: 80000 },
      { category: 'companion', qty: 1, unitPrice: 70000, amount: 70000 },
      { category: 'child', qty: 2, unitPrice: 50000, amount: 100000 },
      { category: 'infant', qty: 1, unitPrice: 8000, amount: 8000 },
    ]);
    expect(p.subtotal).toBe(258000);
    expect(p.total).toBe(258000);
    // 10,000 × 4 + 유아는 단가 8,000 까지만
    expect(p.depositDue).toBe(48000);
  });

  it('does not give a fixed per-person discount to infants', () => {
    expect(promoEligiblePax(family)).toBe(4);
    const p = computePricing(
      input({ counts: family, travelers: familyTravelers, promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 2000 } }),
    );
    expect(p.promo?.discountTotal).toBe(8000);
    expect(p.total).toBe(250000);
  });

  it('applies a percent discount to the base excluding infant lines', () => {
    const p = computePricing(
      input({ counts: family, travelers: familyTravelers, promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 10 } }),
    );
    expect(p.promo?.discountTotal).toBe(25000); // 10% of 250,000 (infant 8,000 excluded)
    expect(p.total).toBe(233000);
  });

  it('never discounts the infant price even when a fixed discount is larger than the eligible base', () => {
    const p = computePricing(
      input({
        counts: { full: 1, tenK: 0, companion: 0, child: 0, infant: 1 },
        travelers: [{}, { category: 'infant' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 100000 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(80000);
    expect(p.total).toBe(8000);
    expect(p.depositDue).toBe(8000);
  });

  it('charges the single supplement for a child but ignores a room on an infant', () => {
    const p = computePricing(
      input({
        counts: family,
        travelers: [{ category: 'full' }, { category: 'companion' }, { category: 'child', room: 'single' }, { category: 'child' }, { category: 'infant', room: 'single' }],
      }),
    );
    expect(p.singleSupplements).toBe(15000);
  });

  it('caps each person deposit at that person unit price', () => {
    const p = computePricing(
      input({ counts: { full: 1, tenK: 0, companion: 0, child: 1, infant: 1 }, travelers: [{}, {}, {}], depositPerPax: 60000 }),
    );
    expect(p.depositDue).toBe(60000 + 50000 + 8000);
    expect(computeDepositDue(p.lines, 60000, 100000)).toBe(100000);
  });
});

describe('missingPriceCategories', () => {
  it('lists only requested categories whose price is missing or invalid', () => {
    const old = { full: 80000, tenK: 75000, companion: 70000 };
    expect(missingPriceCategories(old, { full: 1, tenK: 0, companion: 1, child: 0, infant: 0 })).toEqual([]);
    expect(missingPriceCategories(old, { full: 1, tenK: 0, companion: 0, child: 1, infant: 1 })).toEqual(['child', 'infant']);
    expect(missingPriceCategories({ ...old, child: -1, infant: 1.5 }, { full: 0, tenK: 0, companion: 1, child: 1, infant: 1 })).toEqual(['child', 'infant']);
    expect(missingPriceCategories(undefined, { full: 1, tenK: 0, companion: 0, child: 0, infant: 0 })).toEqual(['full']);
  });
});

describe('inferDepositPerPax', () => {
  it('recovers the per-person deposit from a snapshot where infant deposits were capped', () => {
    const p = computePricing(input({ counts: { full: 1, tenK: 0, companion: 1, child: 2, infant: 1 }, travelers: [] }));
    expect(inferDepositPerPax(p, 5)).toBe(10000);
  });
  it('recovers a deposit above the child price', () => {
    const p = computePricing(input({ counts: { full: 1, tenK: 0, companion: 0, child: 1, infant: 1 }, travelers: [], depositPerPax: 60000 }));
    expect(inferDepositPerPax(p, 3)).toBe(60000);
  });
  it('falls back to deposit ÷ travelers when the snapshot has no lines', () => {
    expect(inferDepositPerPax({ lines: [], depositDue: 20000 }, 2)).toBe(10000);
    expect(inferDepositPerPax({ lines: [], depositDue: 20000 }, 0)).toBe(0);
  });
});
