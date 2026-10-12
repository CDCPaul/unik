import type { KeyValueStore } from '../store';
import type { ApplyState } from './model';

const KEY = 'unik.applyDraft.v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY_KEYS = ['full', 'tenK', 'companion'];
const LEAD_TEXT_KEYS = ['firstName', 'lastName', 'email', 'phoneDial', 'phoneNumber'];

function isDraftShape(s: Record<string, unknown>): boolean {
  const counts = s.counts as Record<string, unknown> | undefined;
  const lead = s.lead as Record<string, unknown> | undefined;
  return (
    typeof s.idempotencyKey === 'string' &&
    UUID.test(s.idempotencyKey) &&
    !!counts &&
    typeof counts === 'object' &&
    CATEGORY_KEYS.every((k) => typeof counts[k] === 'number') &&
    !!lead &&
    typeof lead === 'object' &&
    LEAD_TEXT_KEYS.every((k) => typeof lead[k] === 'string') &&
    typeof s.promoInput === 'string' &&
    typeof s.specialRequests === 'string' &&
    typeof s.agreedToTerms === 'boolean' &&
    (s.departureId === null || typeof s.departureId === 'string') &&
    Array.isArray(s.travelers) &&
    s.travelers.every(
      (t: unknown) =>
        !!t &&
        typeof t === 'object' &&
        CATEGORY_KEYS.includes((t as { category?: unknown }).category as string),
    )
  );
}

export function saveDraft(store: KeyValueStore | null, state: ApplyState): void {
  try {
    store?.setItem(KEY, JSON.stringify({ ...state, website: '' }));
  } catch {
    // 저장 실패는 무시 (개인정보 모드 등)
  }
}

export function loadDraft(store: KeyValueStore | null): ApplyState | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const s = parsed as Record<string, unknown>;
    if (!isDraftShape(s)) return null;
    // submitAttempted 가 없던 옛 임시저장은 false 로 본다.
    return { ...(s as unknown as ApplyState), website: '', submitAttempted: s.submitAttempted === true };
  } catch {
    return null;
  }
}

export function clearDraft(store: KeyValueStore | null): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // 무시
  }
}
