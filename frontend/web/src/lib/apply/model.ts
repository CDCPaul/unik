import {
  EMAIL_PATTERN,
  MAX_PAX_PER_APPLICATION,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  buildTravelers,
  computePricing,
  hasControlChars,
  hasControlCharsExceptWhitespace,
  isValidBirthDate,
  isValidName,
  isValidPassportName,
  isValidPromoCodeFormat,
  missingPriceCategories,
  normalizePhoneNumber,
  normalizePromoCode,
  totalPax,
  validateCounts,
  normalizeContactTimes,
} from '@unik/shared/domain';
import type { Category, ContactTime, Counts, DiscountType, Pricing, TourConfig, Traveler } from '@unik/shared/domain';
import type { SubmitPayload } from './api';

export interface AppliedPromo {
  code: string;
  agencyName: string;
  discountType: DiscountType;
  discountValue: number;
  description: string;
}

export interface LeadState {
  firstName: string;
  lastName: string;
  email: string;
  phoneDial: string;
  phoneNumber: string;
  viber: boolean;
  whatsapp: boolean;
  contactTimes: ContactTime[];
}

export interface ApplyState {
  departureId: string | null;
  counts: Counts;
  lead: LeadState;
  travelers: Traveler[];
  promoInput: string;
  promo: AppliedPromo | null;
  specialRequests: string;
  agreedToTerms: boolean;
  website: string; // honeypot
  idempotencyKey: string;
  /** 제출을 시도한 적이 있으면 true. 임시저장 복원 시 같은 신청의 재시도인지 새 신청인지 가른다. */
  submitAttempted: boolean;
}

export type TravelerField = Exclude<keyof Traveler, 'category'>;

export type ApplyAction =
  | { type: 'setDeparture'; departureId: string }
  | { type: 'changeCount'; category: Category; delta: 1 | -1 }
  | { type: 'setLead'; field: Exclude<keyof LeadState, 'contactTimes'>; value: string | boolean }
  | { type: 'toggleContactTime'; time: ContactTime }
  | { type: 'setTraveler'; index: number; field: TravelerField; value: string }
  | { type: 'setPromoInput'; value: string }
  | { type: 'promoApplied'; promo: AppliedPromo }
  | { type: 'promoCleared' }
  | { type: 'setSpecialRequests'; value: string }
  | { type: 'setAgreed'; value: boolean }
  | { type: 'setHoneypot'; value: string }
  | { type: 'markSubmitAttempted' }
  | { type: 'restore'; state: ApplyState };

export function initialApplyState(idempotencyKey: string, promoCode: string | null = null): ApplyState {
  return {
    departureId: null,
    counts: { full: 1, tenK: 0, companion: 0, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
    lead: { firstName: '', lastName: '', email: '', phoneDial: '+63', phoneNumber: '', viber: false, whatsapp: false, contactTimes: [] },
    travelers: [{ category: 'full' }],
    promoInput: promoCode ?? '',
    promo: null,
    specialRequests: '',
    agreedToTerms: false,
    website: '',
    idempotencyKey,
    submitAttempted: false,
  };
}

export function applyReducer(state: ApplyState, action: ApplyAction): ApplyState {
  switch (action.type) {
    case 'setDeparture':
      return { ...state, departureId: action.departureId };
    case 'changeCount': {
      const counts = { ...state.counts, [action.category]: Math.max(0, state.counts[action.category] + action.delta) };
      const pax = totalPax(counts);
      // 인원 0·10명 초과만 막는다. 성인 동반 규칙은 validateCounts 메시지로 안내한다 (순서대로 고칠 수 있게).
      if (pax < 1 || pax > MAX_PAX_PER_APPLICATION) return state;
      return { ...state, counts, travelers: buildTravelers(counts, state.travelers) };
    }
    case 'setLead':
      return { ...state, lead: { ...state.lead, [action.field]: action.value } };
    case 'toggleContactTime': {
      const has = state.lead.contactTimes.includes(action.time);
      const next = has ? state.lead.contactTimes.filter((t) => t !== action.time) : [...state.lead.contactTimes, action.time];
      return { ...state, lead: { ...state.lead, contactTimes: normalizeContactTimes(next) } };
    }
    case 'setTraveler':
      return {
        ...state,
        travelers: state.travelers.map((t, i) => (i === action.index ? { ...t, [action.field]: action.value } : t)),
      };
    case 'setPromoInput': {
      const keep = state.promo && normalizePromoCode(action.value) === state.promo.code;
      return { ...state, promoInput: action.value, promo: keep ? state.promo : null };
    }
    case 'promoApplied':
      return { ...state, promo: action.promo, promoInput: action.promo.code };
    case 'promoCleared':
      return { ...state, promo: null };
    case 'setSpecialRequests':
      return { ...state, specialRequests: action.value };
    case 'setAgreed':
      return { ...state, agreedToTerms: action.value };
    case 'setHoneypot':
      return { ...state, website: action.value };
    case 'markSubmitAttempted':
      return state.submitAttempted ? state : { ...state, submitAttempted: true };
    case 'restore':
      // 예전 초안에는 contactTimes 가 없을 수 있다
      return {
        ...action.state,
        lead: { ...action.state.lead, contactTimes: normalizeContactTimes(action.state.lead.contactTimes) },
        travelers: buildTravelers(action.state.counts),
      };
  }
}

const OPTIONAL_TEXT_MAX: Partial<Record<TravelerField, number>> = {
  nationality: 60,
  expectedFinish: 20,
  recentMarathon: 120,
  emergencyContact: 120,
};

export function validateForSubmit(state: ApplyState, today: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.departureId) errors.departureId = 'Please choose a departure.';
  const countsError = validateCounts(state.counts);
  if (countsError) errors.counts = countsError;
  if (!isValidName(state.lead.firstName)) errors['lead.firstName'] = 'Please enter your first name.';
  if (!isValidName(state.lead.lastName)) errors['lead.lastName'] = 'Please enter your last name.';
  const email = state.lead.email.trim();
  if (!EMAIL_PATTERN.test(email) || email.length > 120) errors['lead.email'] = 'Please enter a valid email address.';
  if (!PHONE_DIAL_PATTERN.test(state.lead.phoneDial) || !PHONE_NUMBER_PATTERN.test(normalizePhoneNumber(state.lead.phoneNumber))) {
    errors['lead.phoneNumber'] = 'Please enter a valid mobile number.';
  }
  if (!state.agreedToTerms) errors.agreedToTerms = 'Please agree to the terms to continue.';
  if (!state.promo && state.promoInput.trim() && !isValidPromoCodeFormat(normalizePromoCode(state.promoInput))) {
    errors.promoInput = 'Promo codes use letters, numbers, hyphens and underscores (3–20 characters).';
  }
  const requests = state.specialRequests.trim();
  if (requests.length > 1000) errors.specialRequests = 'Please shorten your request (max 1000 characters).';
  else if (hasControlCharsExceptWhitespace(requests)) errors.specialRequests = 'Please remove unusual characters.';
  state.travelers.forEach((t, i) => {
    const name = t.passportName?.trim();
    if (name && !isValidPassportName(name)) errors[`travelers.${i}.passportName`] = 'Please check the name (as written in your passport).';
    const dob = t.dob?.trim();
    if (dob && !isValidBirthDate(dob, today)) errors[`travelers.${i}.dob`] = 'Please enter a valid date of birth.';
    for (const [field, max] of Object.entries(OPTIONAL_TEXT_MAX) as [TravelerField, number][]) {
      const v = (t[field] as string | undefined)?.trim();
      if (v && (v.length > max || hasControlChars(v)) && !errors[`travelers.${i}.${field}`]) {
        errors[`travelers.${i}.${field}`] = 'Please shorten this answer.';
      }
    }
  });
  return errors;
}

export function toSubmitPayload(state: ApplyState): SubmitPayload {
  const typedCode = state.promoInput.trim() ? normalizePromoCode(state.promoInput) : undefined;
  const promoCode = state.promo?.code ?? typedCode;
  const specialRequests = state.specialRequests.trim();
  return {
    idempotencyKey: state.idempotencyKey,
    departureId: state.departureId ?? '',
    counts: state.counts,
    lead: {
      ...state.lead,
      firstName: state.lead.firstName.trim(),
      lastName: state.lead.lastName.trim(),
      email: state.lead.email.trim(),
      phoneNumber: normalizePhoneNumber(state.lead.phoneNumber),
    },
    // 참가자 상세는 직원이 전화로 받으므로 유형만 보낸다
    travelers: state.travelers.map((t) => ({ category: t.category })),
    // callable SDK 가 undefined 를 null 로 보내므로 값이 없으면 키 자체를 넣지 않는다.
    ...(promoCode ? { promoCode } : {}),
    ...(specialRequests ? { specialRequests } : {}),
    agreedToTerms: state.agreedToTerms,
    website: state.website,
  };
}

export function estimatePricing(state: ApplyState, config: TourConfig): Pricing | null {
  const departure = config.departures.find((d) => d.id === state.departureId);
  if (!departure) return null;
  // 가격이 없는 유형이 포함되면 금액을 만들지 않는다 (NaN 방지, 서버도 이 신청을 받지 않는다)
  if (missingPriceCategories(departure.prices, state.counts).length > 0) return null;
  return computePricing({
    departure,
    counts: state.counts,
    travelers: state.travelers,
    promo: state.promo
      ? {
          code: state.promo.code,
          agencyName: state.promo.agencyName,
          discountType: state.promo.discountType,
          discountValue: state.promo.discountValue,
        }
      : null,
    depositPerPax: config.depositPerPax,
  });
}
