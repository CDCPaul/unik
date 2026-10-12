import { z } from 'zod';
import { PROMO_CODE_PATTERN, TSHIRT_SIZES, validateCounts } from '../shared-domain';
import { SubmitError } from './errors';

const blankToUndefined = (v: unknown) => (typeof v === 'string' ? (v.trim() === '' ? undefined : v.trim()) : v);
const optText = (max: number) => z.preprocess(blankToUndefined, z.string().max(max).optional());
const count = z.number().int().min(0).max(10);

const travelerSchema = z.object({
  category: z.enum(['full', 'tenK', 'companion']),
  passportName: optText(80),
  dob: z.preprocess(blankToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
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
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
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
  specialRequests: optText(1000),
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
