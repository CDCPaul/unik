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
  validateCounts,
} from '@unik/shared/domain';
import type { ApplicationStatus, Counts, Pricing, TourConfig, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';

export function recalculate(
  app: ApplicationRecord,
  change: { counts?: Counts; travelers?: Traveler[] },
  config: TourConfig | null,
): { travelers: Traveler[]; completeness: { filled: number; total: number }; pricing: Pricing } | { error: string } {
  const counts = change.counts ?? app.counts;
  const countsError = validateCounts(counts);
  if (countsError) return { error: countsError };
  if (!config) return { error: 'Tour settings are not loaded yet.' };
  const departure = config.departures.find((d) => d.id === app.departure.id);
  if (!departure) return { error: 'This departure is no longer in tour settings, so prices cannot be recalculated.' };
  const travelers = buildTravelers(counts, change.travelers ?? app.travelers);
  const snap = app.pricing.promo;
  const pricing = computePricing({
    departure,
    counts,
    travelers,
    // 신청 당시 할인 조건을 그대로 쓴다 (코드 유효성은 다시 판정하지 않음)
    promo: snap ? { code: snap.code, agencyName: snap.agencyName, discountType: snap.type, discountValue: snap.value } : null,
    depositPerPax: config.depositPerPax,
  });
  return { travelers, completeness: computeCompleteness(travelers), pricing };
}

/** "10,000", "₱10,000", "PHP 2 500" → 정수 페소. 소수·0·음수·문자는 null. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/php|₱|,|\s/gi, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const NO_AUTO_SUGGEST: readonly ApplicationStatus[] = ['cancelled', 'confirmed', 'fully_paid'];

export function applyPayment(app: ApplicationRecord, payment: PaymentRecord) {
  const payments = [...app.payments, payment];
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  let suggestedStatus: ApplicationStatus | null = null;
  if (!NO_AUTO_SUGGEST.includes(app.status)) {
    if (paidTotal >= app.pricing.total && app.pricing.total > 0) suggestedStatus = 'fully_paid';
    else if (app.status !== 'deposit_paid' && paidTotal >= app.pricing.depositDue && app.pricing.depositDue > 0) suggestedStatus = 'deposit_paid';
  }
  return { payments, paidTotal, suggestedStatus };
}

export function withoutPayment(app: ApplicationRecord, paymentId: string) {
  const payments = app.payments.filter((p) => p.id !== paymentId);
  return { payments, paidTotal: payments.reduce((s, p) => s + p.amount, 0) };
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
      if (v && (v.length > max || hasControlChars(v))) e[`travelers.${i}.${field}`] = `Max ${max} characters.`;
    }
  });
  return e;
}
