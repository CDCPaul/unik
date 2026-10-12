import { CATEGORIES } from './types';
import type { Counts, Departure, Pricing, PricingLine, PromoCode, PromoSnapshot, Traveler } from './types';
import { totalPax } from './counts';

export interface PricingInput {
  departure: Pick<Departure, 'prices' | 'singleSupplement'>;
  counts: Counts;
  travelers: Pick<Traveler, 'room'>[];
  promo: Pick<PromoCode, 'code' | 'agencyName' | 'discountType' | 'discountValue'> | null;
  depositPerPax: number;
}

export function computePricing(input: PricingInput): Pricing {
  const lines: PricingLine[] = CATEGORIES.filter((c) => input.counts[c] > 0).map((c) => ({
    category: c,
    qty: input.counts[c],
    unitPrice: input.departure.prices[c],
    amount: input.counts[c] * input.departure.prices[c],
  }));
  const base = lines.reduce((sum, line) => sum + line.amount, 0);
  const singles = input.travelers.filter((t) => t.room === 'single').length;
  const singleSupplements = singles * input.departure.singleSupplement;
  const pax = totalPax(input.counts);

  let promo: PromoSnapshot | null = null;
  if (input.promo) {
    const raw =
      input.promo.discountType === 'fixed'
        ? input.promo.discountValue * pax
        : Math.floor((base * input.promo.discountValue) / 100);
    promo = {
      code: input.promo.code,
      agencyName: input.promo.agencyName,
      type: input.promo.discountType,
      value: input.promo.discountValue,
      discountTotal: Math.min(Math.max(raw, 0), base),
    };
  }

  const subtotal = base + singleSupplements;
  return {
    lines,
    singleSupplements,
    subtotal,
    promo,
    total: subtotal - (promo ? promo.discountTotal : 0),
    depositDue: input.depositPerPax * pax,
  };
}
