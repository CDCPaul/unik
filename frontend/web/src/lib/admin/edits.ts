import {
  EMAIL_PATTERN,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  buildTravelers,
  computeCompleteness,
  computePricing,
  formatPHP,
  hasControlChars,
  isValidBirthDate,
  isValidName,
  isValidPassportName,
  normalizePhoneNumber,
  totalPax,
  validateCounts,
} from '@unik/shared/domain';
import type { ApplicationStatus, Counts, Pricing, TourConfig, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';
import { cleanTraveler, mergeTravelerEdits } from './detailHelpers';

export function recalculate(
  app: ApplicationRecord,
  change: { counts?: Counts; travelers?: Traveler[] },
  config: TourConfig | null,
): { travelers: Traveler[]; completeness: { filled: number; total: number }; pricing: Pricing; warnings: string[] } | { error: string } {
  const counts = change.counts ?? app.counts;
  const countsError = validateCounts(counts);
  if (countsError) return { error: countsError };
  if (!config) return { error: 'Tour settings are not loaded yet.' };
  const departure = config.departures.find((d) => d.id === app.departure.id);
  if (!departure) return { error: 'This departure is no longer in tour settings, so prices cannot be recalculated.' };
  const travelers = buildTravelers(counts, change.travelers ?? app.travelers);
  const snap = app.pricing.promo;
  // 신청 당시 1인당 예약금을 유지한다 (설정의 예약금이 바뀌어도 기존 신청은 그대로)
  const paxBefore = totalPax(app.counts);
  const perPaxDeposit = paxBefore > 0 ? Math.round(app.pricing.depositDue / paxBefore) : config.depositPerPax;
  const pricing = computePricing({
    departure,
    counts,
    travelers,
    // 신청 당시 할인 조건을 그대로 쓴다 (코드 유효성은 다시 판정하지 않음)
    promo: snap ? { code: snap.code, agencyName: snap.agencyName, discountType: snap.type, discountValue: snap.value } : null,
    depositPerPax: perPaxDeposit,
  });
  const warnings = paymentWarnings(app, pricing);
  return { travelers, completeness: computeCompleteness(travelers), pricing, warnings };
}

function paymentWarnings(app: ApplicationRecord, pricing: Pricing): string[] {
  const warnings: string[] = [];
  if ((app.status === 'fully_paid' || app.status === 'confirmed') && app.paidTotal < pricing.total) {
    warnings.push(`New total ${formatPHP(pricing.total)} is more than the ${formatPHP(app.paidTotal)} paid — review the status.`);
  }
  return warnings;
}

const singleCount = (travelers: Pick<Traveler, 'room'>[]) => travelers.filter((t) => t.room === 'single').length;

/**
 * 참가자만 저장할 때의 가격 계산. 신청 당시의 단가·할인·1인당 예약금은 그대로 두고,
 * 싱글룸 수가 바뀐 경우에만 싱글 추가요금(과 그에 따른 소계·총액)을 다시 계산한다.
 */
export function repriceForTravelers(
  app: ApplicationRecord,
  travelers: Traveler[],
  config: TourConfig | null,
): { travelers: Traveler[]; completeness: { filled: number; total: number }; pricing: Pricing; warnings: string[] } | { error: string } {
  if (!config) return { error: 'Tour settings are not loaded yet.' };
  const next = buildTravelers(app.counts, travelers);
  const completeness = computeCompleteness(next);
  const before = singleCount(app.travelers);
  const after = singleCount(next);
  let pricing = app.pricing;
  if (after !== before) {
    const departure = config.departures.find((d) => d.id === app.departure.id);
    // 출발편이 설정에서 사라졌으면 신청에 기록된 싱글 1실 요금을 쓴다 (없으면 0)
    const perSingle = departure ? departure.singleSupplement : before > 0 ? Math.round(app.pricing.singleSupplements / before) : 0;
    const base = app.pricing.subtotal - app.pricing.singleSupplements;
    const singleSupplements = after * perSingle;
    const subtotal = base + singleSupplements;
    const total = subtotal - (app.pricing.promo?.discountTotal ?? 0);
    const pax = totalPax(app.counts);
    const perPaxDeposit = pax > 0 ? Math.round(app.pricing.depositDue / pax) : 0;
    pricing = { ...app.pricing, singleSupplements, subtotal, total, depositDue: Math.min(perPaxDeposit * pax, total) };
  }
  return { travelers: next, completeness, pricing, warnings: pricing === app.pricing ? [] : paymentWarnings(app, pricing) };
}

const sameCounts = (a: Counts, b: Counts) => a.full === b.full && a.tenK === b.tenK && a.companion === b.companion;

export type TxPlan = { fields: Record<string, unknown> } | { conflict: true } | { error: string };

/** 트랜잭션 안에서 최신 문서(live)를 기준으로 참가자 저장 내용을 계산한다. */
export function planTravelersSave(
  live: ApplicationRecord,
  baseCounts: Counts,
  baseTravelers: Traveler[],
  draft: Traveler[],
  config: TourConfig | null,
): TxPlan {
  const m = mergeTravelerEdits(baseTravelers, draft, buildTravelers(live.counts, live.travelers), { base: baseCounts, live: live.counts });
  if ('conflict' in m) return { conflict: true };
  const r = repriceForTravelers(live, m.merged, config);
  if ('error' in r) return { error: r.error };
  return { fields: { travelers: r.travelers.map(cleanTraveler), completeness: r.completeness, pricing: r.pricing } };
}

/** 트랜잭션 안에서 인원 변경 저장 내용을 계산한다. 편집 시작 후 인원이 바뀌었으면 conflict. */
export function planCountsApply(live: ApplicationRecord, baseCounts: Counts, newCounts: Counts, config: TourConfig | null): TxPlan {
  if (!sameCounts(baseCounts, live.counts)) return { conflict: true };
  const r = recalculate(live, { counts: newCounts }, config);
  if ('error' in r) return { error: r.error };
  return { fields: { counts: newCounts, travelers: r.travelers.map(cleanTraveler), completeness: r.completeness, pricing: r.pricing } };
}

const MAX_AMOUNT = 10_000_000;

/** "10,000", "₱10,000", "PHP 2 500" → 정수 페소. 소수·0·음수·문자·잘못된 쉼표 자리는 null. */
export function parseAmount(raw: string): number | null {
  // 통화 표시는 앞에 붙은 경우만 허용하고, 숫자 사이의 php 같은 글자는 거절한다
  const body = raw.trim().replace(/^(?:php|₱)\s*/i, '').replace(/\s/g, '');
  if (!/^\d+$/.test(body) && !/^\d{1,3}(,\d{3})+$/.test(body)) return null;
  const n = Number(body.replace(/,/g, ''));
  return Number.isSafeInteger(n) && n > 0 && n <= MAX_AMOUNT ? n : null;
}

const NO_AUTO_SUGGEST: readonly ApplicationStatus[] = ['cancelled', 'confirmed', 'fully_paid', 'waitlist'];

/** 취소(void)되지 않은 결제의 합계 */
export function paidTotalOf(payments: PaymentRecord[]): number {
  return payments.reduce((s, p) => (p.voidedAt ? s : s + p.amount), 0);
}

export function applyPayment(app: ApplicationRecord, payment: PaymentRecord) {
  const payments = [...app.payments, payment];
  const paidTotal = paidTotalOf(payments);
  let suggestedStatus: ApplicationStatus | null = null;
  if (!NO_AUTO_SUGGEST.includes(app.status)) {
    if (paidTotal >= app.pricing.total && app.pricing.total > 0) suggestedStatus = 'fully_paid';
    else if (app.status !== 'deposit_paid' && paidTotal >= app.pricing.depositDue && app.pricing.depositDue > 0) suggestedStatus = 'deposit_paid';
  }
  return { payments, paidTotal, suggestedStatus };
}

/** 결제를 지우지 않고 취소 표시만 한다 (이미 취소된 결제는 그대로). */
export function voidPayment(app: ApplicationRecord, paymentId: string, by: string, at: Date) {
  const payments = app.payments.map((p) => (p.id === paymentId && !p.voidedAt ? { ...p, voidedAt: at, voidedBy: by } : p));
  return { payments, paidTotal: paidTotalOf(payments) };
}

export function statusChangeWarnings(app: ApplicationRecord, next: ApplicationStatus): string[] {
  if (next !== 'confirmed') return [];
  const warnings: string[] = [];
  if (app.completeness.filled < app.completeness.total) {
    warnings.push(`Traveler details are incomplete (${app.completeness.filled}/${app.completeness.total}).`);
  }
  if (app.paidTotal < app.pricing.total) {
    warnings.push(`Only ${formatPHP(app.paidTotal)} of ${formatPHP(app.pricing.total)} has been recorded as paid.`);
  }
  return warnings;
}

export function normalizeLead(lead: ApplicationRecord['lead']): ApplicationRecord['lead'] {
  return {
    ...lead,
    firstName: lead.firstName.trim(),
    lastName: lead.lastName.trim(),
    email: lead.email.trim().toLowerCase(),
    phoneDial: lead.phoneDial.trim(),
    phoneNumber: normalizePhoneNumber(lead.phoneNumber),
  };
}

export function validateLead(lead: ApplicationRecord['lead']): Record<string, string> {
  const l = normalizeLead(lead);
  const e: Record<string, string> = {};
  if (!isValidName(l.firstName)) e['lead.firstName'] = 'Enter a valid first name.';
  if (!isValidName(l.lastName)) e['lead.lastName'] = 'Enter a valid last name.';
  if (!EMAIL_PATTERN.test(l.email) || l.email.length > 120) e['lead.email'] = 'Enter a valid email.';
  if (!PHONE_DIAL_PATTERN.test(l.phoneDial) || !PHONE_NUMBER_PATTERN.test(l.phoneNumber)) e['lead.phoneNumber'] = 'Enter a valid mobile number.';
  return e;
}

const TEXT_MAX: Partial<Record<keyof Traveler, number>> = { nationality: 60, expectedFinish: 20, recentMarathon: 120, emergencyContact: 120 };

export function validateTravelers(travelers: Traveler[], today: string): Record<string, string> {
  const e: Record<string, string> = {};
  travelers.forEach((t, i) => {
    const name = t.passportName?.trim();
    if (name && !isValidPassportName(name)) e[`travelers.${i}.passportName`] = 'Check the passport name.';
    const dob = t.dob?.trim();
    if (dob && !isValidBirthDate(dob, today)) e[`travelers.${i}.dob`] = 'Invalid date of birth.';
    for (const [field, max] of Object.entries(TEXT_MAX) as [keyof Traveler, number][]) {
      const v = (t[field] as string | undefined)?.trim();
      if (!v) continue;
      if (hasControlChars(v)) e[`travelers.${i}.${field}`] = 'Remove unusual characters.';
      else if (v.length > max) e[`travelers.${i}.${field}`] = `Max ${max} characters.`;
    }
  });
  return e;
}
