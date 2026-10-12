import { z } from 'zod';
import { PROMO_CODE_PATTERN, TSHIRT_SIZES, validateCounts } from '../shared-domain';
import { SubmitError } from './errors';

const blankToUndefined = (v: unknown) => (typeof v === 'string' ? (v.trim() === '' ? undefined : v.trim()) : v);
// ASCII 제어문자(U+0000–U+001F, U+007F). 메일 헤더·본문 주입과 로그 오염을 막는다.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
// 자유 서술칸은 줄바꿈(\n, \r)과 탭(\t)만 허용한다.
const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const NO_CONTROL = (v: string) => !CONTROL_CHARS.test(v);
const NO_LINK_OR_MARKUP = (v: string) => !/[<>]|:\/\/|www\./i.test(v);

const optText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().max(max).refine(NO_CONTROL, 'Invalid characters').optional());
const nameText = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine(NO_CONTROL, 'Invalid characters')
  .refine(NO_LINK_OR_MARKUP, 'Invalid characters');

// 실제 달력에 있는 날짜이며 1900-01-01 이상, 오늘(UTC) 이하여야 한다.
function isValidBirthDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return false;
  return v >= '1900-01-01' && v <= new Date().toISOString().slice(0, 10);
}
const count = z.number().int().min(0).max(10);

const travelerSchema = z.object({
  category: z.enum(['full', 'tenK', 'companion']),
  passportName: optText(80),
  dob: z.preprocess(blankToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidBirthDate, 'Invalid date').optional()),
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
  counts: z.object({ full: count, tenK: count, companion: count }),
  lead: z.object({
    firstName: nameText,
    lastName: nameText,
    email: z.string().trim().toLowerCase().email().max(120),
    phoneDial: z.string().regex(/^\+\d{1,4}$/),
    phoneNumber: z.string().trim().regex(/^[0-9 -]{6,20}$/),
    viber: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
  }),
  travelers: z.array(travelerSchema).max(10).default([]),
  promoCode: z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? undefined : v.trim().toUpperCase()) : v),
    z.string().regex(PROMO_CODE_PATTERN).optional(),
  ),
  specialRequests: z.preprocess(
    blankToUndefined,
    z
      .string()
      .max(1000)
      .refine((v) => !CONTROL_CHARS_EXCEPT_WHITESPACE.test(v), 'Invalid characters')
      .optional(),
  ),
  agreedToTerms: z.literal(true),
  website: z.string().max(0).optional(), // honeypot: 사람은 이 칸을 보지 못한다
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
