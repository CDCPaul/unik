import type { KeyValueStore } from '../store';
import type { ApplyState } from './model';

const KEY = 'unik.applyDraft.v1';

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
    const s = JSON.parse(raw) as Partial<ApplyState>;
    const counts = s.counts as Record<string, unknown> | undefined;
    const valid =
      typeof s.idempotencyKey === 'string' &&
      !!counts &&
      ['full', 'tenK', 'companion'].every((k) => typeof counts[k] === 'number') &&
      !!s.lead &&
      typeof s.lead.firstName === 'string' &&
      Array.isArray(s.travelers);
    return valid ? ({ ...(s as ApplyState), website: '' }) : null;
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
