import { CHILD_CATEGORIES } from '@unik/shared/domain';
import type { Category, Counts } from '@unik/shared/domain';

/** 신청서에서 "Add children or infants" 버튼 뒤에 접어 두는 유형 (아동 2–11세 + 유아) */
export const MINOR_CATEGORIES: readonly Category[] = [...CHILD_CATEGORIES, 'infant'];

/**
 * 아동·유아 인원 칸을 펼쳐 보여야 하는가.
 * 한 명이라도 있으면(임시저장 복원 포함) 항상 펼친다. 없으면 사용자가 버튼으로 연 경우에만.
 */
export function showMinorCounters(counts: Counts, userOpened: boolean): boolean {
  return userOpened || MINOR_CATEGORIES.some((c) => (counts[c] ?? 0) > 0);
}
