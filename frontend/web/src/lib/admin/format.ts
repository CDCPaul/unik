import type { ApplicationStatus, Category, Counts } from '@unik/shared/domain';
import { CATEGORIES } from '@unik/shared/domain';
import { msg } from './i18n/translate';
import type { MessageKey, Msg } from './i18n/translate';

export function formatManila(date: Date | null): string {
  if (!date) return '—';
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

/** CSV 내보내기용 영어 상태 이름 (스프레드시트가 의존하므로 번역하지 않는다). 화면에는 STATUS_KEYS 를 쓴다. */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  deposit_paid: 'Deposit paid',
  fully_paid: 'Fully paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  waitlist: 'Waitlist',
};

/** 화면용 상태 이름의 번역 키 */
export const STATUS_KEYS: Record<ApplicationStatus, MessageKey> = {
  new: 'status.new',
  contacted: 'status.contacted',
  deposit_paid: 'status.deposit_paid',
  fully_paid: 'status.fully_paid',
  confirmed: 'status.confirmed',
  cancelled: 'status.cancelled',
  waitlist: 'status.waitlist',
};

/** 어드민 화면용 참가 유형 이름 (공용 CATEGORY_LABELS 는 공개 사이트·CSV 용으로 그대로 둔다) */
export const CATEGORY_KEYS: Record<Category, MessageKey> = {
  full: 'category.full',
  tenK: 'category.tenK',
  companion: 'category.companion',
  child: 'category.child',
  infant: 'category.infant',
};

/** 표 머리글처럼 짧은 이름 */
export const CATEGORY_SHORT_KEYS: Record<Category, MessageKey> = {
  full: 'categoryShort.full',
  tenK: 'categoryShort.tenK',
  companion: 'categoryShort.companion',
  child: 'categoryShort.child',
  infant: 'categoryShort.infant',
};

/** 인원 구성 설명 (describeCounts 의 화면용): 0 명인 유형은 뺀다. 화면에서 번역 후 ", " 로 잇는다. */
export function countsMessages(counts: Counts): Msg[] {
  return CATEGORIES.filter((c) => counts[c] > 0).map((c) => msg('counts.item', { n: counts[c], category: msg(CATEGORY_KEYS[c]) }));
}

export const STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-sky-100 text-sky-800',
  fully_paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-slate-900 text-white',
  cancelled: 'bg-slate-100 text-slate-500',
  waitlist: 'bg-purple-100 text-purple-800',
};
