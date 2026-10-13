import { z } from 'zod';
import {
  CATEGORIES,
  EMAIL_PATTERN,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  PROMO_CODE_PATTERN,
  TSHIRT_SIZES,
  hasControlChars,
  hasControlCharsExceptWhitespace,
  isValidBirthDate,
  isValidName,
  isValidPassportName,
  manilaDate,
  normalizePhoneNumber,
  validateCounts,
} from '../shared-domain';
import { SubmitError } from './errors';

// 콜백 SDK 는 undefined 를 null 로 직렬화한다 → null 도 미입력으로 취급한다.
const nullToUndefined = (v: unknown) => (v === null ? undefined : v);
const blankToUndefined = (v: unknown) =>
  v === null ? undefined : typeof v === 'string' ? (v.trim() === '' ? undefined : v.trim()) : v;

const optText = (max: number) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .max(max)
      .refine((v) => !hasControlChars(v), 'Invalid characters')
      .optional(),
  );
// 여권 이름은 선택 입력이며 웹 폼과 같은 규칙(shared isValidPassportName)을 쓴다.
const optPassportName = z.preprocess(blankToUndefined, z.string().refine(isValidPassportName, 'Invalid name').optional());
const nameText = z.string().trim().refine(isValidName, 'Invalid name');
const count = z.number().int().min(0).max(10);
// 아동·유아 이전에 캐시된 웹 폼은 child/infant 를 보내지 않는다 → 0 으로 본다.
const newCategoryCount = z.preprocess(nullToUndefined, count.default(0));

const travelerSchema = z.object({
  category: z.enum(CATEGORIES),
  passportName: optPassportName,
  dob: z.preprocess(blankToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => isValidBirthDate(v, manilaDate(new Date())), 'Invalid date').optional()),
  gender: z.preprocess(blankToUndefined, z.enum(['female', 'male']).optional()),
  nationality: optText(60),
  tshirtSize: z.preprocess(blankToUndefined, z.enum(TSHIRT_SIZES).optional()),
  expectedFinish: optText(20),
  recentMarathon: optText(120),
  room: z.preprocess(blankToUndefined, z.enum(['twin', 'single']).optional()),
  emergencyContact: optText(120),
});

export const submitInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  departureId: z.string().min(1).max(20),
  counts: z.object({ full: count, tenK: count, companion: count, child: newCategoryCount, infant: newCategoryCount }),
  lead: z.object({
    firstName: nameText,
    lastName: nameText,
    email: z.string().trim().toLowerCase().email().max(120).regex(EMAIL_PATTERN),
    phoneDial: z.string().regex(PHONE_DIAL_PATTERN),
    phoneNumber: z.preprocess(
      (v) => (typeof v === 'string' ? normalizePhoneNumber(v) : v),
      z.string().regex(PHONE_NUMBER_PATTERN),
    ),
    viber: z.preprocess(nullToUndefined, z.boolean().default(false)),
    whatsapp: z.preprocess(nullToUndefined, z.boolean().default(false)),
  }),
  travelers: z.preprocess(nullToUndefined, z.array(travelerSchema).max(10).default([])),
  promoCode: z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? undefined : v.trim().toUpperCase()) : nullToUndefined(v)),
    z.string().regex(PROMO_CODE_PATTERN).optional(),
  ),
  specialRequests: z.preprocess(
    blankToUndefined,
    z
      .string()
      .max(1000)
      .refine((v) => !hasControlCharsExceptWhitespace(v), 'Invalid characters')
      .optional(),
  ),
  agreedToTerms: z.literal(true),
  website: z.preprocess(nullToUndefined, z.string().max(0).optional()), // honeypot: 사람은 이 칸을 보지 못한다
});

export type SubmitInput = z.infer<typeof submitInputSchema>;

export function parseSubmitInput(data: unknown): SubmitInput {
  const parsed = submitInputSchema.safeParse(data);
  if (!parsed.success) {
    throw new SubmitError('invalid_input', 'Please check the form and try again.', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const countsError = validateCounts(parsed.data.counts);
  if (countsError) throw new SubmitError('invalid_input', countsError);
  return parsed.data;
}
