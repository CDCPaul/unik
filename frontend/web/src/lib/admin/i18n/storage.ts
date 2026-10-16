import { DEFAULT_LOCALE, isLocale } from './translate';
import type { Locale } from './translate';

export const LOCALE_STORAGE_KEY = 'unik.admin.locale';

/** 저장된 어드민 언어. 저장소를 쓸 수 없거나(사생활 모드·차단·서버) 값이 이상하면 'en'. */
export function readStoredLocale(): Locale {
  try {
    const v = globalThis.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(v) ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** 언어 선택을 브라우저에 기억한다. 실패해도 조용히 넘어간다 (화면 전환은 메모리 값으로 계속 동작). */
export function writeStoredLocale(locale: Locale): void {
  try {
    globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // 저장소를 쓸 수 없는 환경: 이번 탭에서만 유지된다
  }
}
