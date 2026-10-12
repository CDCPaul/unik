import { createHash } from 'node:crypto';
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

// App Check 강제(enforceAppCheck)는 2부에서 웹에 App Check 를 붙인 뒤 켠다.
const options: CallableOptions = {
  invoker: 'public',
  cors: ['https://unik.ph', 'https://www.unik.ph', /^http:\/\/localhost:\d+$/, /\.vercel\.app$/],
};

export const submitApplication = onCall(options, async (request) => {
  try {
    const ip = request.rawRequest?.ip;
    const clientIpHash = ip ? createHash('sha256').update(`unik:${ip}`).digest('hex').slice(0, 32) : undefined;
    return await submitApplicationCore(getFirestore(), request.data, new Date(), { clientIpHash });
  } catch (error) {
    if (error instanceof SubmitError) {
      throw new HttpsError(HTTPS_CODE[error.code], error.message, { code: error.code, ...error.details });
    }
    console.error('submitApplication failed', error);
    throw new HttpsError('internal', 'Something went wrong. Please try again.');
  }
});

export const checkPromoCode = onCall(options, async (request) => checkPromoCodeCore(getFirestore(), request.data));
