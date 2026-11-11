// 서울마라톤 2027 투어 도메인 타입. 이 디렉터리는 웹과 Cloud Functions 가 공유하므로
// 외부 의존성 없이 상대 경로 import 만 사용한다.

export const CATEGORIES = [
  'full',
  'tenK',
  'companion',
  'childTenK',
  'childTenKNoBed',
  'child',
  'childNoBed',
  'infant',
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * 대회 참가(배번)가 있는 유형. 아동 10K 도 배번을 받는다.
 * 'child' 키는 2026-11-06 견적부터 "아동 응원(침대)" 로 의미가 좁혀졌다 (저장된 데이터와 호환을 위해 키는 유지).
 */
export const RUNNER_CATEGORIES: readonly Category[] = ['full', 'tenK', 'childTenK', 'childTenKNoBed'];
/** 성인(12세 이상) 유형. 아동·유아는 성인과 함께 여행해야 한다. */
export const ADULT_CATEGORIES: readonly Category[] = ['full', 'tenK', 'companion'];
/** 아동(2–11세) 유형 */
export const CHILD_CATEGORIES: readonly Category[] = ['childTenK', 'childTenKNoBed', 'child', 'childNoBed'];
/** 침대가 없는 유형. 객실 선택·싱글 추가요금이 없다 (보호자 침대를 함께 쓴다). */
export const NO_BED_CATEGORIES: readonly Category[] = ['childTenKNoBed', 'childNoBed', 'infant'];

export type CategoryGroupKey = 'adult' | 'child' | 'infant';
/** 인원 선택·편집 화면을 성인(12+)·아동(2–11)·유아(2세 미만) 로 묶어 보여줄 때 쓴다 (CATEGORIES 순서와 같다) */
export const CATEGORY_GROUPS: readonly { key: CategoryGroupKey; categories: readonly Category[] }[] = [
  { key: 'adult', categories: ADULT_CATEGORIES },
  { key: 'child', categories: CHILD_CATEGORIES },
  { key: 'infant', categories: ['infant'] },
];

/** 풀코스는 대회일 기준 18세 이상만 참가할 수 있다 (안내만 하고 막지는 않는다). */
export const FULL_MARATHON_MIN_AGE = 18;
/** 대회일 (YYYY-MM-DD). 풀코스 나이 기준일. */
export const RACE_DATE = '2027-03-21';
export const FULL_MARATHON_AGE_NOTICE = 'Full marathon: adults 18 and over only (age on race day, 21 March 2027).';

export const CATEGORY_LABELS: Record<Category, string> = {
  full: 'Full Marathon (18+)',
  tenK: '10K',
  companion: 'Companion',
  childTenK: 'Child 10K (with bed)',
  childTenKNoBed: 'Child 10K (no bed)',
  child: 'Child (with bed)',
  childNoBed: 'Child (no bed)',
  infant: 'Infant (under 2)',
};

/** 표·CSV 머리글처럼 짧은 이름이 필요한 곳에 쓴다 */
export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  full: 'Full',
  tenK: '10K',
  companion: 'Companion',
  childTenK: 'Child 10K',
  childTenKNoBed: 'Child 10K NB',
  child: 'Child',
  childNoBed: 'Child NB',
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
