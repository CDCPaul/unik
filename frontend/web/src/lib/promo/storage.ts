import { isValidPromoCodeFormat, normalizePromoCode } from '@unik/shared/domain';
import type { KeyValueStore } from '../store';

const KEY = 'unik.promoCode';
export const PROMO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 유효한 코드면 정규화해 저장하고 반환. 저장 실패는 무시한다(코드는 그대로 반환). */
export function savePromoCode(store: KeyValueStore | null, raw: string, now: number): string | null {
  const code = normalizePromoCode(raw);
  if (!isValidPromoCodeFormat(code)) return null;
  try {
    store?.setItem(KEY, JSON.stringify({ code, savedAt: now }));
  } catch {
    // 저장소가 막혀 있어도 이번 방문에서는 코드가 쓰인다.
  }
  return code;
}

export function loadPromoCode(store: KeyValueStore | null, now: number): string | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { code?: unknown; savedAt?: unknown };
    if (typeof value.code !== 'string' || typeof value.savedAt !== 'number') return null;
    if (now - value.savedAt > PROMO_TTL_MS) {
      store?.removeItem(KEY);
      return null;
    }
    return isValidPromoCodeFormat(value.code) ? value.code : null;
  } catch {
    return null;
  }
}

export function clearPromoCode(store: KeyValueStore | null): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // 무시
  }
}
