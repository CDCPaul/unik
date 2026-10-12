import { HttpsError, onCall, type CallableOptions } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { SubmitError } from './errors';
import { submitApplicationCore } from './submit';
import { checkPromoCodeCore } from './promo';

// App Check 강제(enforceAppCheck)는 2부에서 웹에 App Check 를 붙인 뒤 켠다.
const options: CallableOptions = {
  invoker: 'public',
  cors: ['https://unik.ph', 'https://www.unik.ph', /^http:\/\/localhost:\d+$/, /\.vercel\.app$/],
};

export const submitApplication = onCall(options, async (request) => {
  try {
    return await submitApplicationCore(getFirestore(), request.data);
  } catch (error) {
    if (error instanceof SubmitError) {
      throw new HttpsError(
        error.code === 'invalid_input' ? 'invalid-argument' : 'failed-precondition',
        error.message,
        { code: error.code, ...error.details },
      );
    }
    console.error('submitApplication failed', error);
    throw new HttpsError('internal', 'Something went wrong. Please try again.');
  }
});

export const checkPromoCode = onCall(options, async (request) => checkPromoCodeCore(getFirestore(), request.data));
