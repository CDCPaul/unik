# Seoul 2027 — Part 1: Foundation (정리 · 도메인 로직 · 보안 규칙 · 서버 함수) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 KBL·벚꽃마라톤·룰렛·e-티켓 기능을 걷어내고(명함만 유지), 서울마라톤 2027 신청 접수에 필요한 공용 도메인 로직·Firestore 보안 규칙·Cloud Functions(신청 제출, 프로모 확인, 남은 자리 재계산, 메일)를 테스트와 함께 완성한다.

**Architecture:** 순수 TypeScript 도메인 모듈을 `shared/domain/` 에 두고 vitest 로 단위 테스트한다. 웹은 tsconfig 경로(`@unik/shared/domain`)로, Functions 는 빌드 때 `src/shared-domain/` 으로 복사해 같은 코드를 쓴다. 신청서 생성은 callable 함수가 트랜잭션 안에서 검증·가격 계산·정원 판정·번호 발급을 하고, Firestore 규칙은 클라이언트의 신청서 직접 쓰기를 막는다. 서버 함수와 규칙은 Firebase 에뮬레이터(`demo-unik` 프로젝트)에서 테스트한다.

**Tech Stack:** Next.js 16 (App Router), Firebase JS SDK, firebase-admin 13, firebase-functions 6 (v2 API), Resend 2.1, zod 3, vitest 3, @firebase/rules-unit-testing, Firebase Emulator (Java 21), pnpm workspace(웹·shared·rules-tests) + npm(backend/functions)

**Spec:** `docs/superpowers/specs/2026-10-12-seoul-marathon-2027-site-design.md`

**이 계획의 범위:** 3부작 중 1부. 2부(공개 사이트·신청 폼)와 3부(어드민)는 이 계획이 만든 인터페이스(아래 Produces)를 사용하며, 1부 완료 후 별도 계획으로 작성한다. 1부가 끝나면 브랜치의 웹은 "Coming soon" 홈 + 명함 + 어드민(명함만) 상태이고, 백엔드는 에뮬레이터에서 완전히 동작한다. **이 계획에서는 운영 배포를 하지 않는다.**

## Global Constraints

- 브랜치: `feat/seoul-2027` 에서만 작업. main 에 직접 커밋/푸시 금지.
- 운영 환경(`unik-90206`)에 쓰기·배포·삭제하는 명령은 실행하지 않는다 (Task 1 의 태그 푸시·백업은 사용자 확인 후).
- 명함 기능은 동작·모양이 바뀌면 안 된다: `src/app/profile/**`, `src/app/admin/(dashboard)/business-cards/page.tsx`, `src/lib/services/businessCards.ts`, `src/lib/services/admin/businessCards.ts`, `src/lib/vcard.ts`, `src/lib/businessCardConfig.ts`, `src/lib/auth.ts`, `src/lib/firebase.ts`, `next.config.js` 의 `remotePatterns`, `globals.css` 는 이 계획에서 수정하지 않는다 (globals.css 개편은 2부).
- 투어 ID: `seoul2027`. 컬렉션: `tourConfig`, `availability`, `applications`, `promoCodes`, `counters`, `contacts`, `business_cards`.
- 통화 PHP, 정수 페소. 할인은 1인당·모든 유형, 싱글 추가요금 제외, 정률은 페소 내림.
- 신청서 인원 합계 1–10. 배번 = full + tenK, 총량 공용(선착순). 동반자는 배번 미사용.
- 프로모 코드 형식 `^[A-Z0-9-]{3,20}$`, 문서 ID = 코드, 만료 판정은 마닐라 날짜(UTC+8) 기준 `validUntil` 당일까지 유효.
- 정원 계산에서 `cancelled`·`waitlist` 는 제외. 프로모 사용 인원 계산에서는 `cancelled` 만 제외.
- 함수 리전 `asia-northeast3`. 메일 발신 `noreply@unik.ph` (Resend). 알림 수신자 = `tourConfig/seoul2027.notifyEmails`, 비어 있으면 `ticket@cebudirectclub.com`.
- 어드민 신청서 상세 URL 규약: `https://unik.ph/admin/applicants?id=<docId>` (3부가 이 경로를 구현).
- backend/functions 는 **npm** 으로 의존성 관리(package-lock.json 유지). 나머지는 pnpm.
- 에뮬레이터 테스트는 항상 `--project demo-unik` (운영 접속 불가능한 데모 프로젝트).

## Review Focus

1. **중복 제출(더블클릭·네트워크 재시도)**: 같은 `idempotencyKey` 로 두 번 제출해도 신청서는 1건, 같은 신청번호 반환 → Task 7 테스트 `returns the existing application for a repeated idempotencyKey`.
2. **마지막 남은 자리에 동시 제출**: 배번 1석 남았을 때 두 건이 동시에 들어오면 정확히 1건 `new`, 1건 `waitlist` → Task 7 테스트 `two concurrent submissions for the last bib`.
3. **프로모 만료일 경계(시간대)**: 마닐라 기준 만료일 23:59 까지는 유효, 자정부터 만료 → Task 3 테스트 `uses Manila date for expiry`.
4. **메일 HTML 주입**: 이름·요청사항에 `<script>` 등이 들어와도 메일에 그대로 렌더링되지 않음 → Task 6 `contact email escapes`, Task 8 `escapes user-provided text`.
5. **설정에서 삭제된 출발편을 가진 기존 신청서**: 남은 자리 계산이 깨지지 않고 배번에는 계속 반영 → Task 3 테스트 `ignores seats for departures no longer in config`.

---

## File Structure

**Create**
- `shared/domain/types.ts` — 도메인 타입·상수 (Category, Counts, Traveler, Departure, TourConfig, PromoCode, Pricing, ApplicationStatus, ApplicationSummary, Availability)
- `shared/domain/counts.ts` — 인원 합계·검증·참가자 배열 생성
- `shared/domain/format.ts` — 신청번호·금액·인원 문구 포맷
- `shared/domain/pricing.ts` — 가격 계산
- `shared/domain/promo.ts` — 코드 정규화·형식·유효성 판정·사용 인원·할인 문구
- `shared/domain/completeness.ts` — 참가자 정보 완성도
- `shared/domain/availability.ts` — 남은 배번/좌석 계산, 초과 판정
- `shared/domain/index.ts`
- `shared/domain/*.test.ts` — 단위 테스트
- `shared/tsconfig.json`
- `backend/rules-tests/package.json`, `backend/rules-tests/firestore.rules.test.ts`, `backend/rules-tests/vitest.config.mts`
- `backend/functions/scripts/copy-shared.mjs`
- `backend/functions/vitest.config.mts`
- `backend/functions/src/lib/{collections,email,strip,tourConfig}.ts`
- `backend/functions/src/contact.ts`, `backend/functions/src/contact.test.ts`
- `backend/functions/src/applications/{errors,input,summary,submit,promo,callables,availability,emails,triggers}.ts` + 테스트
- `backend/functions/src/test/{setup,helpers}.ts`
- `frontend/web/src/app/page.tsx` (Coming soon)
- `.github/workflows/ci.yml`

**Modify**
- `shared/package.json`, `shared/types/index.ts`, `shared/firebase/config.ts`
- `frontend/web/src/app/layout.tsx`, `frontend/web/src/app/admin/(dashboard)/page.tsx`, `frontend/web/src/components/admin/Sidebar.tsx`, `frontend/web/package.json`
- `backend/functions/src/index.ts`, `backend/functions/package.json`, `backend/functions/tsconfig.json`, `backend/functions/.gitignore`
- `firestore.rules`, `firebase.json`, `package.json`(root), `README.md`

**Delete** — Task 4 목록 참조.

---

### Task 1: 아카이브 태그와 Firestore 백업

**Files:** 없음 (git 태그, 운영 백업)

- [ ] **Step 1: 아카이브 태그 생성 (main 의 개편 전 커밋)**

```bash
cd /c/Users/hanas/CBM
git tag -a archive/pre-seoul-2027 main -m "Archive: KBL / Cherry Blossom / roulette / e-ticket site before Seoul 2027 rebuild"
git show archive/pre-seoul-2027 --stat --oneline | head -3
```
Expected: 태그가 `e4956c0 feat(business-cards): vCard 에 고정 UID 추가` 를 가리킴.

- [ ] **Step 2: 사용자에게 확인 후 태그 푸시**

사용자에게 "아카이브 태그를 원격(GitHub)에 올려도 될까요?" 확인. 승인 시:
```bash
git push origin archive/pre-seoul-2027
```

- [ ] **Step 3: Firestore 백업 안내 (사용자가 직접 실행)**

사용자에게 아래 명령을 전달하고 실행 결과를 받는다 (Google Cloud 소유자 권한 필요, 운영 데이터 읽기 전용 작업):
```bash
gcloud firestore export gs://unik-90206.firebasestorage.app/backups/2026-10-13-pre-seoul-2027 --project=unik-90206
```
Expected: `outputUriPrefix: gs://unik-90206.firebasestorage.app/backups/2026-10-13-pre-seoul-2027`. 사용자가 gcloud 가 없으면 Firebase 콘솔 → Firestore → Import/Export 로 같은 경로에 내보내기. 백업 완료 전에는 Task 4 이후 작업을 **운영에 배포하지 않는다** (이 계획 자체는 배포하지 않으므로 다음 Task 진행은 가능).

---

### Task 2: 도메인 모듈 — 타입, 인원, 포맷, 가격 계산

**Files:**
- Create: `shared/domain/types.ts`, `shared/domain/counts.ts`, `shared/domain/format.ts`, `shared/domain/pricing.ts`, `shared/domain/index.ts`, `shared/tsconfig.json`
- Test: `shared/domain/counts.test.ts`, `shared/domain/format.test.ts`, `shared/domain/pricing.test.ts`
- Modify: `shared/package.json`

**Interfaces:**
- Produces (모든 후속 Task 와 2·3부가 사용):
  - `CATEGORIES: readonly ['full','tenK','companion']`, `type Category`, `type Counts = Record<Category, number>`, `CATEGORY_LABELS: Record<Category,string>`
  - `interface Traveler`, `interface Departure`, `interface TourConfig`, `type DiscountType`, `interface PromoCode`, `interface PromoSnapshot`, `interface PricingLine`, `interface Pricing`, `APPLICATION_STATUSES`, `type ApplicationStatus`, `interface ApplicationSummary { status; departureId; counts; promoCode: string|null }`, `interface Availability`
  - `MAX_PAX_PER_APPLICATION = 10`, `totalPax(c): number`, `runnerCount(c): number`, `validateCounts(c): string|null`, `buildTravelers(counts, provided?): Traveler[]`
  - `formatAppNo(seq): string`, `formatPHP(amount): string`, `describeCounts(c): string`
  - `computePricing(input: PricingInput): Pricing`

- [ ] **Step 1: shared 패키지에 테스트 도구 설치**

```bash
cd /c/Users/hanas/CBM
pnpm --filter @unik/shared add -D vitest@^3.2.4 typescript@^5.9.3
```
그 다음 `shared/package.json` 을 아래 내용으로 맞춘다 (devDependencies 버전은 설치된 값 유지):
```json
{
  "name": "@unik/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./types": "./types/index.ts",
    "./firebase": "./firebase/config.ts",
    "./domain": "./domain/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```
`shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["domain"]
}
```

- [ ] **Step 2: 타입 파일 작성 (테스트 대상 아님, 다른 모듈이 의존)**

`shared/domain/types.ts`:
```ts
// 서울마라톤 2027 투어 도메인 타입. 이 디렉터리는 웹과 Cloud Functions 가 공유하므로
// 외부 의존성 없이 상대 경로 import 만 사용한다.

export const CATEGORIES = ['full', 'tenK', 'companion'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  full: 'Full Marathon',
  tenK: '10K',
  companion: 'Companion',
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
```

- [ ] **Step 3: counts·format 실패 테스트 작성**

`shared/domain/counts.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildTravelers, runnerCount, totalPax, validateCounts } from './counts';

describe('totalPax / runnerCount', () => {
  it('sums all categories and runners only', () => {
    const c = { full: 2, tenK: 1, companion: 3 };
    expect(totalPax(c)).toBe(6);
    expect(runnerCount(c)).toBe(3);
  });
});

describe('validateCounts', () => {
  it('accepts 1 to 10 travelers', () => {
    expect(validateCounts({ full: 1, tenK: 0, companion: 0 })).toBeNull();
    expect(validateCounts({ full: 4, tenK: 3, companion: 3 })).toBeNull();
  });
  it('rejects zero travelers', () => {
    expect(validateCounts({ full: 0, tenK: 0, companion: 0 })).toBe('At least one traveler is required');
  });
  it('rejects more than 10 travelers', () => {
    expect(validateCounts({ full: 5, tenK: 5, companion: 1 })).toBe('Maximum 10 travelers per application');
  });
  it('rejects negative or fractional counts', () => {
    expect(validateCounts({ full: -1, tenK: 2, companion: 0 })).toBe('Invalid full count');
    expect(validateCounts({ full: 1, tenK: 0.5, companion: 0 })).toBe('Invalid tenK count');
  });
});

describe('buildTravelers', () => {
  it('creates one entry per traveler ordered full, tenK, companion', () => {
    const t = buildTravelers({ full: 1, tenK: 1, companion: 1 });
    expect(t.map((x) => x.category)).toEqual(['full', 'tenK', 'companion']);
  });
  it('keeps provided details per category in order and drops extras', () => {
    const t = buildTravelers({ full: 2, tenK: 0, companion: 1 }, [
      { category: 'companion', passportName: 'C ONE' },
      { category: 'full', passportName: 'F ONE' },
      { category: 'full', passportName: 'F TWO' },
      { category: 'full', passportName: 'F THREE' },
      { category: 'tenK', passportName: 'T ONE' },
    ]);
    expect(t).toEqual([
      { category: 'full', passportName: 'F ONE' },
      { category: 'full', passportName: 'F TWO' },
      { category: 'companion', passportName: 'C ONE' },
    ]);
  });
});
```
`shared/domain/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { describeCounts, formatAppNo, formatPHP } from './format';

describe('format', () => {
  it('formats application numbers with 4-digit padding', () => {
    expect(formatAppNo(1)).toBe('APP-0001');
    expect(formatAppNo(12345)).toBe('APP-12345');
  });
  it('formats pesos with thousands separators', () => {
    expect(formatPHP(230000)).toBe('PHP 230,000');
    expect(formatPHP(0)).toBe('PHP 0');
  });
  it('describes counts skipping zero categories', () => {
    expect(describeCounts({ full: 2, tenK: 0, companion: 1 })).toBe('2 Full Marathon, 1 Companion');
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `pnpm --filter @unik/shared test`
Expected: FAIL — `Failed to resolve import "./counts"` / `"./format"`.

- [ ] **Step 5: counts·format 구현**

`shared/domain/counts.ts`:
```ts
import { CATEGORIES } from './types';
import type { Counts, Traveler } from './types';

export const MAX_PAX_PER_APPLICATION = 10;

export function totalPax(counts: Counts): number {
  return counts.full + counts.tenK + counts.companion;
}

export function runnerCount(counts: Counts): number {
  return counts.full + counts.tenK;
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
  return null;
}

/** counts 에 맞춰 참가자 배열을 만든다. provided 는 같은 유형끼리 순서대로 매칭된다. */
export function buildTravelers(counts: Counts, provided: Traveler[] = []): Traveler[] {
  const travelers: Traveler[] = [];
  for (const category of CATEGORIES) {
    const given = provided.filter((t) => t.category === category);
    for (let i = 0; i < counts[category]; i++) {
      travelers.push(given[i] ? { ...given[i], category } : { category });
    }
  }
  return travelers;
}
```
`shared/domain/format.ts`:
```ts
import { CATEGORIES, CATEGORY_LABELS } from './types';
import type { Counts } from './types';

export function formatAppNo(seq: number): string {
  return `APP-${String(seq).padStart(4, '0')}`;
}

export function formatPHP(amount: number): string {
  return `PHP ${amount.toLocaleString('en-US')}`;
}

export function describeCounts(counts: Counts): string {
  return CATEGORIES.filter((c) => counts[c] > 0)
    .map((c) => `${counts[c]} ${CATEGORY_LABELS[c]}`)
    .join(', ');
}
```

- [ ] **Step 6: pricing 실패 테스트 작성**

`shared/domain/pricing.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computePricing } from './pricing';
import type { PricingInput } from './pricing';

const departure = {
  prices: { full: 80000, tenK: 75000, companion: 70000 },
  singleSupplement: 15000,
};

function input(over: Partial<PricingInput> = {}): PricingInput {
  return {
    departure,
    counts: { full: 2, tenK: 0, companion: 1 },
    travelers: [{}, {}, {}],
    promo: null,
    depositPerPax: 10000,
    ...over,
  };
}

describe('computePricing', () => {
  it('prices each category without promo and omits zero lines', () => {
    const p = computePricing(input());
    expect(p.lines).toEqual([
      { category: 'full', qty: 2, unitPrice: 80000, amount: 160000 },
      { category: 'companion', qty: 1, unitPrice: 70000, amount: 70000 },
    ]);
    expect(p.subtotal).toBe(230000);
    expect(p.promo).toBeNull();
    expect(p.total).toBe(230000);
    expect(p.depositDue).toBe(30000);
  });

  it('applies a fixed discount per person', () => {
    const p = computePricing(
      input({ promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', discountType: 'fixed', discountValue: 2000 } }),
    );
    expect(p.promo).toEqual({ code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 });
    expect(p.total).toBe(224000);
  });

  it('applies a percent discount on base prices, floored to the peso', () => {
    const p = computePricing(
      input({
        counts: { full: 0, tenK: 1, companion: 0 },
        travelers: [{}],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 3.33 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(2497); // 75000 * 3.33% = 2497.5
    expect(p.total).toBe(72503);
  });

  it('adds single supplements and never discounts them', () => {
    const p = computePricing(
      input({
        travelers: [{ room: 'single' }, {}, { room: 'twin' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 5 },
      }),
    );
    expect(p.singleSupplements).toBe(15000);
    expect(p.subtotal).toBe(245000);
    expect(p.promo?.discountTotal).toBe(11500); // 5% of 230000
    expect(p.total).toBe(233500);
  });

  it('caps a fixed discount at the base price', () => {
    const p = computePricing(
      input({
        counts: { full: 1, tenK: 0, companion: 0 },
        travelers: [{ room: 'single' }],
        promo: { code: 'TA-X', agencyName: 'X', discountType: 'fixed', discountValue: 100000 },
      }),
    );
    expect(p.promo?.discountTotal).toBe(80000);
    expect(p.total).toBe(15000);
  });
});
```

- [ ] **Step 7: 실패 확인**

Run: `pnpm --filter @unik/shared test`
Expected: FAIL — `Failed to resolve import "./pricing"`.

- [ ] **Step 8: pricing 구현 + index**

`shared/domain/pricing.ts`:
```ts
import { CATEGORIES } from './types';
import type { Counts, Departure, Pricing, PricingLine, PromoCode, PromoSnapshot, Traveler } from './types';
import { totalPax } from './counts';

export interface PricingInput {
  departure: Pick<Departure, 'prices' | 'singleSupplement'>;
  counts: Counts;
  travelers: Pick<Traveler, 'room'>[];
  promo: Pick<PromoCode, 'code' | 'agencyName' | 'discountType' | 'discountValue'> | null;
  depositPerPax: number;
}

export function computePricing(input: PricingInput): Pricing {
  const lines: PricingLine[] = CATEGORIES.filter((c) => input.counts[c] > 0).map((c) => ({
    category: c,
    qty: input.counts[c],
    unitPrice: input.departure.prices[c],
    amount: input.counts[c] * input.departure.prices[c],
  }));
  const base = lines.reduce((sum, line) => sum + line.amount, 0);
  const singles = input.travelers.filter((t) => t.room === 'single').length;
  const singleSupplements = singles * input.departure.singleSupplement;
  const pax = totalPax(input.counts);

  let promo: PromoSnapshot | null = null;
  if (input.promo) {
    const raw =
      input.promo.discountType === 'fixed'
        ? input.promo.discountValue * pax
        : Math.floor((base * input.promo.discountValue) / 100);
    promo = {
      code: input.promo.code,
      agencyName: input.promo.agencyName,
      type: input.promo.discountType,
      value: input.promo.discountValue,
      discountTotal: Math.min(Math.max(raw, 0), base),
    };
  }

  const subtotal = base + singleSupplements;
  return {
    lines,
    singleSupplements,
    subtotal,
    promo,
    total: subtotal - (promo ? promo.discountTotal : 0),
    depositDue: input.depositPerPax * pax,
  };
}
```
`shared/domain/index.ts`:
```ts
export * from './types';
export * from './counts';
export * from './format';
export * from './pricing';
```

- [ ] **Step 9: 통과 확인**

Run: `pnpm --filter @unik/shared test && pnpm --filter @unik/shared typecheck`
Expected: 모든 테스트 PASS, typecheck 오류 없음.

- [ ] **Step 10: Commit**

```bash
git add shared/package.json shared/tsconfig.json shared/domain pnpm-lock.yaml
git commit -m "feat(domain): 투어 도메인 타입, 인원·포맷·가격 계산 모듈 추가"
```

---

### Task 3: 도메인 모듈 — 프로모 판정, 완성도, 남은 자리

**Files:**
- Create: `shared/domain/promo.ts`, `shared/domain/completeness.ts`, `shared/domain/availability.ts`
- Test: `shared/domain/promo.test.ts`, `shared/domain/completeness.test.ts`, `shared/domain/availability.test.ts`
- Modify: `shared/domain/index.ts`

**Interfaces:**
- Consumes: Task 2 의 `types.ts`, `totalPax`, `runnerCount`, `formatPHP`
- Produces:
  - `PROMO_CODE_PATTERN: RegExp`, `normalizePromoCode(raw: string): string`, `isValidPromoCodeFormat(code: string): boolean`, `manilaDate(now: Date): string`
  - `type PromoInvalidReason = 'not_found'|'inactive'|'expired'|'limit_reached'`, `type PromoEvaluation = {valid:true} | {valid:false; reason: PromoInvalidReason}`
  - `evaluatePromo(promo: Pick<PromoCode,'active'|'validUntil'|'maxPax'> | null, ctx: {now: Date; usedPax: number; requestedPax: number}): PromoEvaluation`
  - `promoUsagePax(apps: ApplicationSummary[], code: string): number`, `describeDiscount(type: DiscountType, value: number): string`
  - `requiredFieldsFor(category): readonly TravelerField[]`, `missingFields(t: Traveler): TravelerField[]`, `computeCompleteness(travelers: Traveler[]): {filled: number; total: number}`
  - `isActiveStatus(s: ApplicationStatus): boolean`, `computeAvailability(config: Pick<TourConfig,'bibQuota'|'departures'>, apps: ApplicationSummary[]): Availability`, `exceedsCapacity(av: Availability, departureId: string, counts: Counts): boolean`

- [ ] **Step 1: 실패 테스트 작성**

`shared/domain/promo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  describeDiscount,
  evaluatePromo,
  isValidPromoCodeFormat,
  manilaDate,
  normalizePromoCode,
  promoUsagePax,
} from './promo';
import type { ApplicationSummary } from './types';

const now = new Date('2026-10-20T03:00:00Z');
const active = { active: true, validUntil: null, maxPax: null };

describe('promo code format', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizePromoCode('  ta-sunrise ')).toBe('TA-SUNRISE');
  });
  it('accepts A-Z, 0-9 and hyphen, 3 to 20 chars', () => {
    expect(isValidPromoCodeFormat('TA-SUNRISE')).toBe(true);
    expect(isValidPromoCodeFormat('AB')).toBe(false);
    expect(isValidPromoCodeFormat('TA_SUNRISE')).toBe(false);
    expect(isValidPromoCodeFormat('A'.repeat(21))).toBe(false);
  });
});

describe('evaluatePromo', () => {
  it('rejects a missing code', () => {
    expect(evaluatePromo(null, { now, usedPax: 0, requestedPax: 1 })).toEqual({ valid: false, reason: 'not_found' });
  });
  it('rejects an inactive code', () => {
    expect(evaluatePromo({ ...active, active: false }, { now, usedPax: 0, requestedPax: 1 })).toEqual({
      valid: false,
      reason: 'inactive',
    });
  });
  it('uses Manila date for expiry', () => {
    const promo = { ...active, validUntil: '2026-10-31' };
    expect(manilaDate(new Date('2026-10-31T15:59:00Z'))).toBe('2026-10-31');
    expect(evaluatePromo(promo, { now: new Date('2026-10-31T15:59:00Z'), usedPax: 0, requestedPax: 1 })).toEqual({
      valid: true,
    });
    expect(evaluatePromo(promo, { now: new Date('2026-10-31T16:00:00Z'), usedPax: 0, requestedPax: 1 })).toEqual({
      valid: false,
      reason: 'expired',
    });
  });
  it('enforces maxPax including the requested travelers', () => {
    const promo = { ...active, maxPax: 10 };
    expect(evaluatePromo(promo, { now, usedPax: 8, requestedPax: 2 })).toEqual({ valid: true });
    expect(evaluatePromo(promo, { now, usedPax: 8, requestedPax: 3 })).toEqual({ valid: false, reason: 'limit_reached' });
  });
});

describe('promoUsagePax', () => {
  it('counts every status except cancelled for the given code', () => {
    const apps: ApplicationSummary[] = [
      { status: 'new', departureId: 'mnl', counts: { full: 2, tenK: 0, companion: 1 }, promoCode: 'TA-A' },
      { status: 'waitlist', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: 'TA-A' },
      { status: 'cancelled', departureId: 'mnl', counts: { full: 4, tenK: 0, companion: 0 }, promoCode: 'TA-A' },
      { status: 'confirmed', departureId: 'ceb', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: 'TA-B' },
      { status: 'new', departureId: 'ceb', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: null },
    ];
    expect(promoUsagePax(apps, 'TA-A')).toBe(4);
  });
});

describe('describeDiscount', () => {
  it('describes fixed and percent discounts', () => {
    expect(describeDiscount('fixed', 2000)).toBe('PHP 2,000 off per person');
    expect(describeDiscount('percent', 5)).toBe('5% off');
  });
});
```
`shared/domain/completeness.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeCompleteness, missingFields } from './completeness';

describe('completeness', () => {
  it('counts 8 fields for runners and 6 for companions', () => {
    expect(computeCompleteness([{ category: 'full' }, { category: 'companion' }])).toEqual({ filled: 0, total: 14 });
  });
  it('counts only non-blank values', () => {
    const r = computeCompleteness([
      { category: 'tenK', passportName: 'SANTOS MARIA', dob: '1990-05-14', nationality: '   ', room: 'twin' },
    ]);
    expect(r).toEqual({ filled: 3, total: 8 });
  });
  it('lists missing fields for a traveler', () => {
    expect(
      missingFields({
        category: 'companion',
        passportName: 'A',
        dob: '1990-01-01',
        gender: 'male',
        nationality: 'Philippines',
        room: 'twin',
      }),
    ).toEqual(['emergencyContact']);
  });
});
```
`shared/domain/availability.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeAvailability, exceedsCapacity } from './availability';
import type { ApplicationSummary } from './types';

const config = {
  bibQuota: { total: 3 },
  departures: [
    { id: 'mnl', seatCapacity: 4 },
    { id: 'ceb', seatCapacity: 10 },
  ] as never[],
};

const apps: ApplicationSummary[] = [
  { status: 'new', departureId: 'mnl', counts: { full: 2, tenK: 0, companion: 1 }, promoCode: null },
  { status: 'cancelled', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: null },
  { status: 'waitlist', departureId: 'mnl', counts: { full: 1, tenK: 0, companion: 0 }, promoCode: null },
  { status: 'contacted', departureId: 'ceb', counts: { full: 0, tenK: 0, companion: 1 }, promoCode: null },
];

describe('computeAvailability', () => {
  it('excludes cancelled and waitlisted applications', () => {
    expect(computeAvailability(config, apps)).toEqual({
      bibsUsed: 2,
      bibsTotal: 3,
      departures: { mnl: { seatsUsed: 3, seatCapacity: 4 }, ceb: { seatsUsed: 1, seatCapacity: 10 } },
    });
  });
  it('ignores seats for departures no longer in config but still counts their bibs', () => {
    const av = computeAvailability(config, [
      ...apps,
      { status: 'new', departureId: 'old', counts: { full: 1, tenK: 0, companion: 2 }, promoCode: null },
    ]);
    expect(av.bibsUsed).toBe(3);
    expect(Object.keys(av.departures)).toEqual(['mnl', 'ceb']);
  });
});

describe('exceedsCapacity', () => {
  const av = computeAvailability(config, apps); // bibs 2/3, mnl 3/4
  it('detects bib overflow', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 2, tenK: 0, companion: 0 })).toBe(true);
  });
  it('allows exactly filling bibs and seats', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe(false);
  });
  it('detects seat overflow even for companions', () => {
    expect(exceedsCapacity(av, 'mnl', { full: 0, tenK: 0, companion: 2 })).toBe(true);
  });
  it('treats an unknown departure as full', () => {
    expect(exceedsCapacity(av, 'xyz', { full: 0, tenK: 0, companion: 1 })).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter @unik/shared test`
Expected: FAIL — `./promo`, `./completeness`, `./availability` import 실패.

- [ ] **Step 3: 구현**

`shared/domain/promo.ts`:
```ts
import type { ApplicationSummary, DiscountType, PromoCode } from './types';
import { totalPax } from './counts';
import { formatPHP } from './format';

export const PROMO_CODE_PATTERN = /^[A-Z0-9-]{3,20}$/;

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidPromoCodeFormat(code: string): boolean {
  return PROMO_CODE_PATTERN.test(code);
}

/** 마닐라(UTC+8) 기준 YYYY-MM-DD */
export function manilaDate(now: Date): string {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export type PromoInvalidReason = 'not_found' | 'inactive' | 'expired' | 'limit_reached';
export type PromoEvaluation = { valid: true } | { valid: false; reason: PromoInvalidReason };

export function evaluatePromo(
  promo: Pick<PromoCode, 'active' | 'validUntil' | 'maxPax'> | null,
  ctx: { now: Date; usedPax: number; requestedPax: number },
): PromoEvaluation {
  if (!promo) return { valid: false, reason: 'not_found' };
  if (!promo.active) return { valid: false, reason: 'inactive' };
  if (promo.validUntil && manilaDate(ctx.now) > promo.validUntil) return { valid: false, reason: 'expired' };
  if (promo.maxPax !== null && ctx.usedPax + ctx.requestedPax > promo.maxPax) {
    return { valid: false, reason: 'limit_reached' };
  }
  return { valid: true };
}

export function promoUsagePax(apps: ApplicationSummary[], code: string): number {
  return apps
    .filter((a) => a.promoCode === code && a.status !== 'cancelled')
    .reduce((sum, a) => sum + totalPax(a.counts), 0);
}

export function describeDiscount(type: DiscountType, value: number): string {
  return type === 'fixed' ? `${formatPHP(value)} off per person` : `${value}% off`;
}
```
`shared/domain/completeness.ts`:
```ts
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
```
`shared/domain/availability.ts`:
```ts
import type { ApplicationStatus, ApplicationSummary, Availability, Counts, TourConfig } from './types';
import { runnerCount, totalPax } from './counts';

/** 정원을 차지하는 상태인가 (취소·대기는 자리를 차지하지 않음) */
export function isActiveStatus(status: ApplicationStatus): boolean {
  return status !== 'cancelled' && status !== 'waitlist';
}

export function computeAvailability(
  config: Pick<TourConfig, 'bibQuota' | 'departures'>,
  apps: ApplicationSummary[],
): Availability {
  const departures: Availability['departures'] = {};
  for (const d of config.departures) departures[d.id] = { seatsUsed: 0, seatCapacity: d.seatCapacity };

  let bibsUsed = 0;
  for (const app of apps) {
    if (!isActiveStatus(app.status)) continue;
    bibsUsed += runnerCount(app.counts);
    const dep = departures[app.departureId];
    if (dep) dep.seatsUsed += totalPax(app.counts);
  }
  return { bibsUsed, bibsTotal: config.bibQuota.total, departures };
}

export function exceedsCapacity(av: Availability, departureId: string, counts: Counts): boolean {
  const dep = av.departures[departureId];
  if (!dep) return true;
  if (av.bibsUsed + runnerCount(counts) > av.bibsTotal) return true;
  return dep.seatsUsed + totalPax(counts) > dep.seatCapacity;
}
```
`shared/domain/index.ts` 에 추가:
```ts
export * from './types';
export * from './counts';
export * from './format';
export * from './pricing';
export * from './promo';
export * from './completeness';
export * from './availability';
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter @unik/shared test && pnpm --filter @unik/shared typecheck`
Expected: PASS, typecheck 오류 없음.

- [ ] **Step 5: Commit**

```bash
git add shared/domain
git commit -m "feat(domain): 프로모 판정, 참가자 정보 완성도, 남은 자리 계산 추가"
```

---

### Task 4: 웹 기존 기능 정리 (명함만 유지)

**Files:**
- Delete: 아래 Step 3 목록
- Create: `frontend/web/src/app/page.tsx`
- Modify: `frontend/web/src/app/layout.tsx`, `frontend/web/src/app/admin/(dashboard)/page.tsx`, `frontend/web/src/components/admin/Sidebar.tsx`, `frontend/web/package.json`, `shared/types/index.ts`, `shared/firebase/config.ts`, `package.json`(root), `README.md`
- Delete (root): `CLOUD_RUN_AUTH_FIX.md`, `ROULETTE_SETUP.md`, `TICKET_SYSTEM_IMPLEMENTATION_PLAN.md`, `WEBOS_COMPATIBILITY.md`, `WEBOS_FIX_COMPLETE.md`, `backend/functions/firestore-debug.log`

**Interfaces:**
- Produces: `COLLECTIONS` (`contacts`, `businessCards`, `tourConfig`, `availability`, `applications`, `promoCodes`, `counters`), `TOUR_ID = 'seoul2027'` in `@unik/shared/firebase/config`. 2·3부가 사용.

- [ ] **Step 1: 명함 기준 화면 확보 (정리 전)**

공개 명함 slug 하나 확인 (business_cards 는 공개 읽기):
```bash
curl -s "https://firestore.googleapis.com/v1/projects/unik-90206/databases/(default)/documents/business_cards?pageSize=3" | grep -A1 '"slug"' | grep stringValue
```
`.claude/launch.json` 이 없으면 생성:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "web", "runtimeExecutable": "pnpm", "runtimeArgs": ["--filter", "@unik/web", "dev"], "port": 3000 }
  ]
}
```
dev 서버를 preview 도구로 띄우고 `http://localhost:3000/profile/<slug>` 스크린샷(모바일 375px)과 `/admin/login` 스크린샷을 저장해 둔다. vCard 확인:
```bash
curl -s http://localhost:3000/profile/<slug>/vcard | head -3
```
Expected: `BEGIN:VCARD` 로 시작.

- [ ] **Step 2: 미추적 잔여 파일 제거**

```bash
cd /c/Users/hanas/CBM/frontend/web
ls -d frontend itinerary parsers dev.log dev.err.log 2>/dev/null
```
출력된 항목이 git 미추적(`git status --short` 에 `??`)인지 확인 후 삭제:
```bash
rm -rf frontend itinerary parsers dev.log dev.err.log
```

- [ ] **Step 3: 기존 기능 삭제**

```bash
cd /c/Users/hanas/CBM/frontend/web
git rm -r -q "src/app/(public)" src/app/cdc-travel src/app/api \
  "src/app/admin/(dashboard)/content" "src/app/admin/(dashboard)/home" "src/app/admin/(dashboard)/navigation" \
  "src/app/admin/(dashboard)/registrations" "src/app/admin/(dashboard)/roulette" "src/app/admin/(dashboard)/settings" \
  "src/app/admin/(dashboard)/theme" "src/app/admin/(dashboard)/tickets" "src/app/admin/(dashboard)/ui-text" \
  src/components/homebuilder src/components/products src/components/tickets src/components/layout src/components/analytics \
  src/context src/lib/utils src/lib/services/admin/parsers \
  src/lib/services/admin/gallery.ts src/lib/services/admin/homeConfigs.ts src/lib/services/admin/index.ts \
  src/lib/services/admin/navigation.ts src/lib/services/admin/players.ts src/lib/services/admin/registrations.ts \
  src/lib/services/admin/roulette.ts src/lib/services/admin/settings.ts src/lib/services/admin/theme.ts \
  src/lib/services/admin/tickets.ts src/lib/services/admin/tours.ts src/lib/services/admin/uiText.ts \
  src/lib/services/gallery.ts src/lib/services/homeConfigs.ts src/lib/services/index.ts \
  src/lib/services/navigation.ts src/lib/services/players.ts src/lib/services/registrations.ts \
  src/lib/services/roulette.ts src/lib/services/theme.ts src/lib/services/tours.ts \
  public/5J.png public/JINAIR_LOGO.png public/jeju-air-logo.png public/pdf.worker.min.js public/ticket-templates
cd /c/Users/hanas/CBM
git rm -q CLOUD_RUN_AUTH_FIX.md ROULETTE_SETUP.md TICKET_SYSTEM_IMPLEMENTATION_PLAN.md WEBOS_COMPATIBILITY.md WEBOS_FIX_COMPLETE.md backend/functions/firestore-debug.log
```
남는 웹 소스: `app/{layout.tsx,globals.css}`, `app/profile/**`, `app/admin/login`, `app/admin/(dashboard)/{layout.tsx,page.tsx,business-cards}`, `components/admin/Sidebar.tsx`, `lib/{auth,firebase,utils,vcard,businessCardConfig}.ts`, `lib/data/*`, `lib/services/{businessCards,contacts}.ts`, `lib/services/admin/businessCards.ts`.

- [ ] **Step 4: 루트 레이아웃 단순화**

`frontend/web/src/app/layout.tsx` 전체 교체 (Outfit 은 명함 화면 글꼴이므로 유지):
```tsx
import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://unik.ph'),
  title: {
    default: 'UNIK | Seoul Marathon 2027 Tour with Artjoy Torregosa',
    template: '%s | UNIK',
  },
  description:
    'Run the 2027 Seoul Marathon (March 21, 2027) with Artjoy Torregosa. Flights, hotel, race entry and race-weekend support from the Philippines.',
  openGraph: {
    title: 'UNIK | Seoul Marathon 2027 Tour',
    description: 'Run Seoul with Artjoy Torregosa. March 21, 2027.',
    type: 'website',
    locale: 'en_PH',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B1F4D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: 임시 홈, 어드민 진입, 사이드바**

`frontend/web/src/app/page.tsx`:
```tsx
// 임시 홈. 2부(공개 사이트)에서 랜딩 페이지로 교체한다.
export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B1F4D] px-6 text-center text-white">
      <p className="text-sm font-bold tracking-[0.16em] text-[#F6C343]">SEOUL MARATHON 2027 · MARCH 21</p>
      <h1 className="text-4xl font-extrabold sm:text-6xl">Run Seoul with Artjoy.</h1>
      <p className="max-w-md text-white/80">Our new tour site is on its way. Applications open soon.</p>
    </main>
  );
}
```
`frontend/web/src/app/admin/(dashboard)/page.tsx` 전체 교체:
```tsx
import { redirect } from 'next/navigation';

// 3부에서 신청자 관리(/admin/applicants)로 바뀐다.
export default function AdminIndexPage() {
  redirect('/admin/business-cards');
}
```
`frontend/web/src/components/admin/Sidebar.tsx` 의 import 블록과 `menuItems` 를 교체:
```tsx
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, Home, IdCard } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth';

const menuItems = [
  { href: '/admin/business-cards', icon: IdCard, label: 'Business Cards' },
];
```
(나머지 컴포넌트 본문은 그대로.)

- [ ] **Step 6: shared 타입·설정 정리**

`shared/types/index.ts` 를 `ContactMessage` 와 `BusinessCard` 두 인터페이스만 남기고 나머지(Player~AirlineTicket, Home*, Registration*, Roulette*, Theme*, Nav*, Tab*, CompanyInfo 등) 삭제. 파일 상단 주석:
```ts
// 웹 전용 레거시 타입 (문의, 명함). 투어 도메인 타입은 shared/domain 에 있다.
```
`shared/firebase/config.ts` 의 `EMAIL_CONFIG` 블록 삭제, `COLLECTIONS` 교체:
```ts
export const TOUR_ID = 'seoul2027';

// Collection names
export const COLLECTIONS = {
  contacts: 'contacts',
  businessCards: 'business_cards',
  tourConfig: 'tourConfig',
  availability: 'availability',
  applications: 'applications',
  promoCodes: 'promoCodes',
  counters: 'counters',
} as const;
```

- [ ] **Step 7: 웹 의존성 정리**

```bash
cd /c/Users/hanas/CBM
pnpm --filter @unik/web remove @react-pdf/renderer @tanstack/react-table html2canvas jspdf pdfjs-dist react-custom-roulette
pnpm --filter @unik/web list --depth 0
```
`frontend/web/package.json` 에서 값이 `"latest"` 인 항목을 위 출력의 설치 버전으로 `^x.y.z` 고정 (예: `"next": "^16.1.6"`). 그 후 `pnpm install`.

- [ ] **Step 8: 루트 package.json·README 정리**

루트 `package.json` 의 `description` 을 `"UNIK — Seoul Marathon 2027 tour applications (CDC Travel)"`, `keywords` 를 `["seoul-marathon", "marathon", "tour", "philippines", "korea"]` 로, `scripts` 에서 `dev:admin`·`build:admin` 삭제.
`README.md` 전체 교체:
```markdown
# UNIK (unik.ph)

2027 서울마라톤 투어 신청 사이트 + CDC 직원 NFC 명함.

- `frontend/web` — Next.js 앱 (공개 사이트, `/admin`, 명함 `/profile/[slug]`)
- `shared/domain` — 웹·Functions 공용 도메인 로직 (가격, 프로모, 정원). `pnpm --filter @unik/shared test`
- `backend/functions` — Firebase Cloud Functions (npm 사용). `npm --prefix backend/functions test` (Firestore 에뮬레이터, Java 필요)
- `backend/rules-tests` — Firestore 보안 규칙 테스트. `pnpm --filter @unik/rules-tests test`

설계: `docs/superpowers/specs/2026-10-12-seoul-marathon-2027-site-design.md`
이전 사이트(KBL/벚꽃마라톤): git 태그 `archive/pre-seoul-2027`
```

- [ ] **Step 9: 타입 검사와 빌드**

Run: `pnpm --filter @unik/web exec tsc --noEmit`
Expected: 오류 0. 남은 파일이 삭제된 모듈을 import 하는 오류가 나오면 해당 import 를 제거한다 (명함 파일은 Global Constraints 대로 로직 변경 금지 — 이 경우 사용자에게 보고).
Run: `pnpm --filter @unik/web build`
Expected: 빌드 성공. 라우트 목록에 `/`, `/admin`, `/admin/login`, `/admin/business-cards`, `/profile/[slug]`, `/profile/[slug]/vcard` 만 존재.

- [ ] **Step 10: 명함 회귀 확인**

dev 서버 재시작 후 Step 1 과 같은 URL 스크린샷을 찍어 비교 (글꼴·색·배치 동일해야 함). vCard:
```bash
curl -s http://localhost:3000/profile/<slug>/vcard | head -3
```
Expected: `BEGIN:VCARD`. `/admin` 접속 시 `/admin/login` 으로 이동(비로그인).

- [ ] **Step 11: Commit**

```bash
cd /c/Users/hanas/CBM
git add -A frontend/web shared/types shared/firebase package.json pnpm-lock.yaml README.md
git commit -m "chore: KBL·벚꽃마라톤·룰렛·e-티켓 기능 제거, 명함만 유지"
```

---

### Task 5: Firestore 보안 규칙 + 규칙 테스트

**Files:**
- Modify: `firestore.rules`, `firebase.json`
- Create: `backend/rules-tests/package.json`, `backend/rules-tests/vitest.config.mts`, `backend/rules-tests/firestore.rules.test.ts`

**Interfaces:**
- Produces: 컬렉션 접근 규약 (2부 문의 폼은 `contacts` 에 `{name,email,phone?,subject,message,isRead:false,createdAt}` 만 생성 가능).

- [ ] **Step 1: 에뮬레이터 설정 추가**

`firebase.json` 최상위에 추가:
```json
  "emulators": {
    "firestore": { "port": 8080 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
```

- [ ] **Step 2: 규칙 테스트 패키지 생성**

`backend/rules-tests/package.json`:
```json
{
  "name": "@unik/rules-tests",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "firebase emulators:exec --only firestore --project demo-unik --config ../../firebase.json \"vitest run\""
  }
}
```
설치:
```bash
cd /c/Users/hanas/CBM
pnpm --filter @unik/rules-tests add -D @firebase/rules-unit-testing firebase vitest@^3.2.4
```
pnpm 이 `firebase` peer 버전 경고를 내면 경고에 표시된 major 로 `firebase` 를 재설치한다 (예: `pnpm --filter @unik/rules-tests add -D firebase@^11`).
`backend/rules-tests/vitest.config.mts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['*.test.ts'], fileParallelism: false, testTimeout: 20000 },
});
```

- [ ] **Step 3: 실패 테스트 작성**

`backend/rules-tests/firestore.rules.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-unik',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

const anon = () => env.unauthenticatedContext().firestore();
const staff = () =>
  env.authenticatedContext('staff', { email: 'staff@cebudirectclub.com', email_verified: true }).firestore();
const outsider = () =>
  env.authenticatedContext('outsider', { email: 'someone@gmail.com', email_verified: true }).firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

describe('tourConfig / availability (public read)', () => {
  it('anyone can read, only staff can write tourConfig', async () => {
    await seed('tourConfig/seoul2027', { acceptingApplications: true });
    await assertSucceeds(getDoc(doc(anon(), 'tourConfig/seoul2027')));
    await assertFails(setDoc(doc(anon(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
    await assertFails(setDoc(doc(outsider(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
    await assertSucceeds(setDoc(doc(staff(), 'tourConfig/seoul2027'), { acceptingApplications: false }));
  });
  it('anyone can read availability, non-staff cannot write it', async () => {
    await seed('availability/seoul2027', { bibsUsed: 0 });
    await assertSucceeds(getDoc(doc(anon(), 'availability/seoul2027')));
    await assertFails(setDoc(doc(anon(), 'availability/seoul2027'), { bibsUsed: 999 }));
    await assertFails(setDoc(doc(outsider(), 'availability/seoul2027'), { bibsUsed: 999 }));
  });
});

describe('applications (server-created)', () => {
  it('public cannot create, read or list applications', async () => {
    await seed('applications/a1', { appNo: 'APP-0001' });
    await assertFails(setDoc(doc(anon(), 'applications/a2'), { appNo: 'APP-9999' }));
    await assertFails(getDoc(doc(anon(), 'applications/a1')));
    await assertFails(getDoc(doc(outsider(), 'applications/a1')));
  });
  it('staff can read and update but not delete', async () => {
    await seed('applications/a1', { appNo: 'APP-0001', status: 'new' });
    await assertSucceeds(getDoc(doc(staff(), 'applications/a1')));
    await assertSucceeds(updateDoc(doc(staff(), 'applications/a1'), { status: 'contacted' }));
    await assertFails(deleteDoc(doc(staff(), 'applications/a1')));
  });
});

describe('promoCodes and counters', () => {
  it('promo codes are staff only', async () => {
    await seed('promoCodes/TA-SUNRISE', { active: true });
    await assertFails(getDoc(doc(anon(), 'promoCodes/TA-SUNRISE')));
    await assertFails(getDoc(doc(outsider(), 'promoCodes/TA-SUNRISE')));
    await assertSucceeds(getDoc(doc(staff(), 'promoCodes/TA-SUNRISE')));
    await assertSucceeds(setDoc(doc(staff(), 'promoCodes/TA-NEW'), { active: true }));
  });
  it('counters are never readable by the public', async () => {
    await seed('counters/seoul2027', { appSeq: 3 });
    await assertFails(getDoc(doc(anon(), 'counters/seoul2027')));
  });
});

describe('business_cards (must stay public read)', () => {
  it('anyone reads, only staff writes', async () => {
    await seed('business_cards/hong', { slug: 'hong', isActive: true });
    await assertSucceeds(getDoc(doc(anon(), 'business_cards/hong')));
    await assertFails(setDoc(doc(outsider(), 'business_cards/hong'), { slug: 'x' }));
    await assertSucceeds(setDoc(doc(staff(), 'business_cards/hong'), { slug: 'hong', isActive: false }));
  });
});

describe('contacts', () => {
  const valid = {
    name: 'Maria',
    email: 'maria@example.com',
    subject: 'Question',
    message: 'Hello',
    isRead: false,
  };
  it('public can create a well-formed inquiry', async () => {
    await assertSucceeds(addDoc(collection(anon(), 'contacts'), { ...valid, createdAt: serverTimestamp() }));
  });
  it('rejects unknown fields and oversized messages', async () => {
    await assertFails(addDoc(collection(anon(), 'contacts'), { ...valid, isRead: true, createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(anon(), 'contacts'), { ...valid, admin: true, createdAt: serverTimestamp() }));
    await assertFails(
      addDoc(collection(anon(), 'contacts'), { ...valid, message: 'x'.repeat(5001), createdAt: serverTimestamp() }),
    );
  });
  it('public cannot read inquiries', async () => {
    await seed('contacts/c1', valid);
    await assertFails(getDoc(doc(anon(), 'contacts/c1')));
  });
});

describe('legacy collections are locked to staff', () => {
  it('registrations and tours are no longer public', async () => {
    await seed('registrations/r1', { fullName: 'x' });
    await seed('tours/t1', { title: 'x' });
    await assertFails(setDoc(doc(anon(), 'registrations/r2'), { fullName: 'y' }));
    await assertFails(getDoc(doc(anon(), 'tours/t1')));
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `pnpm --filter @unik/rules-tests test`
Expected: FAIL — 현재 규칙에서 `registrations` 공개 생성·`tours` 공개 읽기 등이 허용되어 해당 테스트 실패.

- [ ] **Step 5: 규칙 교체**

`firestore.rules` 전체 교체:
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email.matches('.*@cebudirectclub[.]com$');
    }

    // 투어 상품 설정 - 누구나 읽기, 관리자만 수정
    match /tourConfig/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 남은 자리 - 누구나 읽기, 쓰기는 Cloud Functions(관리자 SDK)만
    match /availability/{docId} {
      allow read: if true;
    }

    // 신청서 - 생성은 Cloud Functions 만, 관리자 읽기/수정, 삭제 금지(취소 상태로 처리)
    match /applications/{docId} {
      allow read, update: if isAdmin();
      allow create, delete: if false;
    }

    // 프로모 코드 - 관리자만 (공개 검증은 checkPromoCode 함수)
    match /promoCodes/{code} {
      allow read, write: if isAdmin();
    }

    // 신청번호 카운터 - Cloud Functions 만
    match /counters/{docId} {
      allow read, write: if false;
    }

    // 모바일 명함 - 누구나 읽기(NFC 공개 페이지), 관리자만 수정
    match /business_cards/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 문의 - 정해진 필드로만 공개 생성, 관리자만 읽기/수정/삭제
    match /contacts/{docId} {
      allow create: if request.resource.data.keys().hasOnly(['name', 'email', 'phone', 'subject', 'message', 'isRead', 'createdAt'])
        && request.resource.data.name is string && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 100
        && request.resource.data.email is string && request.resource.data.email.size() <= 120
        && request.resource.data.subject is string && request.resource.data.subject.size() <= 200
        && request.resource.data.message is string && request.resource.data.message.size() > 0 && request.resource.data.message.size() <= 5000
        && request.resource.data.isRead == false
        && request.resource.data.createdAt == request.time;
      allow read, update, delete: if isAdmin();
    }

    // 레거시 컬렉션 - 관리자만 (개편 전 데이터 보존용).
    // 전체 catch-all 을 두지 않으므로 applications 삭제·availability/counters 쓰기는
    // 관리자 클라이언트에서도 불가능하고 Cloud Functions(관리자 SDK, 규칙 우회)만 가능하다.
    match /{legacy}/{docId} {
      allow read, write: if isAdmin()
        && legacy in ['registrations', 'players', 'tours', 'gallery', 'settings', 'navigation', 'theme', 'roulette', 'roulette_winners', 'airline-tickets', 'infoSections'];
    }
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: `pnpm --filter @unik/rules-tests test`
Expected: 모든 테스트 PASS.

- [ ] **Step 7: Commit**

```bash
git add firestore.rules firebase.json backend/rules-tests pnpm-lock.yaml
git commit -m "feat(rules): 서울마라톤 신청 컬렉션 보안 규칙과 에뮬레이터 테스트 추가"
```

---

### Task 6: Functions 구조 개편 — 공용 코드 복사, 메일 모듈, 문의 알림, 레거시 제거

**Files:**
- Create: `backend/functions/scripts/copy-shared.mjs`, `backend/functions/vitest.config.mts`, `backend/functions/src/lib/collections.ts`, `backend/functions/src/lib/email.ts`, `backend/functions/src/lib/strip.ts`, `backend/functions/src/lib/tourConfig.ts`, `backend/functions/src/contact.ts`, `backend/functions/src/test/setup.ts`, `backend/functions/src/test/helpers.ts`
- Test: `backend/functions/src/contact.test.ts`, `backend/functions/src/lib/strip.test.ts`
- Modify: `backend/functions/src/index.ts` (전체 교체), `backend/functions/package.json`, `backend/functions/tsconfig.json`, `backend/functions/.gitignore`

**Interfaces:**
- Consumes: `shared/domain/*` (빌드 시 `src/shared-domain/` 로 복사, import 경로 `'../shared-domain'` 또는 `'./shared-domain'`)
- Produces:
  - `COL` (`tourConfig`,`availability`,`applications`,`promoCodes`,`counters`,`contacts`), `TOUR_ID`, `FALLBACK_NOTIFY_EMAIL` — `src/lib/collections.ts`
  - `escapeHtml(value: unknown): string`, `sendEmail(opts: {to: string[]; subject: string; html: string; replyTo?: string}): Promise<'sent'|'skipped'>` — `src/lib/email.ts`
  - `stripUndefined<T>(value: T): T` — `src/lib/strip.ts`
  - `loadTourConfig(db: Firestore): Promise<TourConfig|null>`, `getNotifyEmails(db: Firestore): Promise<string[]>` — `src/lib/tourConfig.ts`
  - 테스트 헬퍼 `testDb(): Firestore`, `clearFirestore(): Promise<void>`, `baseConfig: TourConfig`, `seedTourConfig(over?: Partial<TourConfig>)`, `seedPromo(code: string, over?: Partial<PromoCode>)` — `src/test/helpers.ts`

- [ ] **Step 1: 의존성·스크립트**

```bash
cd /c/Users/hanas/CBM/backend/functions
npm install zod@^3.25.76
npm install --save-dev vitest@^3.2.4
```
`package.json` 의 `scripts` 교체:
```json
  "scripts": {
    "copy-shared": "node scripts/copy-shared.mjs",
    "build": "npm run copy-shared && tsc",
    "build:watch": "npm run copy-shared && tsc --watch",
    "test": "npm run copy-shared && firebase emulators:exec --only firestore --project demo-unik --config ../../firebase.json \"vitest run\"",
    "serve": "npm run build && firebase emulators:start --only functions,firestore --project demo-unik --config ../../firebase.json",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
```
`description` 을 `"UNIK Cloud Functions (Seoul Marathon 2027 applications, contact)"` 로.
`tsconfig.json` 에 추가: `"exclude": ["src/**/*.test.ts", "src/test/**"]`.
`.gitignore` 에 추가:
```
# shared/domain 복사본 (npm run copy-shared 가 생성)
src/shared-domain/
```
`scripts/copy-shared.mjs`:
```js
// shared/domain 의 순수 TS 모듈을 functions/src/shared-domain 으로 복사한다.
// Firebase 배포는 backend/functions 디렉터리만 올리므로 워크스페이스 패키지를 직접 참조할 수 없다.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', '..', 'shared', 'domain');
const dest = join(here, '..', 'src', 'shared-domain');

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
for (const file of files) cpSync(join(src, file), join(dest, file));
console.log(`copy-shared: ${files.length} files -> src/shared-domain`);
```
`vitest.config.mts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
```

- [ ] **Step 2: 테스트 하네스**

`src/test/setup.ts`:
```ts
import { getApps, initializeApp } from 'firebase-admin/app';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Run tests with `npm test` so the Firestore emulator is started (FIRESTORE_EMULATOR_HOST missing).');
}
if (getApps().length === 0) initializeApp({ projectId: 'demo-unik' });
```
`src/test/helpers.ts`:
```ts
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { PromoCode, TourConfig } from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';

export function testDb(): Firestore {
  return getFirestore();
}

export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const res = await fetch(`http://${host}/emulator/v1/projects/demo-unik/databases/(default)/documents`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`clearFirestore failed: ${res.status}`);
}

export const baseConfig: TourConfig = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: ['staff@cebudirectclub.com'],
  departures: [
    {
      id: 'mnl',
      label: 'Manila (MNL)',
      departDate: '2027-03-19',
      returnDate: '2027-03-23',
      flightInfo: 'TBA',
      seatCapacity: 120,
      isOpen: true,
      prices: { full: 80000, tenK: 75000, companion: 70000 },
      singleSupplement: 15000,
    },
    {
      id: 'ceb',
      label: 'Cebu (CEB)',
      departDate: '2027-03-19',
      returnDate: '2027-03-23',
      flightInfo: 'TBA',
      seatCapacity: 80,
      isOpen: true,
      prices: { full: 85000, tenK: 80000, companion: 75000 },
      singleSupplement: 15000,
    },
  ],
};

export async function seedTourConfig(over: Partial<TourConfig> = {}): Promise<void> {
  await testDb().collection(COL.tourConfig).doc(TOUR_ID).set({ ...baseConfig, ...over });
}

export async function seedPromo(code: string, over: Partial<Omit<PromoCode, 'code'>> = {}): Promise<void> {
  await testDb()
    .collection(COL.promoCodes)
    .doc(code)
    .set({
      agencyName: 'Sunrise Travel',
      discountType: 'fixed',
      discountValue: 2000,
      validUntil: null,
      maxPax: null,
      active: true,
      ...over,
    });
}
```

- [ ] **Step 3: 실패 테스트 작성**

`src/lib/strip.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { stripUndefined } from './strip';

describe('stripUndefined', () => {
  it('removes undefined keys deeply and keeps null', () => {
    expect(
      stripUndefined({ a: 1, b: undefined, c: null, d: [{ e: undefined, f: 'x' }], g: { h: undefined } }),
    ).toEqual({ a: 1, c: null, d: [{ f: 'x' }], g: {} });
  });
});
```
`src/contact.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contactEmailHtml } from './contact';

describe('contact email escapes', () => {
  it('escapes HTML in user-provided fields', () => {
    const html = contactEmailHtml(
      { name: '<b>Maria</b>', email: 'm@example.com', subject: 'Hi', message: '<script>alert(1)</script>' },
      'doc1',
    );
    expect(html).toContain('&lt;b&gt;Maria&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test`
Expected: FAIL — `./strip`, `./contact` 모듈 없음.

- [ ] **Step 5: lib 모듈·문의 알림 구현**

`src/lib/collections.ts`:
```ts
export const TOUR_ID = 'seoul2027';

export const COL = {
  tourConfig: 'tourConfig',
  availability: 'availability',
  applications: 'applications',
  promoCodes: 'promoCodes',
  counters: 'counters',
  contacts: 'contacts',
} as const;

export const FALLBACK_NOTIFY_EMAIL = 'ticket@cebudirectclub.com';
```
`src/lib/strip.ts`:
```ts
/** Firestore 는 undefined 값을 거부하므로 저장 전에 깊은 복사로 제거한다. null 은 유지. */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as unknown as T;
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
```
`src/lib/email.ts`:
```ts
import { Resend } from 'resend';

export const FROM_ADDRESS = 'UNIK Seoul Marathon Tour <noreply@unik.ph>';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<'sent' | 'skipped'> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not configured. Skipping email: ${opts.subject}`);
    return 'skipped';
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    reply_to: opts.replyTo,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return 'sent';
}
```
`src/lib/tourConfig.ts`:
```ts
import type { Firestore } from 'firebase-admin/firestore';
import type { TourConfig } from '../shared-domain';
import { COL, FALLBACK_NOTIFY_EMAIL, TOUR_ID } from './collections';

export async function loadTourConfig(db: Firestore): Promise<TourConfig | null> {
  const snap = await db.collection(COL.tourConfig).doc(TOUR_ID).get();
  return snap.exists ? (snap.data() as TourConfig) : null;
}

export async function getNotifyEmails(db: Firestore): Promise<string[]> {
  const config = await loadTourConfig(db);
  const emails = (config?.notifyEmails ?? []).map((e) => e.trim()).filter((e) => e.includes('@'));
  return emails.length > 0 ? emails : [FALLBACK_NOTIFY_EMAIL];
}
```
`src/contact.ts`:
```ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COL } from './lib/collections';
import { escapeHtml, sendEmail } from './lib/email';
import { getNotifyEmails } from './lib/tourConfig';

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export function contactEmailHtml(data: ContactData, docId: string): string {
  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:6px 12px;color:#5A6680;font-size:12px;text-transform:uppercase">${label}</td>` +
    `<td style="padding:6px 12px;font-size:15px">${escapeHtml(value)}</td></tr>`;
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1F2430">
<h2 style="color:#0B1F4D">New inquiry from the website</h2>
<table style="border-collapse:collapse">
${row('Name', data.name)}${row('Email', data.email)}${data.phone ? row('Phone', data.phone) : ''}${row('Subject', data.subject)}
</table>
<div style="margin-top:16px;padding:16px;background:#F4F6FA;border-radius:8px;white-space:pre-wrap">${escapeHtml(data.message)}</div>
<p style="color:#5A6680;font-size:12px">Inquiry ID: ${escapeHtml(docId)}. Reply to this email to answer the customer.</p>
</body></html>`;
}

export const onNewContact = onDocumentCreated(`${COL.contacts}/{docId}`, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() as ContactData;
  try {
    const result = await sendEmail({
      to: await getNotifyEmails(getFirestore()),
      subject: `[UNIK] New inquiry: ${data.subject || 'General inquiry'}`,
      html: contactEmailHtml(data, snap.id),
      replyTo: data.email,
    });
    await snap.ref.update({ emailNotificationSent: result === 'sent', emailNotificationSentAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error('onNewContact email failed', error);
    await snap.ref.update({ emailNotificationSent: false, emailNotificationError: String(error) });
  }
});
```
`src/index.ts` 전체 교체 (룰렛·onNewRegistration 제거):
```ts
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

setGlobalOptions({
  region: 'asia-northeast3', // 서울 리전
  maxInstances: 10,
});

export { onNewContact } from './contact';
```

- [ ] **Step 6: 통과·빌드 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test && npm run build`
Expected: 테스트 PASS, `tsc` 오류 없음, `lib/index.js` 생성. `lib/` 에 roulette 관련 export 가 없어야 함: `grep -c "spinRoulette" lib/index.js` → `0`.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/hanas/CBM
git add backend/functions
git commit -m "refactor(functions): 모듈 구조로 개편, 공용 도메인 복사 빌드, 룰렛·구 신청 함수 제거"
```

---

### Task 7: 신청 제출·프로모 확인 함수

**Files:**
- Create: `backend/functions/src/applications/errors.ts`, `input.ts`, `summary.ts`, `submit.ts`, `promo.ts`, `callables.ts`
- Test: `backend/functions/src/applications/input.test.ts`, `submit.test.ts`, `promo.test.ts`
- Modify: `backend/functions/src/index.ts`

**Interfaces:**
- Consumes: Task 2·3 도메인 함수, Task 6 `COL`, `TOUR_ID`, `loadTourConfig`, `stripUndefined`, 테스트 헬퍼
- Produces (2부 신청 폼이 호출):
  - callable `submitApplication(data: SubmitInput)` → `{ appNo: string; status: 'new' | 'waitlist'; pricing: Pricing; duplicate: boolean }`. 오류 시 `HttpsError` 의 `details.code` ∈ `'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid'`, `promo_invalid` 이면 `details.reason: PromoInvalidReason`, `invalid_input` 이면 `details.issues?: {path, message}[]`
  - `SubmitInput` 필드: `idempotencyKey`(UUID), `departureId`, `counts`, `lead{firstName,lastName,email,phoneDial,phoneNumber,viber,whatsapp}`, `travelers[]`, `promoCode?`, `specialRequests?`, `agreedToTerms: true`, `website?`(honeypot, 반드시 빈 값)
  - callable `checkPromoCode({ code: string; pax?: number })` → `{ valid: false; reason } | { valid: true; code; agencyName; discountType; discountValue; description }`
  - 신청서 문서 필드 (3부 어드민이 읽음): `appNo, status, departure{id,label,departDate,returnDate}, lead, counts, travelers, completeness, pricing, payments[], paidTotal, specialRequests|null, staffNotes|null, statusHistory[{status, at: Timestamp, by}], idempotencyKey, agreedToTermsAt, createdAt, updatedAt`. 문서 ID = idempotencyKey.

- [ ] **Step 1: 실패 테스트 작성**

먼저 `src/test/helpers.ts` 끝에 유효한 신청 입력 빌더를 추가한다 (여러 테스트 파일이 공유. 테스트 파일끼리 import 하면 테스트가 중복 실행되므로 헬퍼에 둔다):
```ts
import { randomUUID } from 'node:crypto';

export function validInput(over: Record<string, unknown> = {}) {
  return {
    idempotencyKey: randomUUID(),
    departureId: 'mnl',
    counts: { full: 2, tenK: 0, companion: 1 },
    lead: {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'Maria@Example.com ',
      phoneDial: '+63',
      phoneNumber: '917 123 4567',
      viber: true,
      whatsapp: false,
    },
    travelers: [],
    agreedToTerms: true,
    ...over,
  };
}
```
(`import { randomUUID }` 줄은 파일 상단 import 영역으로 옮긴다.)

`src/applications/input.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseSubmitInput } from './input';
import { SubmitError } from './errors';
import { validInput } from '../test/helpers';

describe('parseSubmitInput', () => {
  it('normalizes email, promo code and blank optional fields', () => {
    const r = parseSubmitInput(
      validInput({
        promoCode: ' ta-sunrise ',
        travelers: [{ category: 'full', passportName: '  ', dob: '', room: 'single' }],
      }),
    );
    expect(r.lead.email).toBe('maria@example.com');
    expect(r.promoCode).toBe('TA-SUNRISE');
    expect(r.travelers[0]).toEqual({ category: 'full', passportName: undefined, dob: undefined, room: 'single' });
  });
  it('treats an empty promo code as none', () => {
    expect(parseSubmitInput(validInput({ promoCode: '' })).promoCode).toBeUndefined();
  });
  it('rejects a filled honeypot', () => {
    expect(() => parseSubmitInput(validInput({ website: 'http://spam' }))).toThrow(SubmitError);
  });
  it('rejects zero travelers and missing terms agreement', () => {
    expect(() => parseSubmitInput(validInput({ counts: { full: 0, tenK: 0, companion: 0 } }))).toThrow(
      'At least one traveler is required',
    );
    expect(() => parseSubmitInput(validInput({ agreedToTerms: false }))).toThrow(SubmitError);
  });
  it('rejects a malformed promo code', () => {
    expect(() => parseSubmitInput(validInput({ promoCode: 'TA_SUNRISE' }))).toThrow(SubmitError);
  });
});
```
`src/applications/submit.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { submitApplicationCore } from './submit';
import { SubmitError } from './errors';
import { clearFirestore, seedPromo, seedTourConfig, testDb, validInput } from '../test/helpers';
import { COL, TOUR_ID } from '../lib/collections';

const now = new Date('2026-10-20T03:00:00Z');

async function expectSubmitError(p: Promise<unknown>, code: string, reason?: string) {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(SubmitError);
  expect(err.code).toBe(code);
  if (reason) expect(err.details?.reason).toBe(reason);
}

describe('submitApplicationCore', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('creates an application with server-side pricing and sequential numbers', async () => {
    const first = await submitApplicationCore(testDb(), { ...validInput(), pricing: { total: 1 } }, now);
    expect(first).toMatchObject({ appNo: 'APP-0001', status: 'new', duplicate: false });
    expect(first.pricing.total).toBe(230000);

    const second = await submitApplicationCore(testDb(), validInput(), now);
    expect(second.appNo).toBe('APP-0002');

    const docs = await testDb().collection(COL.applications).get();
    expect(docs.size).toBe(2);
    const data = docs.docs.find((d) => d.data().appNo === 'APP-0001')!.data();
    expect(data.pricing.total).toBe(230000);
    expect(data.travelers).toHaveLength(3);
    expect(data.completeness).toEqual({ filled: 0, total: 22 });
    expect(data.departure).toEqual({ id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' });
    expect(data.statusHistory[0]).toMatchObject({ status: 'new', by: 'system' });
    expect(data.payments).toEqual([]);
    expect(data.paidTotal).toBe(0);
  });

  it('returns the existing application for a repeated idempotencyKey', async () => {
    const input = validInput();
    const a = await submitApplicationCore(testDb(), input, now);
    const b = await submitApplicationCore(testDb(), input, now);
    expect(b).toMatchObject({ appNo: a.appNo, duplicate: true });
    expect((await testDb().collection(COL.applications).get()).size).toBe(1);
  });

  it('applies a valid promo code', async () => {
    await seedPromo('TA-SUNRISE');
    const r = await submitApplicationCore(testDb(), validInput({ promoCode: 'ta-sunrise' }), now);
    expect(r.pricing.promo).toMatchObject({ code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', discountTotal: 6000 });
    expect(r.pricing.total).toBe(224000);
  });

  it('rejects unknown, inactive and over-limit promo codes', async () => {
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ promoCode: 'NOPE' }), now), 'promo_invalid', 'not_found');
    await seedPromo('TA-OFF', { active: false });
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ promoCode: 'TA-OFF' }), now), 'promo_invalid', 'inactive');
    await seedPromo('TA-SMALL', { maxPax: 4 });
    await submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now); // 3 pax used
    await expectSubmitError(
      submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now),
      'promo_invalid',
      'limit_reached',
    );
  });

  it('rejects when applications are closed or the departure is closed', async () => {
    await seedTourConfig({ acceptingApplications: false });
    await expectSubmitError(submitApplicationCore(testDb(), validInput(), now), 'closed');
    await seedTourConfig();
    await expectSubmitError(submitApplicationCore(testDb(), validInput({ departureId: 'xyz' }), now), 'departure_closed');
  });

  it('puts the application on the waitlist when bibs run out', async () => {
    await seedTourConfig({ bibQuota: { total: 3 } });
    expect((await submitApplicationCore(testDb(), validInput(), now)).status).toBe('new'); // 2 bibs
    expect((await submitApplicationCore(testDb(), validInput(), now)).status).toBe('waitlist'); // needs 2, 1 left
    const companionsOnly = validInput({ counts: { full: 0, tenK: 0, companion: 2 } });
    expect((await submitApplicationCore(testDb(), companionsOnly, now)).status).toBe('new');
  });

  it('two concurrent submissions for the last bib: exactly one gets it', async () => {
    await seedTourConfig({ bibQuota: { total: 1 } });
    const solo = () => validInput({ counts: { full: 1, tenK: 0, companion: 0 } });
    const results = await Promise.all([
      submitApplicationCore(testDb(), solo(), now),
      submitApplicationCore(testDb(), solo(), now),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(['new', 'waitlist']);
    expect(results.map((r) => r.appNo).sort()).toEqual(['APP-0001', 'APP-0002']);
  });

  it('stores the counter so numbering survives restarts', async () => {
    await submitApplicationCore(testDb(), validInput(), now);
    const counter = await testDb().collection(COL.counters).doc(TOUR_ID).get();
    expect(counter.data()).toEqual({ appSeq: 1 });
  });
});
```
`src/applications/promo.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { checkPromoCodeCore } from './promo';
import { submitApplicationCore } from './submit';
import { clearFirestore, seedPromo, seedTourConfig, testDb, validInput } from '../test/helpers';

const now = new Date('2026-10-20T03:00:00Z');

describe('checkPromoCodeCore', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('returns not_found for unknown or malformed codes', async () => {
    expect(await checkPromoCodeCore(testDb(), { code: 'NOPE' }, now)).toEqual({ valid: false, reason: 'not_found' });
    expect(await checkPromoCodeCore(testDb(), { code: 'a_b' }, now)).toEqual({ valid: false, reason: 'not_found' });
  });

  it('returns agency and discount for a valid code, case-insensitive', async () => {
    await seedPromo('TA-SUNRISE');
    expect(await checkPromoCodeCore(testDb(), { code: ' ta-sunrise ', pax: 3 }, now)).toEqual({
      valid: true,
      code: 'TA-SUNRISE',
      agencyName: 'Sunrise Travel',
      discountType: 'fixed',
      discountValue: 2000,
      description: 'PHP 2,000 off per person',
    });
  });

  it('accounts for existing usage when checking maxPax', async () => {
    await seedPromo('TA-SMALL', { maxPax: 4 });
    await submitApplicationCore(testDb(), validInput({ promoCode: 'TA-SMALL' }), now); // 3 pax
    expect(await checkPromoCodeCore(testDb(), { code: 'TA-SMALL', pax: 1 }, now)).toMatchObject({ valid: true });
    expect(await checkPromoCodeCore(testDb(), { code: 'TA-SMALL', pax: 2 }, now)).toEqual({
      valid: false,
      reason: 'limit_reached',
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test`
Expected: FAIL — `./input`, `./errors`, `./submit`, `./promo` 없음.

- [ ] **Step 3: errors·input·summary 구현**

`src/applications/errors.ts`:
```ts
export type SubmitErrorCode = 'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid';

export class SubmitError extends Error {
  constructor(
    public readonly code: SubmitErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SubmitError';
  }
}
```
`src/applications/input.ts`:
```ts
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
```
`src/applications/summary.ts`:
```ts
import type { DocumentData } from 'firebase-admin/firestore';
import type { ApplicationSummary } from '../shared-domain';

export function toSummary(data: DocumentData): ApplicationSummary {
  return {
    status: data.status,
    departureId: data.departure?.id ?? '',
    counts: data.counts ?? { full: 0, tenK: 0, companion: 0 },
    promoCode: data.pricing?.promo?.code ?? null,
  };
}
```

- [ ] **Step 4: submit·promo·callables 구현**

`src/applications/submit.ts`:
```ts
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  buildTravelers,
  computeAvailability,
  computeCompleteness,
  computePricing,
  evaluatePromo,
  exceedsCapacity,
  formatAppNo,
  promoUsagePax,
  totalPax,
  type Pricing,
  type PromoCode,
} from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';
import { loadTourConfig } from '../lib/tourConfig';
import { stripUndefined } from '../lib/strip';
import { SubmitError } from './errors';
import { parseSubmitInput } from './input';
import { toSummary } from './summary';

export interface SubmitResult {
  appNo: string;
  status: 'new' | 'waitlist';
  pricing: Pricing;
  duplicate: boolean;
}

export async function submitApplicationCore(db: Firestore, raw: unknown, now = new Date()): Promise<SubmitResult> {
  const input = parseSubmitInput(raw);
  const config = await loadTourConfig(db);
  if (!config || !config.acceptingApplications) throw new SubmitError('closed', 'Applications are currently closed.');
  const departure = config.departures.find((d) => d.id === input.departureId);
  if (!departure || !departure.isOpen) {
    throw new SubmitError('departure_closed', 'This departure is not available.');
  }

  const travelers = buildTravelers(input.counts, input.travelers);
  const pax = totalPax(input.counts);
  const appRef = db.collection(COL.applications).doc(input.idempotencyKey);
  const counterRef = db.collection(COL.counters).doc(TOUR_ID);
  const promoCode = input.promoCode ?? null;

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(appRef);
    if (existing.exists) {
      const d = existing.data()!;
      return { appNo: d.appNo, status: d.status, pricing: d.pricing, duplicate: true };
    }

    const appsSnap = await tx.get(db.collection(COL.applications));
    const summaries = appsSnap.docs.map((d) => toSummary(d.data()));

    let promo: PromoCode | null = null;
    if (promoCode) {
      const promoSnap = await tx.get(db.collection(COL.promoCodes).doc(promoCode));
      const found = promoSnap.exists ? ({ ...promoSnap.data(), code: promoCode } as PromoCode) : null;
      const evaluation = evaluatePromo(found, { now, usedPax: promoUsagePax(summaries, promoCode), requestedPax: pax });
      if (!evaluation.valid) {
        throw new SubmitError('promo_invalid', 'This promo code is not valid.', { reason: evaluation.reason });
      }
      promo = found;
    }

    const counterSnap = await tx.get(counterRef);
    const seq = (counterSnap.exists ? Number(counterSnap.data()!.appSeq) : 0) + 1;
    const status: 'new' | 'waitlist' = exceedsCapacity(
      computeAvailability(config, summaries),
      departure.id,
      input.counts,
    )
      ? 'waitlist'
      : 'new';
    const pricing = computePricing({
      departure,
      counts: input.counts,
      travelers,
      promo,
      depositPerPax: config.depositPerPax,
    });
    const appNo = formatAppNo(seq);
    const at = Timestamp.fromDate(now);

    tx.set(counterRef, { appSeq: seq });
    tx.set(
      appRef,
      stripUndefined({
        appNo,
        status,
        departure: {
          id: departure.id,
          label: departure.label,
          departDate: departure.departDate,
          returnDate: departure.returnDate,
        },
        lead: input.lead,
        counts: input.counts,
        travelers,
        completeness: computeCompleteness(travelers),
        pricing,
        payments: [],
        paidTotal: 0,
        specialRequests: input.specialRequests ?? null,
        staffNotes: null,
        statusHistory: [{ status, at, by: 'system' }],
        idempotencyKey: input.idempotencyKey,
        agreedToTermsAt: at,
        // FieldValue·Timestamp 는 일반 객체가 아니므로 stripUndefined 가 그대로 둔다.
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    return { appNo, status, pricing, duplicate: false };
  });
}
```
`src/applications/promo.ts`:
```ts
import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  describeDiscount,
  evaluatePromo,
  isValidPromoCodeFormat,
  normalizePromoCode,
  promoUsagePax,
  type DiscountType,
  type PromoCode,
  type PromoInvalidReason,
} from '../shared-domain';
import { COL } from '../lib/collections';
import { toSummary } from './summary';

const checkInput = z.object({
  code: z.string().max(40),
  pax: z.number().int().min(1).max(10).default(1),
});

export type PromoCheckResult =
  | { valid: false; reason: PromoInvalidReason }
  | {
      valid: true;
      code: string;
      agencyName: string;
      discountType: DiscountType;
      discountValue: number;
      description: string;
    };

export async function checkPromoCodeCore(db: Firestore, raw: unknown, now = new Date()): Promise<PromoCheckResult> {
  const parsed = checkInput.safeParse(raw);
  if (!parsed.success) return { valid: false, reason: 'not_found' };
  const code = normalizePromoCode(parsed.data.code);
  if (!isValidPromoCodeFormat(code)) return { valid: false, reason: 'not_found' };

  const snap = await db.collection(COL.promoCodes).doc(code).get();
  const promo = snap.exists ? ({ ...snap.data(), code } as PromoCode) : null;
  const used = promo
    ? promoUsagePax(
        (await db.collection(COL.applications).where('pricing.promo.code', '==', code).get()).docs.map((d) =>
          toSummary(d.data()),
        ),
        code,
      )
    : 0;
  const evaluation = evaluatePromo(promo, { now, usedPax: used, requestedPax: parsed.data.pax });
  if (!evaluation.valid || !promo) return { valid: false, reason: evaluation.valid ? 'not_found' : evaluation.reason };
  return {
    valid: true,
    code,
    agencyName: promo.agencyName,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    description: describeDiscount(promo.discountType, promo.discountValue),
  };
}
```
`src/applications/callables.ts`:
```ts
import { HttpsError, onCall, type CallableOptions } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { SubmitError } from './errors';
import { submitApplicationCore } from './submit';
import { checkPromoCodeCore } from './promo';

// App Check 강제(enforceAppCheck)는 2부에서 웹에 App Check 를 붙인 뒤 켠다.
const options: CallableOptions = {
  invoker: 'public',
  cors: ['https://unik.ph', 'https://www.unik.ph', /^http:\/\/localhost:\d+$/, /\.vercel\.app$/],
};

export const submitApplication = onCall(options, async (request) => {
  try {
    return await submitApplicationCore(getFirestore(), request.data);
  } catch (error) {
    if (error instanceof SubmitError) {
      throw new HttpsError(
        error.code === 'invalid_input' ? 'invalid-argument' : 'failed-precondition',
        error.message,
        { code: error.code, ...error.details },
      );
    }
    console.error('submitApplication failed', error);
    throw new HttpsError('internal', 'Something went wrong. Please try again.');
  }
});

export const checkPromoCode = onCall(options, async (request) => checkPromoCodeCore(getFirestore(), request.data));
```
`src/index.ts` 끝에 추가:
```ts
export { submitApplication, checkPromoCode } from './applications/callables';
```

- [ ] **Step 5: 통과·빌드 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test && npm run build`
Expected: 모든 테스트 PASS (동시 제출 테스트 포함), 빌드 오류 없음.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/hanas/CBM
git add backend/functions
git commit -m "feat(functions): 신청 제출(submitApplication)·프로모 확인(checkPromoCode) callable 추가"
```

---

### Task 8: 남은 자리 재계산·신청 메일 트리거

**Files:**
- Create: `backend/functions/src/applications/availability.ts`, `emails.ts`, `triggers.ts`
- Test: `backend/functions/src/applications/availability.test.ts`, `emails.test.ts`
- Modify: `backend/functions/src/index.ts`

**Interfaces:**
- Consumes: `computeAvailability`, `describeCounts`, `formatPHP`, `totalPax`, `COL`, `TOUR_ID`, `loadTourConfig`, `getNotifyEmails`, `sendEmail`, `escapeHtml`, `toSummary`
- Produces:
  - `availability/seoul2027` 문서: `{ bibsUsed, bibsTotal, departures: {[id]: {seatsUsed, seatCapacity}}, updatedAt }` (2부 신청 폼이 공개 읽기)
  - `recomputeAvailability(db: Firestore): Promise<Availability | null>`
  - `customerEmail(app: ApplicationEmailData): {subject, html}`, `staffEmail(app: ApplicationEmailData, docId: string): {subject, html}`
  - 신청서에 `notifications: { customerEmail?: 'sent'|'skipped', customerEmailError?: string, staffEmail?: 'sent'|'skipped', staffEmailError?: string, at }` 기록

- [ ] **Step 1: 실패 테스트 작성**

`src/applications/availability.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { recomputeAvailability } from './availability';
import { submitApplicationCore } from './submit';
import { clearFirestore, seedTourConfig, testDb, validInput } from '../test/helpers';
import { COL, TOUR_ID } from '../lib/collections';

const now = new Date('2026-10-20T03:00:00Z');

describe('recomputeAvailability', () => {
  beforeEach(async () => {
    await clearFirestore();
    await seedTourConfig();
  });

  it('writes bib and seat usage, excluding cancelled applications', async () => {
    await submitApplicationCore(testDb(), validInput(), now); // mnl: 2 full + 1 companion
    await submitApplicationCore(testDb(), validInput({ departureId: 'ceb', counts: { full: 0, tenK: 1, companion: 0 } }), now);
    const cancelled = validInput();
    await submitApplicationCore(testDb(), cancelled, now);
    await testDb().collection(COL.applications).doc(cancelled.idempotencyKey).update({ status: 'cancelled' });

    await recomputeAvailability(testDb());
    const av = (await testDb().collection(COL.availability).doc(TOUR_ID).get()).data()!;
    expect(av).toMatchObject({
      bibsUsed: 3,
      bibsTotal: 200,
      departures: { mnl: { seatsUsed: 3, seatCapacity: 120 }, ceb: { seatsUsed: 1, seatCapacity: 80 } },
    });
    expect(av.updatedAt).toBeDefined();
  });

  it('does nothing when there is no tour config', async () => {
    await clearFirestore();
    expect(await recomputeAvailability(testDb())).toBeNull();
    expect((await testDb().collection(COL.availability).doc(TOUR_ID).get()).exists).toBe(false);
  });
});
```
`src/applications/emails.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { customerEmail, staffEmail, type ApplicationEmailData } from './emails';

const app: ApplicationEmailData = {
  appNo: 'APP-0021',
  status: 'new',
  lead: {
    firstName: 'Maria',
    lastName: '<img src=x onerror=alert(1)>',
    email: 'maria@example.com',
    phoneDial: '+63',
    phoneNumber: '917 123 4567',
    viber: true,
    whatsapp: false,
  },
  departure: { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' },
  counts: { full: 2, tenK: 0, companion: 1 },
  pricing: {
    lines: [],
    singleSupplements: 0,
    subtotal: 230000,
    promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 },
    total: 224000,
    depositDue: 30000,
  },
  specialRequests: '<script>x</script>',
};

describe('application emails', () => {
  it('customer email confirms number, travelers and estimated total', () => {
    const { subject, html } = customerEmail(app);
    expect(subject).toBe('We received your application APP-0021 | Seoul Marathon 2027 Tour');
    expect(html).toContain('2 Full Marathon, 1 Companion');
    expect(html).toContain('PHP 224,000');
    expect(html).toContain('No payment is needed yet');
  });
  it('customer email explains the waitlist', () => {
    const { subject, html } = customerEmail({ ...app, status: 'waitlist' });
    expect(subject).toBe("You're on the waitlist (APP-0021) | Seoul Marathon 2027 Tour");
    expect(html).toContain('waitlist');
  });
  it('staff email links to the admin detail and summarises the booking', () => {
    const { subject, html } = staffEmail(app, 'doc-123');
    expect(subject).toBe('[UNIK] APP-0021 Maria <img src=x onerror=alert(1)> | 3 pax | TA-SUNRISE');
    expect(html).toContain('https://unik.ph/admin/applicants?id=doc-123');
  });
  it('escapes user-provided text', () => {
    for (const { html } of [customerEmail(app), staffEmail(app, 'doc-123')]) {
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
    }
    expect(staffEmail(app, 'd').html).toContain('&lt;script&gt;x&lt;/script&gt;');
  });
});
```
(메일 제목은 HTML 이 아니므로 이스케이프하지 않는다. 메일 클라이언트는 제목을 텍스트로 표시한다.)

- [ ] **Step 2: 실패 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test`
Expected: FAIL — `./availability`, `./emails` 없음.

- [ ] **Step 3: 구현**

`src/applications/availability.ts`:
```ts
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { computeAvailability, type Availability } from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';
import { loadTourConfig } from '../lib/tourConfig';
import { toSummary } from './summary';

export async function recomputeAvailability(db: Firestore): Promise<Availability | null> {
  const config = await loadTourConfig(db);
  if (!config) return null;
  const apps = await db.collection(COL.applications).get();
  const availability = computeAvailability(
    config,
    apps.docs.map((d) => toSummary(d.data())),
  );
  await db
    .collection(COL.availability)
    .doc(TOUR_ID)
    .set({ ...availability, updatedAt: FieldValue.serverTimestamp() });
  return availability;
}
```
`src/applications/emails.ts`:
```ts
import { describeCounts, formatPHP, totalPax, type Counts, type Pricing } from '../shared-domain';
import { escapeHtml } from '../lib/email';

export interface ApplicationEmailData {
  appNo: string;
  status: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phoneDial: string;
    phoneNumber: string;
    viber: boolean;
    whatsapp: boolean;
  };
  departure: { id: string; label: string; departDate: string; returnDate: string };
  counts: Counts;
  pricing: Pricing;
  specialRequests?: string | null;
}

const TOUR_NAME = 'Seoul Marathon 2027 Tour';

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F4F6FA;font-family:Arial,sans-serif;color:#1F2430">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#0B1F4D;color:#FFFFFF;padding:24px;border-radius:12px 12px 0 0">
<div style="font-size:12px;letter-spacing:2px;color:#F6C343">UNIK · SEOUL MARATHON 2027</div>
<h1 style="margin:8px 0 0;font-size:22px">${title}</h1>
</div>
<div style="background:#FFFFFF;padding:24px;border-radius:0 0 12px 12px;line-height:1.6">${body}</div>
<p style="font-size:12px;color:#5A6680;text-align:center">CDC Travel (Cebu Direct Club) · unik.ph</p>
</div></body></html>`;
}

function summaryTable(app: ApplicationEmailData): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#5A6680;width:160px">${label}</td><td style="padding:6px 0;font-weight:bold">${value}</td></tr>`;
  const promo = app.pricing.promo
    ? row('Promo', `${escapeHtml(app.pricing.promo.code)} (−${formatPHP(app.pricing.promo.discountTotal)})`)
    : '';
  return `<table style="width:100%;border-collapse:collapse">
${row('Application no.', escapeHtml(app.appNo))}
${row('Departure', `${escapeHtml(app.departure.label)}, ${escapeHtml(app.departure.departDate)} to ${escapeHtml(app.departure.returnDate)}`)}
${row('Travelers', escapeHtml(describeCounts(app.counts)))}
${promo}
${row('Estimated total', formatPHP(app.pricing.total))}
</table>`;
}

export function customerEmail(app: ApplicationEmailData): { subject: string; html: string } {
  const name = escapeHtml(app.lead.firstName);
  if (app.status === 'waitlist') {
    return {
      subject: `You're on the waitlist (${app.appNo}) | ${TOUR_NAME}`,
      html: layout(
        'You are on the waitlist',
        `<p>Hi ${name},</p>
<p>Thank you for applying. This departure is currently full, so we have added you to the waitlist. We will contact you as soon as a slot opens.</p>
${summaryTable(app)}
<p>No payment is needed. Reply to this email if you have any questions.</p>`,
      ),
    };
  }
  return {
    subject: `We received your application ${app.appNo} | ${TOUR_NAME}`,
    html: layout(
      'We received your application',
      `<p>Hi ${name},</p>
<p>Thank you for applying for the ${TOUR_NAME} with Artjoy Torregosa. Here is a summary:</p>
${summaryTable(app)}
<p><strong>No payment is needed yet.</strong> Our team will contact you within 1 to 2 business days to confirm your slot, collect any missing traveler details, and send payment instructions for the deposit (${formatPHP(app.pricing.depositDue)}).</p>
<p>Reply to this email if you have any questions.</p>`,
    ),
  };
}

export function staffEmail(app: ApplicationEmailData, docId: string): { subject: string; html: string } {
  const pax = totalPax(app.counts);
  const waitlist = app.status === 'waitlist' ? ' (WAITLIST)' : '';
  const promo = app.pricing.promo ? ` | ${app.pricing.promo.code}` : '';
  const contact = [
    `${escapeHtml(app.lead.firstName)} ${escapeHtml(app.lead.lastName)}`,
    escapeHtml(app.lead.email),
    `${escapeHtml(app.lead.phoneDial)} ${escapeHtml(app.lead.phoneNumber)}${app.lead.viber ? ' · Viber' : ''}${app.lead.whatsapp ? ' · WhatsApp' : ''}`,
  ].join('<br>');
  return {
    subject: `[UNIK] ${app.appNo}${waitlist} ${app.lead.firstName} ${app.lead.lastName} | ${pax} pax${promo}`,
    html: layout(
      `New application ${escapeHtml(app.appNo)}${waitlist}`,
      `<p>${contact}</p>
${summaryTable(app)}
${app.specialRequests ? `<p style="background:#F4F6FA;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(app.specialRequests)}</p>` : ''}
<p><a href="https://unik.ph/admin/applicants?id=${encodeURIComponent(docId)}" style="display:inline-block;background:#0B1F4D;color:#FFFFFF;padding:12px 20px;border-radius:8px;text-decoration:none">Open in admin</a></p>`,
    ),
  };
}
```
`src/applications/triggers.ts`:
```ts
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COL } from '../lib/collections';
import { sendEmail } from '../lib/email';
import { getNotifyEmails } from '../lib/tourConfig';
import { recomputeAvailability } from './availability';
import { customerEmail, staffEmail, type ApplicationEmailData } from './emails';

export const onApplicationWritten = onDocumentWritten(`${COL.applications}/{docId}`, async () => {
  await recomputeAvailability(getFirestore());
});

export const onTourConfigWritten = onDocumentWritten(`${COL.tourConfig}/{docId}`, async () => {
  await recomputeAvailability(getFirestore());
});

export const onApplicationCreated = onDocumentCreated(`${COL.applications}/{docId}`, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const app = snap.data() as ApplicationEmailData;
  const notifyEmails = await getNotifyEmails(getFirestore());
  const notifications: Record<string, unknown> = {};

  try {
    const mail = customerEmail(app);
    notifications.customerEmail = await sendEmail({
      to: [app.lead.email],
      subject: mail.subject,
      html: mail.html,
      replyTo: notifyEmails[0],
    });
  } catch (error) {
    console.error('customer email failed', error);
    notifications.customerEmailError = String(error);
  }

  try {
    const mail = staffEmail(app, snap.id);
    notifications.staffEmail = await sendEmail({
      to: notifyEmails,
      subject: mail.subject,
      html: mail.html,
      replyTo: app.lead.email,
    });
  } catch (error) {
    console.error('staff email failed', error);
    notifications.staffEmailError = String(error);
  }

  await snap.ref.update({ notifications: { ...notifications, at: FieldValue.serverTimestamp() } });
});
```
`src/index.ts` 끝에 추가:
```ts
export { onApplicationCreated, onApplicationWritten, onTourConfigWritten } from './applications/triggers';
```

- [ ] **Step 4: 통과·빌드 확인**

Run: `cd /c/Users/hanas/CBM/backend/functions && npm test && npm run build`
Expected: 전체 PASS, 빌드 오류 없음.

- [ ] **Step 5: 에뮬레이터 통합 점검 (수동)**

```bash
cd /c/Users/hanas/CBM/backend/functions
npm run serve
```
다른 터미널에서 Firestore 에뮬레이터 REST 로 설정 문서를 넣지 않고도 함수가 로드되는지 로그 확인: `functions[asia-northeast3-submitApplication]`, `checkPromoCode`, `onApplicationCreated`, `onApplicationWritten`, `onTourConfigWritten`, `onNewContact` 6개가 "initialized" 로 표시되어야 한다. 확인 후 Ctrl+C.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/hanas/CBM
git add backend/functions
git commit -m "feat(functions): 남은 자리 재계산과 신청 확인·직원 알림 메일 트리거 추가"
```

---

### Task 9: CI 와 루트 테스트 스크립트

**Files:**
- Create: `.github/workflows/ci.yml`
- Delete: `.github/workflows/deploy.yml`
- Modify: `package.json` (root)

**Interfaces:**
- Consumes: 각 패키지의 `test` 스크립트

- [ ] **Step 1: 루트 스크립트**

루트 `package.json` 의 `scripts` 에 추가:
```json
    "test": "pnpm --filter @unik/shared test && pnpm --filter @unik/rules-tests test && npm --prefix backend/functions test",
    "typecheck": "pnpm --filter @unik/web exec tsc --noEmit && pnpm --filter @unik/shared typecheck"
```

- [ ] **Step 2: 로컬 전체 실행**

Run: `cd /c/Users/hanas/CBM && pnpm typecheck && pnpm test`
Expected: 모두 PASS.

- [ ] **Step 3: CI 워크플로 교체**

```bash
git rm -q .github/workflows/deploy.yml
```
`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  web-and-domain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Type check
        run: pnpm typecheck
      - name: Domain unit tests
        run: pnpm --filter @unik/shared test

  emulator-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - run: npm install -g firebase-tools@14
      - run: pnpm install --frozen-lockfile
      - run: npm ci
        working-directory: backend/functions
      - name: Firestore rules tests
        run: pnpm --filter @unik/rules-tests test
      - name: Functions tests
        run: npm test
        working-directory: backend/functions
```
(Vercel 은 GitHub 연동 자동 배포이므로 CI 에 배포 단계는 두지 않는다.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows package.json
git commit -m "ci: 도메인·보안 규칙·Functions 테스트를 CI 에 추가"
```

- [ ] **Step 5: 1부 완료 보고**

사용자에게 보고: 완료된 Task, 테스트 결과 요약, 브랜치 상태(배포 안 함), 2부(공개 사이트·신청 폼) 계획 작성으로 넘어갈지 확인.
