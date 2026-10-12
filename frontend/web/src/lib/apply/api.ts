import { httpsCallable } from 'firebase/functions';
import { normalizePromoCode } from '@unik/shared/domain';
import type {
  ApplicationStatus,
  Counts,
  DiscountType,
  Pricing,
  PromoInvalidReason,
  Traveler,
} from '@unik/shared/domain';
import { isRetryable } from './errors';

export interface SubmitPayload {
  idempotencyKey: string;
  departureId: string;
  counts: Counts;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phoneDial: string;
    phoneNumber: string;
    viber: boolean;
    whatsapp: boolean;
  };
  travelers: Traveler[];
  promoCode?: string;
  specialRequests?: string;
  agreedToTerms: boolean;
  website: string;
}

export interface SubmitResponse {
  appNo: string;
  status: ApplicationStatus;
  pricing: Pricing;
  duplicate: boolean;
}

export type PromoCheckResponse =
  | { valid: false; reason: PromoInvalidReason }
  | { valid: true; code: string; agencyName: string; discountType: DiscountType; discountValue: number; description: string };

async function callSubmit(payload: SubmitPayload): Promise<SubmitResponse> {
  const { functions } = await import('@/lib/functions');
  const fn = httpsCallable<SubmitPayload, SubmitResponse>(functions, 'submitApplication', { timeout: 60_000 });
  return (await fn(payload)).data;
}

async function callCheckPromo(data: { code: string; pax: number }): Promise<PromoCheckResponse> {
  const { functions } = await import('@/lib/functions');
  const fn = httpsCallable<{ code: string; pax: number }, PromoCheckResponse>(functions, 'checkPromoCode');
  return (await fn(data)).data;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 일시적 오류는 같은 payload(같은 idempotencyKey)로 재시도한다. 서버가 중복을 막는다. */
export async function submitWithRetry(
  payload: SubmitPayload,
  deps: {
    call?: (p: SubmitPayload) => Promise<SubmitResponse>;
    sleep?: (ms: number) => Promise<void>;
    attempts?: number;
    delayMs?: number;
  } = {},
): Promise<SubmitResponse> {
  const call = deps.call ?? callSubmit;
  const sleep = deps.sleep ?? defaultSleep;
  const attempts = deps.attempts ?? 3;
  const delayMs = deps.delayMs ?? 1500;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await call(payload);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || i === attempts - 1) throw error;
      await sleep(delayMs * (i + 1));
    }
  }
  throw lastError;
}

export async function checkPromo(
  code: string,
  pax: number,
  deps: { call?: (d: { code: string; pax: number }) => Promise<PromoCheckResponse> } = {},
): Promise<PromoCheckResponse> {
  return (deps.call ?? callCheckPromo)({ code: normalizePromoCode(code), pax });
}
