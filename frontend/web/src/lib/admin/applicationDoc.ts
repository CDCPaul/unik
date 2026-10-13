import { normalizeCounts } from '@unik/shared/domain';
import type {
  ApplicationStatus,
  Counts,
  PaymentMethod,
  PaymentType,
  Pricing,
  Traveler,
} from '@unik/shared/domain';

export interface PaymentRecord {
  id: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  paidAt: Date;
  reference?: string;
  recordedBy: string;
  /** 취소(void)된 결제. 기록은 남기고 합계에서만 제외한다. */
  voidedAt?: Date;
  voidedBy?: string;
}

export interface StatusEvent {
  status: ApplicationStatus;
  at: Date;
  by: string;
}

export interface ApplicationRecord {
  id: string;
  appNo: string;
  status: ApplicationStatus;
  departure: { id: string; label: string; departDate: string; returnDate: string };
  lead: { firstName: string; lastName: string; email: string; phoneDial: string; phoneNumber: string; viber: boolean; whatsapp: boolean };
  counts: Counts;
  travelers: Traveler[];
  completeness: { filled: number; total: number };
  pricing: Pricing;
  payments: PaymentRecord[];
  paidTotal: number;
  specialRequests: string | null;
  staffNotes: string | null;
  statusHistory: StatusEvent[];
  createdAt: Date | null;
  notifications: { customerEmail?: string; customerEmailError?: string; staffEmail?: string; staffEmailError?: string } | null;
}

type Obj = Record<string, unknown>;

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  const fn = (v as { toDate?: () => Date } | null | undefined)?.toDate;
  return typeof fn === 'function' ? fn.call(v) : null;
}

const EMPTY_PRICING: Pricing = { lines: [], singleSupplements: 0, subtotal: 0, promo: null, total: 0, depositDue: 0 };

export function fromApplicationDoc(id: string, data: Obj): ApplicationRecord {
  const lead = (data.lead ?? {}) as Obj;
  const departure = (data.departure ?? {}) as Obj;
  return {
    id,
    appNo: String(data.appNo ?? ''),
    status: (data.status as ApplicationStatus) ?? 'new',
    departure: {
      id: String(departure.id ?? ''),
      label: String(departure.label ?? ''),
      departDate: String(departure.departDate ?? ''),
      returnDate: String(departure.returnDate ?? ''),
    },
    lead: {
      firstName: String(lead.firstName ?? ''),
      lastName: String(lead.lastName ?? ''),
      email: String(lead.email ?? ''),
      phoneDial: String(lead.phoneDial ?? ''),
      phoneNumber: String(lead.phoneNumber ?? ''),
      viber: lead.viber === true,
      whatsapp: lead.whatsapp === true,
    },
    // 예전 신청서에는 child/infant 키가 없다
    counts: normalizeCounts(data.counts),
    travelers: Array.isArray(data.travelers) ? (data.travelers as Traveler[]) : [],
    completeness: (data.completeness as { filled: number; total: number }) ?? { filled: 0, total: 0 },
    pricing: (data.pricing as Pricing) ?? EMPTY_PRICING,
    payments: Array.isArray(data.payments)
      ? (data.payments as Obj[]).map((p) => ({
          id: String(p.id ?? ''),
          type: p.type as PaymentType,
          method: p.method as PaymentMethod,
          amount: Number(p.amount ?? 0),
          paidAt: toDate(p.paidAt) ?? new Date(0),
          reference: typeof p.reference === 'string' ? p.reference : undefined,
          recordedBy: String(p.recordedBy ?? ''),
          ...(toDate(p.voidedAt) ? { voidedAt: toDate(p.voidedAt)!, voidedBy: String(p.voidedBy ?? '') } : {}),
        }))
      : [],
    paidTotal: Number(data.paidTotal ?? 0),
    specialRequests: typeof data.specialRequests === 'string' ? data.specialRequests : null,
    staffNotes: typeof data.staffNotes === 'string' ? data.staffNotes : null,
    statusHistory: Array.isArray(data.statusHistory)
      ? (data.statusHistory as Obj[]).map((e) => ({
          status: e.status as ApplicationStatus,
          at: toDate(e.at) ?? new Date(0),
          by: String(e.by ?? ''),
        }))
      : [],
    createdAt: toDate(data.createdAt),
    notifications: (data.notifications as ApplicationRecord['notifications']) ?? null,
  };
}
