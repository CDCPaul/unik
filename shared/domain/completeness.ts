import type { Category, Traveler } from './types';

export type TravelerField = Exclude<keyof Traveler, 'category'>;

const RUNNER_FIELDS: readonly TravelerField[] = [
  'passportName',
  'dob',
  'gender',
  'nationality',
  'tshirtSize',
  'expectedFinish',
  'room',
  'emergencyContact',
];
const COMPANION_FIELDS: readonly TravelerField[] = [
  'passportName',
  'dob',
  'gender',
  'nationality',
  'room',
  'emergencyContact',
];

// 유아는 객실 선택이 없다 (보호자 방을 함께 쓴다)
const INFANT_FIELDS: readonly TravelerField[] = ['passportName', 'dob', 'gender', 'nationality', 'emergencyContact'];

/** 동반자·아동은 비참가자 항목, 유아는 객실을 뺀 비참가자 항목, 풀·10K 는 참가자 항목 */
export function requiredFieldsFor(category: Category): readonly TravelerField[] {
  switch (category) {
    case 'full':
    case 'tenK':
      return RUNNER_FIELDS;
    case 'infant':
      return INFANT_FIELDS;
    default:
      return COMPANION_FIELDS;
  }
}

function isFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

export function missingFields(traveler: Traveler): TravelerField[] {
  return requiredFieldsFor(traveler.category).filter((f) => !isFilled(traveler[f]));
}

export function computeCompleteness(travelers: Traveler[]): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const t of travelers) {
    const fields = requiredFieldsFor(t.category);
    total += fields.length;
    filled += fields.length - missingFields(t).length;
  }
  return { filled, total };
}
