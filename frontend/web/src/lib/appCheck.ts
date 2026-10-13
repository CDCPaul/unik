import { ReCaptchaEnterpriseProvider, initializeAppCheck } from 'firebase/app-check';
import app from '@/lib/firebase';

let started = false;

/** 공개 사이트에서 한 번만 호출. 키가 없으면(로컬 등) 경고만 남기고 건너뛴다. */
export function startAppCheck(): void {
  if (started || typeof window === 'undefined') return;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) {
    console.warn('App Check is not configured (NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY missing).');
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
  started = true;
}
