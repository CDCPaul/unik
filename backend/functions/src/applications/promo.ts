import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  describeDiscount,
  evaluatePromo,
  isValidPromoCodeFormat,
  normalizePromoCode,
  promoUsagePax,
  type DiscountType,
  type PromoCode,
  type PromoInvalidReason,
} from '../shared-domain';
import { COL } from '../lib/collections';
import { toSummary } from './summary';

const checkInput = z.object({
  code: z.string().max(40),
  pax: z.number().int().min(1).max(10).default(1),
});

export type PromoCheckResult =
  | { valid: false; reason: PromoInvalidReason }
  | {
      valid: true;
      code: string;
      agencyName: string;
      discountType: DiscountType;
      discountValue: number;
      description: string;
    };

export async function checkPromoCodeCore(db: Firestore, raw: unknown, now = new Date()): Promise<PromoCheckResult> {
  const parsed = checkInput.safeParse(raw);
  if (!parsed.success) return { valid: false, reason: 'not_found' };
  const code = normalizePromoCode(parsed.data.code);
  if (!isValidPromoCodeFormat(code)) return { valid: false, reason: 'not_found' };

  const snap = await db.collection(COL.promoCodes).doc(code).get();
  const promo = snap.exists ? ({ ...snap.data(), code } as PromoCode) : null;
  const used = promo
    ? promoUsagePax(
        (await db.collection(COL.applications).where('pricing.promo.code', '==', code).get()).docs.map((d) =>
          toSummary(d.data()),
        ),
        code,
      )
    : 0;
  const evaluation = evaluatePromo(promo, { now, usedPax: used, requestedPax: parsed.data.pax });
  if (!evaluation.valid || !promo) return { valid: false, reason: evaluation.valid ? 'not_found' : evaluation.reason };
  return {
    valid: true,
    code,
    agencyName: promo.agencyName,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    description: describeDiscount(promo.discountType, promo.discountValue),
  };
}
