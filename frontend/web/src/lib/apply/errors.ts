import type { PromoInvalidReason } from '@unik/shared/domain';

const RETRYABLE = new Set([
  'functions/internal',
  'functions/unavailable',
  'functions/deadline-exceeded',
  'functions/aborted',
]);

export const PROMO_REASON_MESSAGES: Record<PromoInvalidReason, string> = {
  not_found: "We couldn't find this promo code. Please check it with your travel agency.",
  inactive: 'This promo code is no longer active.',
  expired: 'This promo code has expired.',
  limit_reached: 'This promo code has reached its limit for the number of travelers.',
};

export type DescribedError = {
  kind: 'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid' | 'rate_limited' | 'network' | 'unknown';
  message: string;
  promoReason?: PromoInvalidReason;
  issues?: { path: string; message: string }[];
};

interface FunctionsLikeError {
  code?: unknown;
  message?: unknown;
  details?: { code?: unknown; reason?: unknown; issues?: unknown };
}

export function isRetryable(err: unknown): boolean {
  return typeof (err as FunctionsLikeError)?.code === 'string' && RETRYABLE.has((err as FunctionsLikeError).code as string);
}

export function describeSubmitError(err: unknown): DescribedError {
  const e = (err ?? {}) as FunctionsLikeError;
  const detailCode = e.details?.code;
  const serverMessage = typeof e.message === 'string' && e.message ? e.message : undefined;
  switch (detailCode) {
    case 'invalid_input':
      return {
        kind: 'invalid_input',
        message: serverMessage ?? 'Please check the form and try again.',
        issues: Array.isArray(e.details?.issues) ? (e.details?.issues as DescribedError['issues']) : undefined,
      };
    case 'closed':
      return { kind: 'closed', message: 'Applications are currently closed. Please contact us.' };
    case 'departure_closed':
      return { kind: 'departure_closed', message: 'This departure is no longer available. Please choose another one.' };
    case 'promo_invalid': {
      const reason = e.details?.reason as PromoInvalidReason | undefined;
      return {
        kind: 'promo_invalid',
        promoReason: reason,
        message: reason ? PROMO_REASON_MESSAGES[reason] : PROMO_REASON_MESSAGES.not_found,
      };
    }
    case 'rate_limited':
      return { kind: 'rate_limited', message: serverMessage ?? 'Too many applications in a short time. Please contact us.' };
  }
  if (isRetryable(err)) {
    return {
      kind: 'network',
      message: "We couldn't reach our server. Your answers are saved — please try again in a moment.",
    };
  }
  return { kind: 'unknown', message: 'Something went wrong. Please try again or contact us.' };
}
