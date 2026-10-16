import { CATEGORIES, formatPHP } from '@unik/shared/domain';
import type { Category, Counts, PaymentMethod, PaymentType, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord } from './applicationDoc';
import { CATEGORY_KEYS } from './format';
import { msg } from './i18n/translate';
import type { MessageKey, Msg } from './i18n/translate';

/** 결제 수단 이름의 번역 키 */
export const PAYMENT_METHOD_KEYS: Record<PaymentMethod, MessageKey> = {
  maya_link: 'paymentMethod.maya_link',
  maya_qr: 'paymentMethod.maya_qr',
  maya_terminal: 'paymentMethod.maya_terminal',
  bank_transfer: 'paymentMethod.bank_transfer',
  cash: 'paymentMethod.cash',
  maya_checkout: 'paymentMethod.maya_checkout',
};

/** 결제 유형 이름의 번역 키 */
export const PAYMENT_TYPE_KEYS: Record<PaymentType, MessageKey> = { deposit: 'paymentType.deposit', balance: 'paymentType.balance', other: 'paymentType.other' };

export interface DroppedTraveler {
  /** app.travelers 안의 1부터 시작하는 위치 (카드 번호와 동일) */
  position: number;
  category: Category;
  name: string | null;
  hasDetails: boolean;
}

const hasText = (v: unknown) => typeof v === 'string' && v.trim() !== '';

/** 인원이 줄어들 때 buildTravelers 가 버리게 되는 참가자 (같은 유형 안에서 뒤쪽부터) */
export function droppedTravelers(travelers: Traveler[], newCounts: Counts): DroppedTraveler[] {
  const seen = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  const dropped: DroppedTraveler[] = [];
  travelers.forEach((t, i) => {
    if (!CATEGORIES.includes(t.category)) return;
    const idx = seen[t.category]++;
    if (idx >= newCounts[t.category]) {
      dropped.push({
        position: i + 1,
        category: t.category,
        name: hasText(t.passportName) ? t.passportName!.trim() : null,
        hasDetails: Object.entries(t).some(([k, v]) => k !== 'category' && hasText(v)),
      });
    }
  });
  return dropped;
}

export function droppedWarning(d: DroppedTraveler): Msg {
  const what = d.name ?? msg(d.hasDetails ? 'detail.dropped.partial' : 'detail.dropped.noDetails');
  return msg('detail.dropped', { n: d.position, category: msg(CATEGORY_KEYS[d.category]), what });
}

/** 지급액이 새 총액보다 많으면 안내 문구 (환불 검토) */
export function paidExceedsNote(paidTotal: number, newTotal: number): Msg | null {
  if (newTotal >= paidTotal) return null;
  return msg('detail.paidExceeds', { amount: formatPHP(paidTotal - newTotal) });
}

/** YYYY-MM-DD(마닐라 날짜)를 그날 12:00 마닐라(= 04:00Z)로. 잘못된 날짜는 null. */
export function paidAtFromDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T04:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return null;
  return d;
}

/** 문자열 필드를 다듬고 빈 값은 키째 제거한다 (Firestore 는 undefined 를 거부한다). */
export function cleanTraveler(t: Traveler): Traveler {
  const out: Record<string, unknown> = { category: t.category };
  for (const [k, v] of Object.entries(t)) {
    if (k === 'category') continue;
    if (typeof v === 'string' && v.trim() !== '') out[k] = v.trim();
  }
  return out as unknown as Traveler;
}

/** 바뀐 연락처 필드만 점 표기 경로로 모은다 (다른 직원의 다른 필드 수정을 덮지 않기 위해). */
export function leadChanges(prev: ApplicationRecord['lead'], next: ApplicationRecord['lead']): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(next) as (keyof ApplicationRecord['lead'])[]) {
    if (prev[k] !== next[k]) out[`lead.${k}`] = next[k];
  }
  return out;
}

/** 예약금을 다 채웠으면 balance, 아니면 deposit */
export function defaultPaymentType(paidTotal: number, depositDue: number): PaymentType {
  return paidTotal < depositDue ? 'deposit' : 'balance';
}

/**
 * 편집 시작 시점의 snapshot 과 draft 를 비교해 사용자가 실제로 바꾼 (참가자, 필드)만
 * 최신(live) 참가자 배열에 다시 적용한다. 같은 필드가 그 사이 live 에서 바뀌었거나
 * 바꾼 참가자가 사라졌거나 인원 구성(counts)이 바뀌었으면 conflict.
 */
export function mergeTravelerEdits(
  snapshot: Traveler[],
  draft: Traveler[],
  live: Traveler[],
  counts: { base: Counts; live: Counts },
): { merged: Traveler[] } | { conflict: true } {
  // 인원이 한 유형이라도 바뀌면 배열 인덱스가 밀리므로 병합하지 않고 충돌로 처리한다
  if (CATEGORIES.some((c) => counts.base[c] !== counts.live[c])) return { conflict: true };
  const merged = live.map((t) => cleanTraveler(t) as unknown as Record<string, unknown>);
  for (let i = 0; i < draft.length; i++) {
    const before = cleanTraveler(snapshot[i] ?? { category: draft[i].category }) as unknown as Record<string, unknown>;
    const after = cleanTraveler(draft[i]) as unknown as Record<string, unknown>;
    const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
    fields.delete('category');
    const changed = [...fields].filter((f) => before[f] !== after[f]);
    if (changed.length === 0) continue;
    const current = merged[i];
    if (!current || current.category !== before.category) return { conflict: true };
    for (const f of changed) {
      if (current[f] !== before[f] && current[f] !== after[f]) return { conflict: true };
      if (after[f] === undefined) delete current[f];
      else current[f] = after[f];
    }
  }
  return { merged: merged as unknown as Traveler[] };
}
