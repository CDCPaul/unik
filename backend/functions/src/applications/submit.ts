import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  buildTravelers,
  computeAvailability,
  computeCompleteness,
  computePricing,
  evaluatePromo,
  exceedsCapacity,
  formatAppNo,
  promoUsagePax,
  totalPax,
  type Pricing,
  type PromoCode,
} from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';
import { loadTourConfig } from '../lib/tourConfig';
import { stripUndefined } from '../lib/strip';
import { SubmitError } from './errors';
import { parseSubmitInput } from './input';
import { toSummary } from './summary';

export interface SubmitResult {
  appNo: string;
  status: 'new' | 'waitlist';
  pricing: Pricing;
  duplicate: boolean;
}

export async function submitApplicationCore(db: Firestore, raw: unknown, now = new Date()): Promise<SubmitResult> {
  const input = parseSubmitInput(raw);
  const appRef = db.collection(COL.applications).doc(input.idempotencyKey);

  // 같은 idempotencyKey 재시도는 접수 마감 이후에도 기존 결과를 돌려준다(응답 유실 대비).
  const prior = await appRef.get();
  if (prior.exists) {
    const d = prior.data()!;
    return { appNo: d.appNo, status: d.status, pricing: d.pricing, duplicate: true };
  }

  const config = await loadTourConfig(db);
  if (!config || !config.acceptingApplications) throw new SubmitError('closed', 'Applications are currently closed.');
  const departure = config.departures.find((d) => d.id === input.departureId);
  if (!departure || !departure.isOpen) {
    throw new SubmitError('departure_closed', 'This departure is not available.');
  }

  const travelers = buildTravelers(input.counts, input.travelers);
  const pax = totalPax(input.counts);
  const counterRef = db.collection(COL.counters).doc(TOUR_ID);
  const promoCode = input.promoCode ?? null;

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(appRef);
    if (existing.exists) {
      const d = existing.data()!;
      return { appNo: d.appNo, status: d.status, pricing: d.pricing, duplicate: true };
    }

    const appsSnap = await tx.get(db.collection(COL.applications));
    const summaries = appsSnap.docs.map((d) => toSummary(d.data()));

    let promo: PromoCode | null = null;
    if (promoCode) {
      const promoSnap = await tx.get(db.collection(COL.promoCodes).doc(promoCode));
      const found = promoSnap.exists ? ({ ...promoSnap.data(), code: promoCode } as PromoCode) : null;
      const evaluation = evaluatePromo(found, { now, usedPax: promoUsagePax(summaries, promoCode), requestedPax: pax });
      if (!evaluation.valid) {
        throw new SubmitError('promo_invalid', 'This promo code is not valid.', { reason: evaluation.reason });
      }
      promo = found;
    }

    const counterSnap = await tx.get(counterRef);
    const seq = (counterSnap.exists ? Number(counterSnap.data()!.appSeq) : 0) + 1;
    const status: 'new' | 'waitlist' = exceedsCapacity(
      computeAvailability(config, summaries),
      departure.id,
      input.counts,
    )
      ? 'waitlist'
      : 'new';
    const pricing = computePricing({
      departure,
      counts: input.counts,
      travelers,
      promo,
      depositPerPax: config.depositPerPax,
    });
    const appNo = formatAppNo(seq);
    const at = Timestamp.fromDate(now);

    tx.set(counterRef, { appSeq: seq });
    tx.set(
      appRef,
      stripUndefined({
        appNo,
        status,
        departure: {
          id: departure.id,
          label: departure.label,
          departDate: departure.departDate,
          returnDate: departure.returnDate,
        },
        lead: input.lead,
        counts: input.counts,
        travelers,
        completeness: computeCompleteness(travelers),
        pricing,
        payments: [],
        paidTotal: 0,
        specialRequests: input.specialRequests ?? null,
        staffNotes: null,
        statusHistory: [{ status, at, by: 'system' }],
        idempotencyKey: input.idempotencyKey,
        agreedToTermsAt: at,
        // FieldValue·Timestamp 는 일반 객체가 아니므로 stripUndefined 가 그대로 둔다.
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    return { appNo, status, pricing, duplicate: false };
  });
}
