import { HttpsError, onCall, type CallableOptions } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { SubmitError, type SubmitErrorCode } from './errors';
import { submitApplicationCore } from './submit';
import { checkPromoCodeCore } from './promo';

const HTTPS_CODE: Record<SubmitErrorCode, 'invalid-argument' | 'failed-precondition' | 'resource-exhausted'> = {
  invalid_input: 'invalid-argument',
  closed: 'failed-precondition',
  departure_closed: 'failed-precondition',
  promo_invalid: 'failed-precondition',
  rate_limited: 'resource-exhausted',
};

// 운영에서는 App Check 토큰이 없는 호출을 거절한다. Functions 에뮬레이터(FUNCTIONS_EMULATOR=true)에서는 끈다.
const options: CallableOptions = {
  invoker: 'public',
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
  cors: ['https://unik.ph', 'https://www.unik.ph', /^http:\/\/localhost:\d+$/, /\.vercel\.app$/],
};

export const submitApplication = onCall(options, async (request) => {
  try {
    return await submitApplicationCore(getFirestore(), request.data);
  } catch (error) {
    if (error instanceof SubmitError) {
      throw new HttpsError(HTTPS_CODE[error.code], error.message, { code: error.code, ...error.details });
    }
    console.error('submitApplication failed', error);
    throw new HttpsError('internal', 'Something went wrong. Please try again.');
  }
});

export const checkPromoCode = onCall(options, async (request) => checkPromoCodeCore(getFirestore(), request.data));
