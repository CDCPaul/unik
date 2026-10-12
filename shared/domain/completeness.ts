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

export function requiredFieldsFor(category: Category): readonly TravelerField[] {
  return category === 'companion' ? COMPANION_FIELDS : RUNNER_FIELDS;
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
