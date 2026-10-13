import { CATEGORIES } from './types';
import type { Counts, Traveler } from './types';

export const MAX_PAX_PER_APPLICATION = 10;

export function totalPax(counts: Counts): number {
  return counts.full + counts.tenK + counts.companion;
}

export function runnerCount(counts: Counts): number {
  return counts.full + counts.tenK;
}

/** 인원 구성이 유효하면 null, 아니면 사용자에게 보여줄 영어 메시지 */
export function validateCounts(counts: Counts): string | null {
  for (const category of CATEGORIES) {
    const n = counts[category];
    if (!Number.isInteger(n) || n < 0) return `Invalid ${category} count`;
  }
  const total = totalPax(counts);
  if (total < 1) return 'At least one traveler is required';
  if (total > MAX_PAX_PER_APPLICATION) return `Maximum ${MAX_PAX_PER_APPLICATION} travelers per application`;
  return null;
}

/** counts 에 맞춰 참가자 배열을 만든다. provided 는 같은 유형끼리 순서대로 매칭된다. */
export function buildTravelers(counts: Counts, provided: Traveler[] = []): Traveler[] {
  const travelers: Traveler[] = [];
  for (const category of CATEGORIES) {
    const given = provided.filter((t) => t.category === category);
    for (let i = 0; i < counts[category]; i++) {
      travelers.push(given[i] ? { ...given[i], category } : { category });
    }
  }
  return travelers;
}
