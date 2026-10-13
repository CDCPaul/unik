import { ADULT_CATEGORIES, CATEGORIES, RUNNER_CATEGORIES } from './types';
import type { Category, Counts, Traveler } from './types';

export const MAX_PAX_PER_APPLICATION = 10;

const sum = (counts: Counts, categories: readonly (keyof Counts)[]) => categories.reduce((s, c) => s + counts[c], 0);

/** 좌석을 차지하는 전체 인원 (유아 포함) */
export function totalPax(counts: Counts): number {
  return sum(counts, CATEGORIES);
}

/** 배번이 필요한 인원 (풀·10K) */
export function runnerCount(counts: Counts): number {
  return sum(counts, RUNNER_CATEGORIES);
}

/** 성인 인원 (풀·10K·동반자) */
export function adultCount(counts: Counts): number {
  return sum(counts, ADULT_CATEGORIES);
}

/**
 * 저장된 문서·신뢰할 수 없는 입력의 인원 구성을 다섯 유형 모두 갖춘 Counts 로 만든다.
 * 없거나 잘못된 값(음수·소수·숫자가 아님)은 0 으로 본다. 예전 신청서에는 child/infant 키가 없다.
 */
export function normalizeCounts(partial: unknown): Counts {
  const src = partial && typeof partial === 'object' ? (partial as Record<string, unknown>) : {};
  const counts = {} as Counts;
  for (const c of CATEGORIES) {
    const n = src[c];
    counts[c] = typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0;
  }
  return counts;
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
  const adults = adultCount(counts);
  if (counts.child + counts.infant > 0 && adults < 1) return 'Children and infants must travel with at least one adult.';
  if (counts.infant > adults) return 'Each infant must travel with an adult (one infant per adult).';
  return null;
}

/** 유아는 보호자 방을 함께 쓰므로 객실 선택(싱글 추가요금)이 없다. */
export function hasRoomChoice(category: Category): boolean {
  return category !== 'infant';
}

/**
 * counts 에 맞춰 참가자 배열을 만든다. provided 는 같은 유형끼리 순서대로 매칭된다.
 * 객실 선택이 없는 유형(유아)에서는 room 을 지운다.
 */
export function buildTravelers(counts: Counts, provided: Traveler[] = []): Traveler[] {
  const travelers: Traveler[] = [];
  for (const category of CATEGORIES) {
    const given = provided.filter((t) => t.category === category);
    for (let i = 0; i < counts[category]; i++) {
      const t: Traveler = given[i] ? { ...given[i], category } : { category };
      if (!hasRoomChoice(category)) delete t.room;
      travelers.push(t);
    }
  }
  return travelers;
}
