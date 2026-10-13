// 서울마라톤 2027 투어 도메인 타입. 이 디렉터리는 웹과 Cloud Functions 가 공유하므로
// 외부 의존성 없이 상대 경로 import 만 사용한다.

export const CATEGORIES = ['full', 'tenK', 'companion', 'child', 'infant'] as const;
export type Category = (typeof CATEGORIES)[number];

/** 대회 참가(배번)가 있는 유형 */
export const RUNNER_CATEGORIES: readonly Category[] = ['full', 'tenK'];
/** 성인 유형. 아동·유아는 성인과 함께 여행해야 한다. */
export const ADULT_CATEGORIES: readonly Category[] = ['full', 'tenK', 'companion'];

export const CATEGORY_LABELS: Record<Category, string> = {
  full: 'Full Marathon',
  tenK: '10K',
  companion: 'Companion',
  child: 'Child (under 12)',
  infant: 'Infant (under 2)',
};

/** 표·CSV 머리글처럼 짧은 이름이 필요한 곳에 쓴다 */
export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  full: 'Full',
  tenK: '10K',
  companion: 'Companion',
  child: 'Child',
  infant: 'Infant',
};

export type Counts = Record<Category, number>;

export type RoomType = 'twin' | 'single';
export type Gender = 'female' | 'male';
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

export interface Traveler {
  category: Category;
  passportName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: Gender;
  nationality?: string;
  tshirtSize?: TshirtSize;
  expectedFinish?: string;
  recentMarathon?: string;
  room?: RoomType;
  emergencyContact?: string;
}

export interface Departure {
  id: string;
  label: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  flightInfo: string;
  seatCapacity: number;
  isOpen: boolean;
  prices: Record<Category, number>;
  singleSupplement: number;
}

export interface TourConfig {
  acceptingApplications: boolean;
  currency: 'PHP';
  depositPerPax: number;
  bibQuota: { total: number };
  mayaPaymentLinkBase: string | null;
  notifyEmails: string[];
  departures: Departure[];
}

export type DiscountType = 'fixed' | 'percent';

export interface PromoCode {
  code: string; // Firestore 문서 ID 와 동일
  agencyName: string;
  contactName?: string;
  contactInfo?: string;
  discountType: DiscountType;
  discountValue: number;
  validUntil: string | null; // YYYY-MM-DD (마닐라 날짜, 당일 포함)
  maxPax: number | null;
  active: boolean;
  notes?: string;
}

export interface PromoSnapshot {
  code: string;
  agencyName: string;
  type: DiscountType;
  value: number;
  discountTotal: number;
}

export interface PricingLine {
  category: Category;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Pricing {
  lines: PricingLine[];
  singleSupplements: number;
  subtotal: number;
  promo: PromoSnapshot | null;
  total: number;
  depositDue: number;
}

export const APPLICATION_STATUSES = [
  'new',
  'contacted',
  'deposit_paid',
  'fully_paid',
  'confirmed',
  'cancelled',
  'waitlist',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const PAYMENT_TYPES = ['deposit', 'balance', 'other'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export const PAYMENT_METHODS = [
  'maya_link',
  'maya_qr',
  'maya_terminal',
  'bank_transfer',
  'cash',
  'maya_checkout',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** 정원·프로모 집계에 필요한 신청서의 최소 정보 */
export interface ApplicationSummary {
  status: ApplicationStatus;
  departureId: string;
  counts: Counts;
  promoCode: string | null;
}

export interface Availability {
  bibsUsed: number;
  bibsTotal: number;
  departures: Record<string, { seatsUsed: number; seatCapacity: number }>;
}
