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

// 침대 없는 아동 10K 는 참가자 항목에서 객실을 뺀다
const RUNNER_NO_BED_FIELDS: readonly TravelerField[] = RUNNER_FIELDS.filter((f) => f !== 'room');

// 침대 없는 아동 응원·유아는 객실 선택이 없다 (보호자 침대를 함께 쓴다)
const INFANT_FIELDS: readonly TravelerField[] = ['passportName', 'dob', 'gender', 'nationality', 'emergencyContact'];

/**
 * 배번이 있는 유형(풀·10K·아동 10K)은 참가자 항목, 응원(동반자·아동)은 비참가자 항목.
 * 침대 없는 유형(아동 10K 침대 없음·아동 침대 없음·유아)은 객실 항목을 빼고 본다.
 */
export function requiredFieldsFor(category: Category): readonly TravelerField[] {
  switch (category) {
    case 'full':
    case 'tenK':
    case 'childTenK':
      return RUNNER_FIELDS;
    case 'childTenKNoBed':
      return RUNNER_NO_BED_FIELDS;
    case 'childNoBed':
    case 'infant':
      return INFANT_FIELDS;
    case 'companion':
    case 'child':
    default:
      // 저장된 데이터에 알 수 없는 유형이 있어도 어드민 상세가 깨지지 않도록 비참가자 기준으로 본다
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
