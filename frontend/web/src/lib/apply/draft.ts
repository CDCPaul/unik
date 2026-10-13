import { CATEGORIES, normalizeCounts } from '@unik/shared/domain';
import type { KeyValueStore } from '../store';
import type { ApplyState } from './model';

const KEY = 'unik.applyDraft.v1';
/** 임시저장 보관 기간: 마지막 저장 후 14일. 개인정보를 기기에 오래 남기지 않는다. */
export const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// 아동·유아 이전의 임시저장에는 child/infant 가 없다 → 처음 세 유형만 필수로 보고, 복원할 때 0 으로 채운다.
const REQUIRED_COUNT_KEYS = ['full', 'tenK', 'companion'];
const CATEGORY_KEYS: readonly string[] = CATEGORIES;
const LEAD_TEXT_KEYS = ['firstName', 'lastName', 'email', 'phoneDial', 'phoneNumber'];

function isDraftShape(s: Record<string, unknown>): boolean {
  const counts = s.counts as Record<string, unknown> | undefined;
  const lead = s.lead as Record<string, unknown> | undefined;
  return (
    typeof s.idempotencyKey === 'string' &&
    UUID.test(s.idempotencyKey) &&
    !!counts &&
    typeof counts === 'object' &&
    REQUIRED_COUNT_KEYS.every((k) => typeof counts[k] === 'number') &&
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

export function saveDraft(store: KeyValueStore | null, state: ApplyState, now: number = Date.now()): void {
  try {
    store?.setItem(KEY, JSON.stringify({ ...state, website: '', savedAt: now }));
  } catch {
    // 저장 실패는 무시 (개인정보 모드 등)
  }
}

/**
 * savedAt 이 없는 임시저장(만료 기능 배포 전에 저장된 것)은 한 번은 유효로 본다 — 배포 순간 작성 중이던 신청을 지우지 않기 위해서다.
 * 이 초안은 다음 저장 때 savedAt 이 기록되어 이후부터 14일 기준이 적용된다.
 */
export function loadDraft(store: KeyValueStore | null, now: number = Date.now()): ApplyState | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const s = parsed as Record<string, unknown>;
    if (!isDraftShape(s)) return null;
    if (s.savedAt !== undefined && (typeof s.savedAt !== 'number' || now - s.savedAt > DRAFT_TTL_MS)) {
      clearDraft(store);
      return null;
    }
    const { savedAt: _savedAt, ...rest } = s;
    // submitAttempted 가 없던 옛 임시저장은 false 로 본다.
    return {
      ...(rest as unknown as ApplyState),
      counts: normalizeCounts(s.counts),
      website: '',
      submitAttempted: s.submitAttempted === true,
    };
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
