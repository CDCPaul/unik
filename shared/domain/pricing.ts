import { CATEGORIES } from './types';
import type { Category, Counts, Departure, Pricing, PricingLine, PromoCode, PromoSnapshot, Traveler } from './types';
import { hasRoomChoice } from './counts';

/** 프로모 할인이 적용되지 않는 유형 */
export const PROMO_EXCLUDED_CATEGORIES: readonly Category[] = ['infant'];

const isPromoEligible = (c: Category) => !PROMO_EXCLUDED_CATEGORIES.includes(c);

/** 금액으로 쓸 수 있는 값인가 (0 이상의 정수) */
export function isValidPrice(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
}

/**
 * counts 에 포함된(1명 이상) 유형 중 출발편 가격이 없거나 잘못된 유형.
 * 예전 설정에는 child/infant 가격이 없을 수 있다.
 */
export function missingPriceCategories(prices: Partial<Record<Category, unknown>> | undefined, counts: Counts): Category[] {
  return CATEGORIES.filter((c) => counts[c] > 0 && !isValidPrice(prices?.[c]));
}

/** 프로모 할인 대상 인원 (유아 제외) */
export function promoEligiblePax(counts: Counts): number {
  return CATEGORIES.filter(isPromoEligible).reduce((s, c) => s + counts[c], 0);
}

/** 1인 예약금은 그 사람의 단가를 넘지 않는다. 합계는 총액을 넘지 않는다. */
export function computeDepositDue(lines: Pick<PricingLine, 'qty' | 'unitPrice'>[], depositPerPax: number, total: number): number {
  const sum = lines.reduce((s, l) => s + Math.min(depositPerPax, l.unitPrice) * l.qty, 0);
  return Math.max(0, Math.min(sum, total));
}

/**
 * 저장된 가격 스냅샷에서 신청 당시의 1인 예약금을 되살린다.
 * depositDue = Σ min(d, unitPrice)×qty 를 d 에 대해 푼다 (단가로 잘린 줄은 단가만큼 낸다).
 * 줄 정보가 없거나 풀 수 없으면 depositDue ÷ 인원 으로 계산한다 (예전 방식).
 */
export function inferDepositPerPax(pricing: Pick<Pricing, 'lines' | 'depositDue'>, pax: number): number {
  const lines = (pricing.lines ?? []).filter((l) => l.qty > 0 && isValidPrice(l.unitPrice));
  const linePax = lines.reduce((s, l) => s + l.qty, 0);
  if (lines.length === 0 || linePax !== pax) return pax > 0 ? Math.round(pricing.depositDue / pax) : 0;
  const sorted = [...lines].sort((a, b) => a.unitPrice - b.unitPrice);
  let capped = 0; // 단가로 잘린 줄들의 예약금 합
  let rest = linePax; // 아직 잘리지 않은 인원
  for (let i = 0; i <= sorted.length; i++) {
    const d = rest > 0 ? (pricing.depositDue - capped) / rest : Infinity;
    const lower = i > 0 ? sorted[i - 1].unitPrice : 0;
    const upper = i < sorted.length ? sorted[i].unitPrice : Infinity;
    if (d >= lower && d <= upper) return Number.isFinite(d) ? Math.round(d) : sorted[sorted.length - 1].unitPrice;
    if (i < sorted.length) {
      capped += sorted[i].unitPrice * sorted[i].qty;
      rest -= sorted[i].qty;
    }
  }
  return pax > 0 ? Math.round(pricing.depositDue / pax) : 0;
}

export interface PricingInput {
  departure: Pick<Departure, 'prices' | 'singleSupplement'>;
  counts: Counts;
  travelers: (Pick<Traveler, 'room'> & { category?: Category })[];
  promo: Pick<PromoCode, 'code' | 'agencyName' | 'discountType' | 'discountValue'> | null;
  depositPerPax: number;
}

/** 싱글룸 인원 (객실 선택이 없는 유아는 세지 않는다) */
export function singleRoomCount(travelers: (Pick<Traveler, 'room'> & { category?: Category })[]): number {
  return travelers.filter((t) => t.room === 'single' && (!t.category || hasRoomChoice(t.category))).length;
}

/** 프로모 할인액. 유아 줄·싱글 추가요금에는 할인이 없고, 할인 대상 금액을 넘지 않는다. */
export function computePromoDiscount(
  lines: PricingLine[],
  counts: Counts,
  promo: { type: PromoSnapshot['type']; value: number },
): number {
  const eligibleBase = lines.filter((l) => isPromoEligible(l.category)).reduce((s, l) => s + l.amount, 0);
  const raw = promo.type === 'fixed' ? promo.value * promoEligiblePax(counts) : Math.floor((eligibleBase * promo.value) / 100);
  return Math.min(Math.max(raw, 0), eligibleBase);
}

export function computePricing(input: PricingInput): Pricing {
  const lines: PricingLine[] = CATEGORIES.filter((c) => input.counts[c] > 0).map((c) => ({
    category: c,
    qty: input.counts[c],
    unitPrice: input.departure.prices[c],
    amount: input.counts[c] * input.departure.prices[c],
  }));
  const base = lines.reduce((sum, line) => sum + line.amount, 0);
  const singleSupplements = singleRoomCount(input.travelers) * input.departure.singleSupplement;

  let promo: PromoSnapshot | null = null;
  if (input.promo) {
    promo = {
      code: input.promo.code,
      agencyName: input.promo.agencyName,
      type: input.promo.discountType,
      value: input.promo.discountValue,
      discountTotal: computePromoDiscount(lines, input.counts, { type: input.promo.discountType, value: input.promo.discountValue }),
    };
  }

  const subtotal = base + singleSupplements;
  const total = subtotal - (promo ? promo.discountTotal : 0);
  return {
    lines,
    singleSupplements,
    subtotal,
    promo,
    total,
    depositDue: computeDepositDue(lines, input.depositPerPax, total),
  };
}
