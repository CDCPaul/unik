import { describe, expect, it } from 'vitest';
import { computeDepositDue, computePricing, inferDepositPerPax, missingPriceCategories, promoEligiblePax } from './pricing';
import type { PricingInput } from './pricing';

const departure = {
  prices: { full: 80000, tenK: 75000, companion: 70000, childTenK: 55000, childTenKNoBed: 52000, child: 50000, childNoBed: 48000, infant: 8000 },
  singleSupplement: 15000,
};

function input(over: Partial<PricingInput> = {}): PricingInput {
  return {
    departure,
    counts: { full: 2, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
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
        counts: { full: 0, tenK: 1, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
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
        counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
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
        counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
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
  const family = { full: 1, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 2, childNoBed: 0, infant: 1 };
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
        counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 1 },
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
      input({ counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 1, childNoBed: 0, infant: 1 }, travelers: [{}, {}, {}], depositPerPax: 60000 }),
    );
    expect(p.depositDue).toBe(60000 + 50000 + 8000);
    expect(computeDepositDue(p.lines, 60000, 100000)).toBe(100000);
  });
});

describe('missingPriceCategories', () => {
  it('lists only requested categories whose price is missing or invalid', () => {
    const old = { full: 80000, tenK: 75000, companion: 70000 };
    expect(missingPriceCategories(old, { full: 1, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 })).toEqual([]);
    expect(missingPriceCategories(old, { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 1, childNoBed: 0, infant: 1 })).toEqual(['child', 'infant']);
    expect(missingPriceCategories({ ...old, child: -1, infant: 1.5 }, { full: 0, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 1, childNoBed: 0, infant: 1 })).toEqual(['child', 'infant']);
    expect(missingPriceCategories(undefined, { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 })).toEqual(['full']);
  });
});

describe('inferDepositPerPax', () => {
  it('recovers the per-person deposit from a snapshot where infant deposits were capped', () => {
    const p = computePricing(input({ counts: { full: 1, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 2, childNoBed: 0, infant: 1 }, travelers: [] }));
    expect(inferDepositPerPax(p, 5)).toBe(10000);
  });
  it('recovers a deposit above the child price', () => {
    const p = computePricing(input({ counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 1, childNoBed: 0, infant: 1 }, travelers: [], depositPerPax: 60000 }));
    expect(inferDepositPerPax(p, 3)).toBe(60000);
  });
  it('falls back to deposit ÷ travelers when the snapshot has no lines', () => {
    expect(inferDepositPerPax({ lines: [], depositDue: 20000 }, 2)).toBe(10000);
    expect(inferDepositPerPax({ lines: [], depositDue: 20000 }, 0)).toBe(0);
  });
});

describe('four child types with a promo (2026-11-06 quotation prices)', () => {
  const quote = {
    prices: { full: 55888, tenK: 52888, companion: 46888, childTenK: 47888, childTenKNoBed: 46888, child: 40888, childNoBed: 39888, infant: 10888 },
    singleSupplement: 15000,
  };
  const counts = { full: 1, tenK: 0, companion: 1, childTenK: 1, childTenKNoBed: 1, child: 1, childNoBed: 1, infant: 1 };
  const travelers = [
    { category: 'full' as const, room: 'twin' as const },
    { category: 'companion' as const, room: 'twin' as const },
    { category: 'childTenK' as const, room: 'single' as const },
    { category: 'childTenKNoBed' as const, room: 'single' as const }, // 침대 없음: 무시
    { category: 'child' as const, room: 'twin' as const },
    { category: 'childNoBed' as const, room: 'single' as const }, // 침대 없음: 무시
    { category: 'infant' as const, room: 'single' as const }, // 유아: 무시
  ];

  it('prices each child type, excludes the infant from the promo and caps deposits at unit prices', () => {
    const p = computePricing({
      departure: quote,
      counts,
      travelers,
      promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 1000 },
      depositPerPax: 20000,
    });
    expect(p.lines.map((l) => [l.category, l.unitPrice])).toEqual([
      ['full', 55888],
      ['companion', 46888],
      ['childTenK', 47888],
      ['childTenKNoBed', 46888],
      ['child', 40888],
      ['childNoBed', 39888],
      ['infant', 10888],
    ]);
    const base = 55888 + 46888 + 47888 + 46888 + 40888 + 39888 + 10888;
    expect(p.singleSupplements).toBe(15000); // childTenK 한 명만
    expect(p.subtotal).toBe(base + 15000);
    expect(promoEligiblePax(counts)).toBe(6); // 유아 제외, 아동 4유형 포함
    expect(p.promo?.discountTotal).toBe(6000);
    expect(p.total).toBe(base + 15000 - 6000);
    // 20,000 × 6 + 유아는 단가 10,888 까지만
    expect(p.depositDue).toBe(20000 * 6 + 10888);
  });

  it('applies a percent promo to every child line but not the infant line', () => {
    const p = computePricing({
      departure: quote,
      counts,
      travelers,
      promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 10 },
      depositPerPax: 45000,
    });
    const eligible = 55888 + 46888 + 47888 + 46888 + 40888 + 39888;
    expect(p.promo?.discountTotal).toBe(Math.floor(eligible / 10));
    // 단가가 45,000 보다 낮은 사람(아동 응원 2유형·유아)은 단가만큼만
    expect(p.depositDue).toBe(45000 * 4 + 40888 + 39888 + 10888);
    expect(p.depositDue).toBeLessThan(p.total);
  });

  it('reports missing prices of new types only when they are requested', () => {
    const old = { full: 55888, tenK: 52888, companion: 46888, child: 40888, infant: 10888 };
    expect(missingPriceCategories(old, { ...counts, childTenK: 0, childTenKNoBed: 0, childNoBed: 0 })).toEqual([]);
    expect(missingPriceCategories(old, counts)).toEqual(['childTenK', 'childTenKNoBed', 'childNoBed']);
  });
});
