import type { ApplicationSummary, DiscountType, PromoCode } from './types';
import { promoEligiblePax } from './pricing';
import { formatPHP } from './format';

/** 영문 대문자·숫자·하이픈·밑줄 3–20자 (TA 지점 코드에 GRH_C 같은 밑줄이 쓰인다) */
export const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidPromoCodeFormat(code: string): boolean {
  return PROMO_CODE_PATTERN.test(code);
}

/** 마닐라(UTC+8) 기준 YYYY-MM-DD */
export function manilaDate(now: Date): string {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export type PromoInvalidReason = 'not_found' | 'inactive' | 'expired' | 'limit_reached';
export type PromoEvaluation = { valid: true } | { valid: false; reason: PromoInvalidReason };

export function evaluatePromo(
  promo: Pick<PromoCode, 'active' | 'validUntil' | 'maxPax'> | null,
  ctx: { now: Date; usedPax: number; requestedPax: number },
): PromoEvaluation {
  if (!promo) return { valid: false, reason: 'not_found' };
  if (!promo.active) return { valid: false, reason: 'inactive' };
  if (promo.validUntil && manilaDate(ctx.now) > promo.validUntil) return { valid: false, reason: 'expired' };
  if (promo.maxPax !== null && ctx.usedPax + ctx.requestedPax > promo.maxPax) {
    return { valid: false, reason: 'limit_reached' };
  }
  return { valid: true };
}

/** 프로모 인원 제한(maxPax)에 쓰는 사용 인원. 할인 대상이 아닌 유아는 세지 않는다. */
export function promoUsagePax(apps: ApplicationSummary[], code: string): number {
  return apps
    .filter((a) => a.promoCode === code && a.status !== 'cancelled')
    .reduce((sum, a) => sum + promoEligiblePax(a.counts), 0);
}

export function describeDiscount(type: DiscountType, value: number): string {
  if (type === 'fixed' && value === 0) return 'Referral code (no discount)';
  return type === 'fixed' ? `${formatPHP(value)} off per person` : `${value}% off`;
}
