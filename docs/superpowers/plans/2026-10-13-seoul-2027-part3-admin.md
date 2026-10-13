# Seoul 2027 — Part 3: 어드민 (신청자 관리 · 프로모 코드 · 상품 설정) + 오픈 런북 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CDC 직원이 어드민 한 곳에서 신청자를 관리(상태·연락·정보 보완·결제 기록·명단 추출)하고, TA 프로모 코드를 만들고 실적을 보고, 투어 상품(출발편·가격·정원·접수 여부)을 설정할 수 있게 하며, 오픈 당일 배포 순서를 런북으로 정리한다.

**Architecture:** 어드민은 기존 `src/app/admin/(dashboard)/` 아래 클라이언트 페이지다(구글 로그인 + `@cebudirectclub.com` 도메인, Firestore 규칙 `isAdmin()`). 계산·검증·CSV 는 순수 모듈(`src/lib/admin/*`, `shared/domain/contact.ts`)로 분리해 vitest 로 테스트하고, Firestore 읽기·쓰기는 얇은 서비스(`src/lib/services/admin/*`)가 맡는다. 결제 추가·상태 변경처럼 동시 편집에서 잃으면 안 되는 쓰기는 트랜잭션으로 한다. 남은 자리 문서는 기존 트리거가 자동 재계산한다.

**Tech Stack:** Next.js 16 App Router(클라이언트 컴포넌트), Firebase JS SDK 12 (firestore, auth), Tailwind v4 + 기존 `admin-*` 유틸, lucide-react, vitest 3, Firebase Emulator(auth·firestore·functions, `demo-unik`).

**Spec:** `docs/superpowers/specs/2026-10-12-seoul-marathon-2027-site-design.md` (§9.2 어드민, §12 배포)
**이월/계약:** `docs/superpowers/notes/2026-10-12-part1-carryover.md` ("3부에서 지킬 것", "2부 → 3부 계약", "운영 배포 런북")
**시안:** `docs/design/mockups/AdminApplicants.dc.html`, `AdminPromo.dc.html`

## Global Constraints

- 브랜치 `feat/seoul-2027` 에서만 작업. push·merge·운영 배포 금지. 에뮬레이터는 `--project demo-unik` 만. `unik-90206` 대상 명령 금지. 직접 띄운 프로세스만 PID 로 종료(전체 node 종료 금지).
- **명함 보호:** `src/app/profile/**`, `src/app/admin/(dashboard)/business-cards/page.tsx`, `src/lib/{auth,firebase,vcard,businessCardConfig}.ts`, `src/lib/services/businessCards.ts`, `src/lib/services/admin/businessCards.ts`, `src/app/layout.tsx` 수정 금지. `globals.css` 는 끝에 추가만.
- 어드민 UI 언어: **영어**(필리핀 직원 사용). 통화 `PHP 1,234` (`formatPHP`). 날짜·시간 표시는 마닐라(UTC+8).
- 상태: `new | contacted | deposit_paid | fully_paid | confirmed | cancelled | waitlist`. "확정 인원/순매출" 집계 = `deposit_paid | fully_paid | confirmed`. 집계에서 `cancelled` 는 항상 제외.
- 삭제 금지: 신청서는 취소(`cancelled`)만. 사용된 프로모 코드는 삭제 불가 → 일시중지(`active:false`). 사용되지 않은 코드는 삭제 가능.
- **2부→3부 계약:** 대표자 이메일은 trim+소문자로 저장(제출 제한이 정확 일치 비교). `agreedToTermsAt` 은 절대 수정하지 않는다(제출 제한 시간창). 이름·전화 편집은 `shared/domain` 의 `isValidName`, `isValidPassportName`, `normalizePhoneNumber`, `PHONE_*_PATTERN`, `EMAIL_PATTERN` 으로 검증. 가격·예약금·싱글 추가요금·좌석·배번은 0 이상 정수.
- 인원 변경 시 금액 재계산은 **신청 당시 프로모 스냅샷**(`pricing.promo`)의 조건을 그대로 쓴다(코드 유효성 재판정 안 함). 출발편 가격은 현재 상품 설정 값.
- 프로모 정률 할인은 1–100 정수, 정액은 0–1,000,000 정수.
- 상세 URL: `/admin/applicants?id=<docId>` (서버 직원 알림 메일이 이 주소를 쓴다).
- Maya 결제 링크: `tourConfig.mayaPaymentLinkBase` 가 있을 때만 `?amt=<금액>` 을 붙여 복사.
- Viber/WhatsApp 링크용 국제번호: `+63` 이면 앞자리 0 제거, 번호에 국가코드가 이미 있으면 중복 제거.

## Review Focus

1. **프로모 적용 신청의 인원 변경**: 할인 조건은 신청 당시 스냅샷대로 유지되고 코드가 지금 만료/중지됐어도 재계산이 된다 → Task 3 `keeps the original promo terms when counts change`.
2. **결제 금액 입력 `10,000` / `₱10,000` / `10000.50`**: 쉼표·기호는 허용, 소수·0·음수는 거절 → Task 3 `parseAmount` 테스트.
3. **CSV 에 쉼표·따옴표·줄바꿈·`=` 로 시작하는 이름**: 깨지지 않고 엑셀 수식으로 실행되지 않는다 → Task 2 `escapes and neutralizes formulas`.
4. **사용 중인 출발편 삭제·좌석 축소**: 신청서가 있는 출발편은 삭제 대신 닫기 안내, 사용 좌석보다 적게 줄이면 경고 → Task 4 `blocks removing a departure in use`, `warns when capacity drops below seats used`.
5. **두 직원이 같은 신청서에 동시에 결제 기록**: 결제가 사라지지 않는다(트랜잭션) → Task 5 서비스 `addPaymentTx` + Task 10 E2E 에서 두 탭으로 확인.

---

## File Structure

**Create**
- `shared/domain/contact.ts` (+ test) — 국제번호·Viber/WhatsApp 링크·Maya 결제 링크
- `frontend/web/src/lib/admin/applicationDoc.ts` (+ test) — Firestore 문서 → `ApplicationRecord`
- `frontend/web/src/lib/admin/list.ts` (+ test) — 필터·상태 건수·KPI·프로모 실적
- `frontend/web/src/lib/admin/csv.ts` (+ test) — CSV 2종
- `frontend/web/src/lib/admin/edits.ts` (+ test) — 재계산·결제·상태 이력·대표자/참가자 편집 검증
- `frontend/web/src/lib/admin/tourSettings.ts` (+ test) — 상품 설정 검증·기본값·삭제 가능 여부
- `frontend/web/src/lib/admin/promoAdmin.ts` (+ test) — 프로모 폼 검증·문서 변환·추천 링크
- `frontend/web/src/lib/admin/format.ts` (+ test) — 마닐라 날짜 표시, 상태 라벨/배지
- `frontend/web/src/lib/admin/emulators.ts` — 로컬 Auth 에뮬레이터 연결(부작용 import)
- `frontend/web/src/lib/services/admin/{applications,promoCodes,tourConfig}.ts`
- `frontend/web/src/app/admin/(dashboard)/applicants/{page.tsx,ApplicantsList.tsx,ApplicantDetail.tsx}`
- `frontend/web/src/app/admin/(dashboard)/promo-codes/page.tsx`
- `frontend/web/src/app/admin/(dashboard)/tour-settings/page.tsx`
- `backend/functions/scripts/seed-emulator-applications.mjs` — E2E 용 신청서 샘플
- `docs/superpowers/notes/launch-runbook.md`

**Modify**
- `shared/domain/index.ts`, `frontend/web/src/components/admin/Sidebar.tsx`(메뉴), `frontend/web/src/app/admin/(dashboard)/page.tsx`(리다이렉트), `frontend/web/src/app/admin/(dashboard)/layout.tsx` 와 `src/app/admin/login/page.tsx`(에뮬레이터 import 한 줄씩), `firebase.json`(auth 에뮬레이터), `backend/functions/package.json`(script), `README.md`, `docs/superpowers/notes/2026-10-12-part1-carryover.md`

---

### Task 1: 연락처 링크 · Maya 결제 링크 (도메인)

**Files:** Create `shared/domain/contact.ts`, `shared/domain/contact.test.ts`; Modify `shared/domain/index.ts`

**Interfaces — Produces:** `internationalDigits(dial: string, number: string): string | null`, `whatsappLink(dial, number): string | null`, `viberLink(dial, number): string | null`, `mayaPaymentLink(base: string | null, amount: number): string | null`

- [ ] **Step 1: 실패 테스트** — `shared/domain/contact.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { internationalDigits, mayaPaymentLink, viberLink, whatsappLink } from './contact';

describe('internationalDigits', () => {
  it('drops the trunk 0 and formatting', () => {
    expect(internationalDigits('+63', '0917 123 4567')).toBe('639171234567');
    expect(internationalDigits('+63', '917-123-4567')).toBe('639171234567');
    expect(internationalDigits('+82', '010-1234-5678')).toBe('821012345678');
  });
  it('does not duplicate a country code typed into the number', () => {
    expect(internationalDigits('+63', '+63 917 123 4567')).toBe('639171234567');
    expect(internationalDigits('+63', '639171234567')).toBe('639171234567');
  });
  it('returns null for unusable input', () => {
    expect(internationalDigits('', '9171234567')).toBeNull();
    expect(internationalDigits('+63', '123')).toBeNull();
  });
});

describe('chat links', () => {
  it('builds WhatsApp and Viber links', () => {
    expect(whatsappLink('+63', '0917 123 4567')).toBe('https://wa.me/639171234567');
    expect(viberLink('+63', '0917 123 4567')).toBe('viber://chat?number=%2B639171234567');
    expect(whatsappLink('+63', '12')).toBeNull();
  });
});

describe('mayaPaymentLink', () => {
  it('appends or replaces the amount', () => {
    expect(mayaPaymentLink('https://mymaya.me/cdctravel', 30000)).toBe('https://mymaya.me/cdctravel?amt=30000');
    expect(mayaPaymentLink('https://mymaya.me/cdctravel?amt=1&x=y', 500)).toBe('https://mymaya.me/cdctravel?amt=500&x=y');
  });
  it('returns null without a usable base or amount', () => {
    expect(mayaPaymentLink(null, 100)).toBeNull();
    expect(mayaPaymentLink('  ', 100)).toBeNull();
    expect(mayaPaymentLink('not a url', 100)).toBeNull();
    expect(mayaPaymentLink('https://mymaya.me/x', 0)).toBeNull();
  });
});
```
- [ ] **Step 2:** `pnpm --filter @unik/shared test` → FAIL (모듈 없음).
- [ ] **Step 3: 구현** — `shared/domain/contact.ts`:
```ts
// 어드민에서 고객에게 연락·결제 요청할 때 쓰는 링크 생성.

/** 국가코드 + 국내번호(앞자리 0 제거)를 숫자만으로. 쓸 수 없으면 null. */
export function internationalDigits(dial: string, number: string): string | null {
  const country = dial.replace(/\D/g, '');
  let local = number.replace(/\D/g, '');
  if (!country || !local) return null;
  if (local.startsWith(country) && local.length > country.length + 6) local = local.slice(country.length);
  local = local.replace(/^0+/, '');
  if (local.length < 6) return null;
  return country + local;
}

export function whatsappLink(dial: string, number: string): string | null {
  const digits = internationalDigits(dial, number);
  return digits ? `https://wa.me/${digits}` : null;
}

export function viberLink(dial: string, number: string): string | null {
  const digits = internationalDigits(dial, number);
  return digits ? `viber://chat?number=%2B${digits}` : null;
}

/** Maya Payment Link 에 금액을 붙인다. base 가 없거나 URL 이 아니면 null. */
export function mayaPaymentLink(base: string | null, amount: number): string | null {
  if (!base || !base.trim() || !Number.isInteger(amount) || amount <= 0) return null;
  try {
    const url = new URL(base.trim());
    url.searchParams.set('amt', String(amount));
    return url.toString();
  } catch {
    return null;
  }
}
```
`shared/domain/index.ts` 끝에 `export * from './contact';`
- [ ] **Step 4:** `pnpm --filter @unik/shared test && pnpm --filter @unik/shared typecheck` → PASS. `cd backend/functions && npm run build` (shared-domain 복사본 컴파일 확인) → OK.
- [ ] **Step 5: Commit** `git add shared/domain && git commit -m "feat(domain): 연락처 국제번호·Viber/WhatsApp·Maya 결제 링크 생성"`

---

### Task 2: 신청서 레코드 변환 · 목록 필터 · KPI · 프로모 실적 · CSV

**Files:** Create `frontend/web/src/lib/admin/{applicationDoc,list,csv,format}.ts` + 각 `.test.ts`

**Interfaces — Produces:**
- `interface PaymentRecord { id: string; type: PaymentType; method: PaymentMethod; amount: number; paidAt: Date; reference?: string; recordedBy: string }`
- `interface StatusEvent { status: ApplicationStatus; at: Date; by: string }`
- `interface ApplicationRecord { id; appNo; status: ApplicationStatus; departure: {id,label,departDate,returnDate}; lead: {firstName,lastName,email,phoneDial,phoneNumber,viber,whatsapp}; counts: Counts; travelers: Traveler[]; completeness: {filled,total}; pricing: Pricing; payments: PaymentRecord[]; paidTotal: number; specialRequests: string|null; staffNotes: string|null; statusHistory: StatusEvent[]; createdAt: Date|null; notifications: { customerEmail?: string; customerEmailError?: string; staffEmail?: string; staffEmailError?: string } | null }`
- `fromApplicationDoc(id: string, data: Record<string, unknown>): ApplicationRecord`
- `CONFIRMED_STATUSES`, `type ListFilters = { status: ApplicationStatus|'all'; departureId: string; promo: string; incompleteOnly: boolean; search: string }` (`departureId`/`promo` 의 전체 = `'all'`, 프로모 없는 신청 = `'direct'`), `DEFAULT_FILTERS`, `filterApplications(apps, f)`, `statusCounts(apps)`, `computeKpis(apps)`, `promoStats(apps)`
- `toCsv(rows)`, `applicationsCsv(apps)`, `travelersCsv(apps)`, `downloadCsv(filename, csv)`
- `formatManila(date: Date|null): string`, `STATUS_LABELS: Record<ApplicationStatus,string>`, `STATUS_BADGE: Record<ApplicationStatus,string>`(Tailwind 클래스)

- [ ] **Step 1: 실패 테스트**

`src/lib/admin/applicationDoc.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fromApplicationDoc } from './applicationDoc';

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

describe('fromApplicationDoc', () => {
  it('converts timestamps and fills safe defaults', () => {
    const r = fromApplicationDoc('doc1', {
      appNo: 'APP-0001',
      status: 'new',
      departure: { id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23' },
      lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
      counts: { full: 1, tenK: 0, companion: 0 },
      travelers: [{ category: 'full' }],
      completeness: { filled: 0, total: 8 },
      pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: null, total: 80000, depositDue: 10000 },
      payments: [{ id: 'p1', type: 'deposit', method: 'maya_qr', amount: 10000, paidAt: ts('2026-10-20T02:00:00Z'), recordedBy: 'a@cebudirectclub.com' }],
      paidTotal: 10000,
      statusHistory: [{ status: 'new', at: ts('2026-10-19T02:00:00Z'), by: 'system' }],
      createdAt: ts('2026-10-19T02:00:00Z'),
    });
    expect(r.id).toBe('doc1');
    expect(r.payments[0].paidAt).toEqual(new Date('2026-10-20T02:00:00Z'));
    expect(r.statusHistory[0].at).toEqual(new Date('2026-10-19T02:00:00Z'));
    expect(r.createdAt).toEqual(new Date('2026-10-19T02:00:00Z'));
    expect(r.specialRequests).toBeNull();
    expect(r.staffNotes).toBeNull();
    expect(r.notifications).toBeNull();
  });
  it('tolerates a document still missing server timestamps', () => {
    const r = fromApplicationDoc('doc2', { appNo: 'APP-0002', status: 'waitlist' });
    expect(r.createdAt).toBeNull();
    expect(r.payments).toEqual([]);
    expect(r.counts).toEqual({ full: 0, tenK: 0, companion: 0 });
    expect(r.travelers).toEqual([]);
  });
});
```
`src/lib/admin/list.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, computeKpis, filterApplications, promoStats, statusCounts } from './list';
import type { ApplicationRecord } from './applicationDoc';

function app(over: Partial<ApplicationRecord>): ApplicationRecord {
  return {
    id: over.appNo ?? 'x',
    appNo: 'APP-0000',
    status: 'new',
    departure: { id: 'mnl', label: 'Manila', departDate: '', returnDate: '' },
    lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: false, whatsapp: false },
    counts: { full: 1, tenK: 0, companion: 0 },
    travelers: [{ category: 'full' }],
    completeness: { filled: 8, total: 8 },
    pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: null, total: 80000, depositDue: 10000 },
    payments: [],
    paidTotal: 0,
    specialRequests: null,
    staffNotes: null,
    statusHistory: [],
    createdAt: new Date('2026-10-19T00:00:00Z'),
    notifications: null,
    ...over,
  };
}
const promo = (code: string, discountTotal = 2000) => ({ code, agencyName: code, type: 'fixed' as const, value: 2000, discountTotal });

const apps = [
  app({ id: 'a1', appNo: 'APP-0001', createdAt: new Date('2026-10-19T00:00:00Z') }),
  app({ id: 'a2', appNo: 'APP-0002', status: 'confirmed', counts: { full: 2, tenK: 0, companion: 1 }, pricing: { lines: [], singleSupplements: 0, subtotal: 230000, promo: promo('TA-A', 6000), total: 224000, depositDue: 30000 }, createdAt: new Date('2026-10-20T00:00:00Z') }),
  app({ id: 'a3', appNo: 'APP-0003', status: 'cancelled', pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: promo('TA-A'), total: 78000, depositDue: 10000 }, createdAt: new Date('2026-10-21T00:00:00Z') }),
  app({ id: 'a4', appNo: 'APP-0004', departure: { id: 'ceb', label: 'Cebu', departDate: '', returnDate: '' }, completeness: { filled: 2, total: 8 }, lead: { firstName: 'José', lastName: 'Reyes', email: 'jose@x.com', phoneDial: '+63', phoneNumber: '0918 000 1111', viber: false, whatsapp: true }, createdAt: new Date('2026-10-22T00:00:00Z') }),
];

describe('filterApplications', () => {
  it('sorts newest first by default', () => {
    expect(filterApplications(apps, DEFAULT_FILTERS).map((a) => a.appNo)).toEqual(['APP-0004', 'APP-0003', 'APP-0002', 'APP-0001']);
  });
  it('filters by status, departure, promo, direct and incomplete', () => {
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, status: 'confirmed' }).map((a) => a.id)).toEqual(['a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, departureId: 'ceb' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, promo: 'TA-A' }).map((a) => a.id)).toEqual(['a3', 'a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, promo: 'direct' }).map((a) => a.id)).toEqual(['a4', 'a1']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, incompleteOnly: true }).map((a) => a.id)).toEqual(['a4']);
  });
  it('searches app number, name, email and phone digits, accent-insensitive', () => {
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'app-0002' }).map((a) => a.id)).toEqual(['a2']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'jose reyes' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: '09180001111' }).map((a) => a.id)).toEqual(['a4']);
    expect(filterApplications(apps, { ...DEFAULT_FILTERS, search: 'JOSE@X' }).map((a) => a.id)).toEqual(['a4']);
  });
});

describe('statusCounts / computeKpis', () => {
  it('counts each status and all', () => {
    const c = statusCounts(apps);
    expect(c.all).toBe(4);
    expect(c.new).toBe(2);
    expect(c.cancelled).toBe(1);
    expect(c.waitlist).toBe(0);
  });
  it('excludes cancelled from KPIs', () => {
    expect(computeKpis(apps)).toEqual({
      applications: 3,
      travelers: 5,
      byCategory: { full: 4, tenK: 0, companion: 1 },
      confirmedTravelers: 3,
      incomplete: 1,
    });
  });
});

describe('promoStats', () => {
  it('aggregates per code excluding cancelled; sales and discounts count confirmed only', () => {
    expect(promoStats(apps)).toEqual({
      'TA-A': { applications: 1, pax: 3, confirmedPax: 3, netSales: 224000, discountTotal: 6000 },
    });
  });
});
```
`src/lib/admin/csv.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applicationsCsv, toCsv, travelersCsv } from './csv';
import type { ApplicationRecord } from './applicationDoc';

const base: ApplicationRecord = {
  id: 'a1',
  appNo: 'APP-0001',
  status: 'contacted',
  departure: { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' },
  lead: { firstName: 'Maria', lastName: 'Santos, Jr.', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
  counts: { full: 1, tenK: 0, companion: 1 },
  travelers: [
    { category: 'full', passportName: '=HYPERLINK("x")', dob: '1990-05-14', tshirtSize: 'M' },
    { category: 'companion', passportName: 'He said "hi"\nbye' },
  ],
  completeness: { filled: 4, total: 14 },
  pricing: { lines: [], singleSupplements: 0, subtotal: 150000, promo: { code: 'TA-A', agencyName: 'A Travel', type: 'fixed', value: 2000, discountTotal: 4000 }, total: 146000, depositDue: 20000 },
  payments: [],
  paidTotal: 20000,
  specialRequests: 'Vegetarian',
  staffNotes: null,
  statusHistory: [],
  createdAt: new Date('2026-10-19T16:30:00Z'),
  notifications: null,
};

describe('toCsv', () => {
  it('escapes and neutralizes formulas', () => {
    const csv = toCsv([['a,b', 'say "x"', 'line1\nline2', '=SUM(A1)', '+1', '-2', '@x', 5, null]]);
    expect(csv).toBe('﻿"a,b","say ""x""","line1\nline2",\'=SUM(A1),\'+1,\'-2,\'@x,5,\r\n');
  });
});

describe('applicationsCsv', () => {
  it('has one row per application with Manila time and promo agency', () => {
    const lines = applicationsCsv([base]).replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe(
      'App no,Status,Applied (Manila),Departure,First name,Last name,Email,Phone,Viber,WhatsApp,Full,10K,Companion,Promo code,Agency,Total PHP,Deposit due PHP,Paid PHP,Info,Special requests,Staff notes',
    );
    expect(lines[1]).toBe(
      // 전화번호는 '+' 로 시작하므로 수식 방지 접두사 ' 가 붙는다(엑셀에서 텍스트로 표시)
      "APP-0001,Contacted,2026-10-20 00:30,Manila (MNL),Maria,\"Santos, Jr.\",maria@example.com,'+63 917 123 4567,Yes,No,1,0,1,TA-A,A Travel,146000,20000,20000,4/14,Vegetarian,",
    );
  });
});

describe('travelersCsv', () => {
  it('has one row per traveler and skips cancelled applications', () => {
    const lines = travelersCsv([base, { ...base, id: 'a2', appNo: 'APP-0002', status: 'cancelled' }])
      .replace('﻿', '')
      .trim()
      .split('\r\n');
    expect(lines[0]).toBe(
      'App no,Status,Departure,Traveler,Category,Name as in passport,Date of birth,Gender,Nationality,T-shirt,Expected finish,Recent marathon,Room,Emergency contact,Lead email',
    );
    // header + 2 travelers; the cancelled application is skipped. 셀 안 줄바꿈(\n)은 행 구분자(\r\n)가 아니다.
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("'=HYPERLINK(\"\"x\"\")");
  });
});
```

`src/lib/admin/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { STATUS_LABELS, formatManila } from './format';

describe('format', () => {
  it('formats Manila time', () => {
    expect(formatManila(new Date('2026-10-19T16:30:00Z'))).toBe('2026-10-20 00:30');
    expect(formatManila(null)).toBe('—');
  });
  it('labels every status', () => {
    expect(STATUS_LABELS.deposit_paid).toBe('Deposit paid');
    expect(Object.keys(STATUS_LABELS)).toHaveLength(7);
  });
});
```
- [ ] **Step 2:** `pnpm --filter @unik/web test` → FAIL.
- [ ] **Step 3: 구현**

`src/lib/admin/format.ts`:
```ts
import type { ApplicationStatus } from '@unik/shared/domain';

export function formatManila(date: Date | null): string {
  if (!date) return '—';
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  deposit_paid: 'Deposit paid',
  fully_paid: 'Fully paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  waitlist: 'Waitlist',
};

export const STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-sky-100 text-sky-800',
  fully_paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-slate-900 text-white',
  cancelled: 'bg-slate-100 text-slate-500',
  waitlist: 'bg-purple-100 text-purple-800',
};
```
`src/lib/admin/applicationDoc.ts`:
```ts
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
    counts: (data.counts as Counts) ?? { full: 0, tenK: 0, companion: 0 },
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
```
`src/lib/admin/list.ts`:
```ts
import { APPLICATION_STATUSES, totalPax } from '@unik/shared/domain';
import type { ApplicationStatus, Counts } from '@unik/shared/domain';
import type { ApplicationRecord } from './applicationDoc';

export const CONFIRMED_STATUSES: readonly ApplicationStatus[] = ['deposit_paid', 'fully_paid', 'confirmed'];

export interface ListFilters {
  status: ApplicationStatus | 'all';
  departureId: string; // 'all' | departure id
  promo: string; // 'all' | 'direct' | code
  incompleteOnly: boolean;
  search: string;
}

export const DEFAULT_FILTERS: ListFilters = { status: 'all', departureId: 'all', promo: 'all', incompleteOnly: false, search: '' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function matchesSearch(a: ApplicationRecord, raw: string): boolean {
  const q = fold(raw.trim());
  if (!q) return true;
  const hay = fold(`${a.appNo} ${a.lead.firstName} ${a.lead.lastName} ${a.lead.email}`);
  if (hay.includes(q)) return true;
  // 전화번호 검색: 숫자만, 앞자리 0 제거 후 6자리 이상일 때만 (짧은 숫자가 엉뚱한 번호에 걸리지 않게)
  const digits = q.replace(/\D/g, '').replace(/^0+/, '');
  return digits.length >= 6 && `${a.lead.phoneDial}${a.lead.phoneNumber}`.replace(/\D/g, '').includes(digits);
}

export function filterApplications(apps: ApplicationRecord[], f: ListFilters): ApplicationRecord[] {
  return apps
    .filter((a) => f.status === 'all' || a.status === f.status)
    .filter((a) => f.departureId === 'all' || a.departure.id === f.departureId)
    .filter((a) => {
      const code = a.pricing.promo?.code ?? null;
      if (f.promo === 'all') return true;
      if (f.promo === 'direct') return code === null;
      return code === f.promo;
    })
    .filter((a) => !f.incompleteOnly || a.completeness.filled < a.completeness.total)
    .filter((a) => matchesSearch(a, f.search))
    .sort((x, y) => (y.createdAt?.getTime() ?? 0) - (x.createdAt?.getTime() ?? 0));
}

export function statusCounts(apps: ApplicationRecord[]): Record<ApplicationStatus | 'all', number> {
  const out = Object.fromEntries([['all', apps.length], ...APPLICATION_STATUSES.map((s) => [s, 0])]) as Record<ApplicationStatus | 'all', number>;
  for (const a of apps) out[a.status] += 1;
  return out;
}

export function computeKpis(apps: ApplicationRecord[]) {
  const active = apps.filter((a) => a.status !== 'cancelled');
  const byCategory: Counts = { full: 0, tenK: 0, companion: 0 };
  for (const a of active) {
    byCategory.full += a.counts.full;
    byCategory.tenK += a.counts.tenK;
    byCategory.companion += a.counts.companion;
  }
  return {
    applications: active.length,
    travelers: totalPax(byCategory),
    byCategory,
    confirmedTravelers: active.filter((a) => CONFIRMED_STATUSES.includes(a.status)).reduce((s, a) => s + totalPax(a.counts), 0),
    incomplete: active.filter((a) => a.completeness.filled < a.completeness.total).length,
  };
}

export interface PromoStat {
  applications: number;
  pax: number;
  confirmedPax: number;
  netSales: number;
  discountTotal: number;
}

export function promoStats(apps: ApplicationRecord[]): Record<string, PromoStat> {
  const out: Record<string, PromoStat> = {};
  for (const a of apps) {
    const code = a.pricing.promo?.code;
    if (!code || a.status === 'cancelled') continue;
    const s = (out[code] ??= { applications: 0, pax: 0, confirmedPax: 0, netSales: 0, discountTotal: 0 });
    s.applications += 1;
    s.pax += totalPax(a.counts);
    if (CONFIRMED_STATUSES.includes(a.status)) {
      s.confirmedPax += totalPax(a.counts);
      s.netSales += a.pricing.total;
      s.discountTotal += a.pricing.promo?.discountTotal ?? 0;
    }
  }
  return out;
}
```
`src/lib/admin/csv.ts`:
```ts
import { CATEGORY_LABELS } from '@unik/shared/domain';
import type { ApplicationRecord } from './applicationDoc';
import { STATUS_LABELS, formatManila } from './format';

type Cell = string | number | null | undefined;

function cell(v: Cell): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // 엑셀 수식 주입 방지
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** BOM 포함(엑셀 한글·특수문자), 행 구분 CRLF */
export function toCsv(rows: Cell[][]): string {
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

export function applicationsCsv(apps: ApplicationRecord[]): string {
  const header = ['App no', 'Status', 'Applied (Manila)', 'Departure', 'First name', 'Last name', 'Email', 'Phone', 'Viber', 'WhatsApp', 'Full', '10K', 'Companion', 'Promo code', 'Agency', 'Total PHP', 'Deposit due PHP', 'Paid PHP', 'Info', 'Special requests', 'Staff notes'];
  const rows = apps.map((a) => [
    a.appNo,
    STATUS_LABELS[a.status],
    formatManila(a.createdAt),
    a.departure.label,
    a.lead.firstName,
    a.lead.lastName,
    a.lead.email,
    `${a.lead.phoneDial} ${a.lead.phoneNumber}`,
    yesNo(a.lead.viber),
    yesNo(a.lead.whatsapp),
    a.counts.full,
    a.counts.tenK,
    a.counts.companion,
    a.pricing.promo?.code ?? '',
    a.pricing.promo?.agencyName ?? '',
    a.pricing.total,
    a.pricing.depositDue,
    a.paidTotal,
    `${a.completeness.filled}/${a.completeness.total}`,
    a.specialRequests ?? '',
    a.staffNotes ?? '',
  ]);
  return toCsv([header, ...rows]);
}

export function travelersCsv(apps: ApplicationRecord[]): string {
  const header = ['App no', 'Status', 'Departure', 'Traveler', 'Category', 'Name as in passport', 'Date of birth', 'Gender', 'Nationality', 'T-shirt', 'Expected finish', 'Recent marathon', 'Room', 'Emergency contact', 'Lead email'];
  const rows = apps
    .filter((a) => a.status !== 'cancelled')
    .flatMap((a) =>
      a.travelers.map((t, i) => [
        a.appNo,
        STATUS_LABELS[a.status],
        a.departure.label,
        i + 1,
        CATEGORY_LABELS[t.category],
        t.passportName,
        t.dob,
        t.gender,
        t.nationality,
        t.tshirtSize,
        t.expectedFinish,
        t.recentMarathon,
        t.room,
        t.emergencyContact,
        a.lead.email,
      ]),
    );
  return toCsv([header, ...rows]);
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```
- [ ] **Step 4:** `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `git add frontend/web/src/lib/admin && git commit -m "feat(admin): 신청서 레코드 변환, 목록 필터·KPI·프로모 실적, CSV 2종"`

---

### Task 3: 신청서 편집 로직 (재계산 · 결제 · 상태 · 편집 검증)

**Files:** Create `frontend/web/src/lib/admin/edits.ts`, `edits.test.ts`

**Interfaces — Consumes:** Task 2 `ApplicationRecord`, `PaymentRecord`, `StatusEvent`; domain `buildTravelers`, `computeCompleteness`, `computePricing`, `validateCounts`, validation 함수들.
**Produces:**
- `recalculate(app, change: { counts?: Counts; travelers?: Traveler[] }, config: TourConfig | null): { travelers: Traveler[]; completeness; pricing: Pricing } | { error: string }`
- `parseAmount(raw: string): number | null`
- `applyPayment(app, payment: PaymentRecord): { payments: PaymentRecord[]; paidTotal: number; suggestedStatus: ApplicationStatus | null }`
- `withoutPayment(app, paymentId): { payments; paidTotal }`
- `statusChangeWarnings(app, next: ApplicationStatus): string[]`
- `normalizeLead(lead): ApplicationRecord['lead']`, `validateLead(lead): Record<string,string>`
- `validateTravelers(travelers, today: string): Record<string,string>` (키 `travelers.<i>.<field>`)

- [ ] **Step 1: 실패 테스트** — `src/lib/admin/edits.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';
import { applyPayment, normalizeLead, parseAmount, recalculate, statusChangeWarnings, validateLead, validateTravelers, withoutPayment } from './edits';

const config: TourConfig = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [{ id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: '', seatCapacity: 120, isOpen: false, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 }],
};

const app: ApplicationRecord = {
  id: 'a1',
  appNo: 'APP-0001',
  status: 'contacted',
  departure: { id: 'mnl', label: 'Manila', departDate: '2027-03-19', returnDate: '2027-03-23' },
  lead: { firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com', phoneDial: '+63', phoneNumber: '917 123 4567', viber: true, whatsapp: false },
  counts: { full: 1, tenK: 0, companion: 0 },
  travelers: [{ category: 'full', passportName: 'SANTOS MARIA' }],
  completeness: { filled: 1, total: 8 },
  pricing: { lines: [], singleSupplements: 0, subtotal: 80000, promo: { code: 'TA-OLD', agencyName: 'Old', type: 'fixed', value: 2000, discountTotal: 2000 }, total: 78000, depositDue: 10000 },
  payments: [],
  paidTotal: 0,
  specialRequests: null,
  staffNotes: null,
  statusHistory: [],
  createdAt: null,
  notifications: null,
};

const pay = (over: Partial<PaymentRecord> = {}): PaymentRecord => ({ id: 'p1', type: 'deposit', method: 'maya_qr', amount: 10000, paidAt: new Date('2026-10-20T00:00:00Z'), recordedBy: 's@cebudirectclub.com', ...over });

describe('recalculate', () => {
  it('keeps the original promo terms when counts change, even if the departure is now closed', () => {
    const r = recalculate(app, { counts: { full: 1, tenK: 0, companion: 1 } }, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.travelers).toEqual([{ category: 'full', passportName: 'SANTOS MARIA' }, { category: 'companion' }]);
    expect(r.pricing.promo).toMatchObject({ code: 'TA-OLD', discountTotal: 4000 });
    expect(r.pricing.total).toBe(146000);
    expect(r.pricing.depositDue).toBe(20000);
    expect(r.completeness).toEqual({ filled: 1, total: 14 });
  });
  it('reprices single supplements when a traveler room changes', () => {
    const r = recalculate(app, { travelers: [{ category: 'full', room: 'single' }] }, config);
    if ('error' in r) throw new Error(r.error);
    expect(r.pricing.singleSupplements).toBe(15000);
  });
  it('rejects invalid counts and a departure missing from settings', () => {
    expect(recalculate(app, { counts: { full: 0, tenK: 0, companion: 0 } }, config)).toEqual({ error: 'At least one traveler is required' });
    expect(recalculate(app, { counts: { full: 2, tenK: 0, companion: 0 } }, { ...config, departures: [] })).toMatchObject({ error: expect.stringContaining('tour settings') });
    expect(recalculate(app, { counts: { full: 2, tenK: 0, companion: 0 } }, null)).toMatchObject({ error: expect.any(String) });
  });
});

describe('parseAmount', () => {
  it('accepts formatted whole pesos', () => {
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('₱10,000')).toBe(10000);
    expect(parseAmount('PHP 2 500')).toBe(2500);
  });
  it('rejects decimals, zero, negatives and junk', () => {
    expect(parseAmount('10000.50')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});

describe('payments', () => {
  it('suggests deposit_paid when the deposit is reached', () => {
    expect(applyPayment(app, pay())).toMatchObject({ paidTotal: 10000, suggestedStatus: 'deposit_paid' });
  });
  it('suggests fully_paid when the total is reached', () => {
    const r = applyPayment({ ...app, status: 'deposit_paid', payments: [pay()], paidTotal: 10000 }, pay({ id: 'p2', type: 'balance', amount: 68000 }));
    expect(r).toMatchObject({ paidTotal: 78000, suggestedStatus: 'fully_paid' });
  });
  it('does not suggest a downgrade or touch cancelled/confirmed', () => {
    expect(applyPayment({ ...app, status: 'confirmed' }, pay()).suggestedStatus).toBeNull();
    expect(applyPayment({ ...app, status: 'cancelled' }, pay()).suggestedStatus).toBeNull();
    expect(applyPayment(app, pay({ amount: 5000 })).suggestedStatus).toBeNull();
  });
  it('removes a payment and recomputes the total', () => {
    const withTwo = { ...app, payments: [pay(), pay({ id: 'p2', amount: 3000 })], paidTotal: 13000 };
    expect(withoutPayment(withTwo, 'p1')).toEqual({ payments: [pay({ id: 'p2', amount: 3000 })], paidTotal: 3000 });
  });
});

describe('statusChangeWarnings', () => {
  it('warns when confirming with missing traveler info or unpaid balance', () => {
    expect(statusChangeWarnings(app, 'confirmed')).toEqual([
      'Traveler details are incomplete (1/8).',
      'Only PHP 0 of PHP 78,000 has been recorded as paid.',
    ]);
    expect(statusChangeWarnings({ ...app, completeness: { filled: 8, total: 8 }, paidTotal: 78000 }, 'confirmed')).toEqual([]);
    expect(statusChangeWarnings(app, 'contacted')).toEqual([]);
  });
});

describe('lead and traveler edits', () => {
  it('normalizes email and phone', () => {
    expect(normalizeLead({ ...app.lead, email: '  Maria@Example.COM ', phoneNumber: '(0917) 123-4567' })).toMatchObject({ email: 'maria@example.com', phoneNumber: '0917 123-4567' });
  });
  it('validates lead fields with the shared rules', () => {
    expect(validateLead(app.lead)).toEqual({});
    expect(Object.keys(validateLead({ ...app.lead, firstName: '', email: 'x', phoneNumber: '12' })).sort()).toEqual(['lead.email', 'lead.firstName', 'lead.phoneNumber']);
  });
  it('validates only filled traveler fields', () => {
    expect(validateTravelers([{ category: 'full' }], '2026-10-20')).toEqual({});
    expect(validateTravelers([{ category: 'full', passportName: 'www.x.com', dob: '2027-02-30' }], '2026-10-20')).toEqual({
      'travelers.0.passportName': expect.any(String),
      'travelers.0.dob': expect.any(String),
    });
  });
});
```
- [ ] **Step 2:** `pnpm --filter @unik/web test` → FAIL.
- [ ] **Step 3: 구현** — `src/lib/admin/edits.ts`:
```ts
import {
  EMAIL_PATTERN,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  buildTravelers,
  computeCompleteness,
  computePricing,
  formatPHP,
  hasControlChars,
  isValidBirthDate,
  isValidName,
  isValidPassportName,
  normalizePhoneNumber,
  validateCounts,
} from '@unik/shared/domain';
import type { ApplicationStatus, Counts, Pricing, TourConfig, Traveler } from '@unik/shared/domain';
import type { ApplicationRecord, PaymentRecord } from './applicationDoc';

export function recalculate(
  app: ApplicationRecord,
  change: { counts?: Counts; travelers?: Traveler[] },
  config: TourConfig | null,
): { travelers: Traveler[]; completeness: { filled: number; total: number }; pricing: Pricing } | { error: string } {
  const counts = change.counts ?? app.counts;
  const countsError = validateCounts(counts);
  if (countsError) return { error: countsError };
  if (!config) return { error: 'Tour settings are not loaded yet.' };
  const departure = config.departures.find((d) => d.id === app.departure.id);
  if (!departure) return { error: 'This departure is no longer in tour settings, so prices cannot be recalculated.' };
  const travelers = buildTravelers(counts, change.travelers ?? app.travelers);
  const snap = app.pricing.promo;
  const pricing = computePricing({
    departure,
    counts,
    travelers,
    // 신청 당시 할인 조건을 그대로 쓴다 (코드 유효성은 다시 판정하지 않음)
    promo: snap ? { code: snap.code, agencyName: snap.agencyName, discountType: snap.type, discountValue: snap.value } : null,
    depositPerPax: config.depositPerPax,
  });
  return { travelers, completeness: computeCompleteness(travelers), pricing };
}

/** "10,000", "₱10,000", "PHP 2 500" → 정수 페소. 소수·0·음수·문자는 null. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/php|₱|,|\s/gi, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const NO_AUTO_SUGGEST: readonly ApplicationStatus[] = ['cancelled', 'confirmed', 'fully_paid'];

export function applyPayment(app: ApplicationRecord, payment: PaymentRecord) {
  const payments = [...app.payments, payment];
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  let suggestedStatus: ApplicationStatus | null = null;
  if (!NO_AUTO_SUGGEST.includes(app.status)) {
    if (paidTotal >= app.pricing.total && app.pricing.total > 0) suggestedStatus = 'fully_paid';
    else if (app.status !== 'deposit_paid' && paidTotal >= app.pricing.depositDue && app.pricing.depositDue > 0) suggestedStatus = 'deposit_paid';
  }
  return { payments, paidTotal, suggestedStatus };
}

export function withoutPayment(app: ApplicationRecord, paymentId: string) {
  const payments = app.payments.filter((p) => p.id !== paymentId);
  return { payments, paidTotal: payments.reduce((s, p) => s + p.amount, 0) };
}

export function statusChangeWarnings(app: ApplicationRecord, next: ApplicationStatus): string[] {
  if (next !== 'confirmed') return [];
  const warnings: string[] = [];
  if (app.completeness.filled < app.completeness.total) {
    warnings.push(`Traveler details are incomplete (${app.completeness.filled}/${app.completeness.total}).`);
  }
  if (app.paidTotal < app.pricing.total) {
    warnings.push(`Only ${formatPHP(app.paidTotal)} of ${formatPHP(app.pricing.total)} has been recorded as paid.`);
  }
  return warnings;
}

export function normalizeLead(lead: ApplicationRecord['lead']): ApplicationRecord['lead'] {
  return {
    ...lead,
    firstName: lead.firstName.trim(),
    lastName: lead.lastName.trim(),
    email: lead.email.trim().toLowerCase(),
    phoneNumber: normalizePhoneNumber(lead.phoneNumber),
  };
}

export function validateLead(lead: ApplicationRecord['lead']): Record<string, string> {
  const l = normalizeLead(lead);
  const e: Record<string, string> = {};
  if (!isValidName(l.firstName)) e['lead.firstName'] = 'Enter a valid first name.';
  if (!isValidName(l.lastName)) e['lead.lastName'] = 'Enter a valid last name.';
  if (!EMAIL_PATTERN.test(l.email) || l.email.length > 120) e['lead.email'] = 'Enter a valid email.';
  if (!PHONE_DIAL_PATTERN.test(l.phoneDial) || !PHONE_NUMBER_PATTERN.test(l.phoneNumber)) e['lead.phoneNumber'] = 'Enter a valid mobile number.';
  return e;
}

const TEXT_MAX: Partial<Record<keyof Traveler, number>> = { nationality: 60, expectedFinish: 20, recentMarathon: 120, emergencyContact: 120 };

export function validateTravelers(travelers: Traveler[], today: string): Record<string, string> {
  const e: Record<string, string> = {};
  travelers.forEach((t, i) => {
    const name = t.passportName?.trim();
    if (name && !isValidPassportName(name)) e[`travelers.${i}.passportName`] = 'Check the passport name.';
    const dob = t.dob?.trim();
    if (dob && !isValidBirthDate(dob, today)) e[`travelers.${i}.dob`] = 'Invalid date of birth.';
    for (const [field, max] of Object.entries(TEXT_MAX) as [keyof Traveler, number][]) {
      const v = (t[field] as string | undefined)?.trim();
      if (v && (v.length > max || hasControlChars(v))) e[`travelers.${i}.${field}`] = `Max ${max} characters.`;
    }
  });
  return e;
}
```
(`applyPayment` 의 `fully_paid` 제안: 현재 `deposit_paid` 이하 상태에서 총액 도달 시. 테스트의 두 번째 케이스가 이를 검증한다.)
- [ ] **Step 4:** `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `git add frontend/web/src/lib/admin && git commit -m "feat(admin): 인원 변경 재계산(프로모 스냅샷 유지), 결제 기록, 상태 변경 경고, 편집 검증"`

---

### Task 4: 상품 설정 · 프로모 코드 폼 로직

**Files:** Create `frontend/web/src/lib/admin/tourSettings.ts`, `tourSettings.test.ts`, `promoAdmin.ts`, `promoAdmin.test.ts`

**Interfaces — Produces:**
- `defaultTourConfig(): TourConfig`, `newDeparture(): Departure`, `validateTourConfig(c: TourConfig, usage: Record<string, { seatsUsed: number; applications: number }>): { errors: Record<string,string>; warnings: string[] }`, `canRemoveDeparture(usage, id): boolean`, `DEPARTURE_ID_PATTERN`
- `interface PromoForm { code; agencyName; contactName; contactInfo; discountType: DiscountType; discountValue: string; validUntil: string; maxPax: string; active: boolean; notes }`, `emptyPromoForm()`, `promoToForm(p: PromoCode): PromoForm`, `validatePromoForm(f, opts: { isNew: boolean; existingCodes: string[] }): Record<string,string>`, `toPromoDoc(f): Omit<PromoCode,'code'>`, `referralLink(code): string`

- [ ] **Step 1: 실패 테스트**

`src/lib/admin/tourSettings.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { canRemoveDeparture, defaultTourConfig, newDeparture, validateTourConfig } from './tourSettings';

function valid() {
  const c = defaultTourConfig();
  c.depositPerPax = 10000;
  c.bibQuota.total = 200;
  c.notifyEmails = ['staff@cebudirectclub.com'];
  c.departures = [{ ...newDeparture(), id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', seatCapacity: 120, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 }];
  return c;
}

describe('validateTourConfig', () => {
  it('accepts a valid config', () => {
    expect(validateTourConfig(valid(), {})).toEqual({ errors: {}, warnings: [] });
  });
  it('defaults are closed for applications', () => {
    expect(defaultTourConfig().acceptingApplications).toBe(false);
  });
  it('rejects bad numbers, ids, dates, emails and Maya URL', () => {
    const c = valid();
    c.depositPerPax = -1;
    c.bibQuota.total = 1.5;
    c.notifyEmails = ['nope'];
    c.mayaPaymentLinkBase = 'http://insecure.example';
    c.departures.push({ ...c.departures[0], id: 'mnl' });
    c.departures.push({ ...newDeparture(), id: 'Bad Id', label: '', departDate: '2027-03-23', returnDate: '2027-03-19', prices: { full: -1, tenK: 0, companion: 0 } });
    const { errors } = validateTourConfig(c, {});
    expect(Object.keys(errors).sort()).toEqual(
      [
        'bibQuota.total',
        'depositPerPax',
        'departures.1.id',
        'departures.2.id',
        'departures.2.label',
        'departures.2.prices.full',
        'departures.2.returnDate',
        'mayaPaymentLinkBase',
        'notifyEmails',
      ].sort(),
    );
  });
  it('warns when capacity drops below seats used', () => {
    const c = valid();
    c.departures[0].seatCapacity = 10;
    expect(validateTourConfig(c, { mnl: { seatsUsed: 12, applications: 5 } }).warnings).toEqual([
      'Manila (MNL): capacity 10 is below the 12 seats already taken. New applications will go to the waitlist.',
    ]);
  });
});

describe('canRemoveDeparture', () => {
  it('blocks removing a departure in use', () => {
    expect(canRemoveDeparture({ mnl: { seatsUsed: 0, applications: 1 } }, 'mnl')).toBe(false);
    expect(canRemoveDeparture({}, 'mnl')).toBe(true);
  });
});
```
`src/lib/admin/promoAdmin.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emptyPromoForm, promoToForm, referralLink, toPromoDoc, validatePromoForm } from './promoAdmin';

const form = () => ({ ...emptyPromoForm(), code: 'ta-sunrise', agencyName: 'Sunrise Travel', discountValue: '2,000' });

describe('validatePromoForm', () => {
  it('accepts a normalized new code', () => {
    expect(validatePromoForm(form(), { isNew: true, existingCodes: [] })).toEqual({});
  });
  it('rejects duplicates and bad formats', () => {
    expect(validatePromoForm(form(), { isNew: true, existingCodes: ['TA-SUNRISE'] })).toHaveProperty('code');
    expect(validatePromoForm({ ...form(), code: 'ta sunrise' }, { isNew: true, existingCodes: [] })).toHaveProperty('code');
    expect(validatePromoForm({ ...form(), agencyName: ' ' }, { isNew: true, existingCodes: [] })).toHaveProperty('agencyName');
  });
  it('limits discount values by type', () => {
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '0' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '5.5' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
    expect(validatePromoForm({ ...form(), discountType: 'percent', discountValue: '100' }, { isNew: true, existingCodes: [] })).toEqual({});
    expect(validatePromoForm({ ...form(), discountValue: '1,000,001' }, { isNew: true, existingCodes: [] })).toHaveProperty('discountValue');
  });
  it('validates optional expiry and max travelers', () => {
    expect(validatePromoForm({ ...form(), validUntil: '2027-02-30' }, { isNew: true, existingCodes: [] })).toHaveProperty('validUntil');
    expect(validatePromoForm({ ...form(), maxPax: '0' }, { isNew: true, existingCodes: [] })).toHaveProperty('maxPax');
    expect(validatePromoForm({ ...form(), validUntil: '2027-01-31', maxPax: '20' }, { isNew: true, existingCodes: [] })).toEqual({});
  });
});

describe('toPromoDoc / promoToForm / referralLink', () => {
  it('converts blanks to null and numbers to integers', () => {
    expect(toPromoDoc(form())).toEqual({
      agencyName: 'Sunrise Travel',
      contactName: '',
      contactInfo: '',
      discountType: 'fixed',
      discountValue: 2000,
      validUntil: null,
      maxPax: null,
      active: true,
      notes: '',
    });
  });
  it('round-trips an existing code', () => {
    const f = promoToForm({ code: 'TA-X', agencyName: 'X', discountType: 'percent', discountValue: 5, validUntil: '2027-01-31', maxPax: 10, active: false });
    expect(f).toMatchObject({ code: 'TA-X', discountValue: '5', validUntil: '2027-01-31', maxPax: '10', active: false });
  });
  it('builds the shareable link', () => {
    expect(referralLink('TA-SUNRISE')).toBe('https://unik.ph/apply?code=TA-SUNRISE');
  });
});
```
- [ ] **Step 2:** `pnpm --filter @unik/web test` → FAIL.
- [ ] **Step 3: 구현**

`src/lib/admin/tourSettings.ts`:
```ts
import { EMAIL_PATTERN } from '@unik/shared/domain';
import type { Departure, TourConfig } from '@unik/shared/domain';

export const DEPARTURE_ID_PATTERN = /^[a-z0-9-]{2,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isMoney = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0;

export function defaultTourConfig(): TourConfig {
  return {
    acceptingApplications: false,
    currency: 'PHP',
    depositPerPax: 0,
    bibQuota: { total: 200 },
    mayaPaymentLinkBase: null,
    notifyEmails: [],
    departures: [],
  };
}

export function newDeparture(): Departure {
  return {
    id: '',
    label: '',
    departDate: '',
    returnDate: '',
    flightInfo: '',
    seatCapacity: 0,
    isOpen: true,
    prices: { full: 0, tenK: 0, companion: 0 },
    singleSupplement: 0,
  };
}

export type DepartureUsage = Record<string, { seatsUsed: number; applications: number }>;

export function validateTourConfig(c: TourConfig, usage: DepartureUsage): { errors: Record<string, string>; warnings: string[] } {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  if (!isMoney(c.depositPerPax)) errors.depositPerPax = 'Whole pesos, 0 or more.';
  if (!isMoney(c.bibQuota.total)) errors['bibQuota.total'] = 'Whole number, 0 or more.';
  if (c.mayaPaymentLinkBase !== null && c.mayaPaymentLinkBase.trim() !== '' && !/^https:\/\/\S+$/.test(c.mayaPaymentLinkBase.trim())) {
    errors.mayaPaymentLinkBase = 'Must be an https:// link (e.g. https://mymaya.me/yourstore).';
  }
  if (c.notifyEmails.some((e) => !EMAIL_PATTERN.test(e.trim()))) errors.notifyEmails = 'One or more emails are invalid.';
  const seen = new Set<string>();
  c.departures.forEach((d, i) => {
    const p = `departures.${i}`;
    if (!DEPARTURE_ID_PATTERN.test(d.id) || seen.has(d.id)) errors[`${p}.id`] = 'Lowercase letters, numbers and hyphens (2–20), unique.';
    seen.add(d.id);
    if (!d.label.trim()) errors[`${p}.label`] = 'Required.';
    if (!DATE.test(d.departDate)) errors[`${p}.departDate`] = 'YYYY-MM-DD.';
    if (!DATE.test(d.returnDate) || (DATE.test(d.departDate) && d.returnDate < d.departDate)) errors[`${p}.returnDate`] = 'YYYY-MM-DD, on or after departure.';
    if (!isMoney(d.seatCapacity)) errors[`${p}.seatCapacity`] = 'Whole number, 0 or more.';
    for (const k of ['full', 'tenK', 'companion'] as const) {
      if (!isMoney(d.prices[k])) errors[`${p}.prices.${k}`] = 'Whole pesos, 0 or more.';
    }
    if (!isMoney(d.singleSupplement)) errors[`${p}.singleSupplement`] = 'Whole pesos, 0 or more.';
    const used = usage[d.id]?.seatsUsed ?? 0;
    if (isMoney(d.seatCapacity) && d.seatCapacity < used) {
      warnings.push(`${d.label || d.id}: capacity ${d.seatCapacity} is below the ${used} seats already taken. New applications will go to the waitlist.`);
    }
  });
  return { errors, warnings };
}

export function canRemoveDeparture(usage: DepartureUsage, id: string): boolean {
  return (usage[id]?.applications ?? 0) === 0;
}
```
`src/lib/admin/promoAdmin.ts`:
```ts
import { isValidBirthDate, isValidPromoCodeFormat, normalizePromoCode } from '@unik/shared/domain';
import type { DiscountType, PromoCode } from '@unik/shared/domain';
import { parseAmount } from './edits';

export interface PromoForm {
  code: string;
  agencyName: string;
  contactName: string;
  contactInfo: string;
  discountType: DiscountType;
  discountValue: string;
  validUntil: string;
  maxPax: string;
  active: boolean;
  notes: string;
}

export function emptyPromoForm(): PromoForm {
  return { code: '', agencyName: '', contactName: '', contactInfo: '', discountType: 'fixed', discountValue: '', validUntil: '', maxPax: '', active: true, notes: '' };
}

export function promoToForm(p: PromoCode): PromoForm {
  return {
    code: p.code,
    agencyName: p.agencyName,
    contactName: p.contactName ?? '',
    contactInfo: p.contactInfo ?? '',
    discountType: p.discountType,
    discountValue: String(p.discountValue),
    validUntil: p.validUntil ?? '',
    maxPax: p.maxPax === null ? '' : String(p.maxPax),
    active: p.active,
    notes: p.notes ?? '',
  };
}

function discountNumber(f: PromoForm): number | null {
  const raw = f.discountValue.trim();
  if (raw === '0' && f.discountType === 'fixed') return 0;
  return parseAmount(raw);
}

export function validatePromoForm(f: PromoForm, opts: { isNew: boolean; existingCodes: string[] }): Record<string, string> {
  const e: Record<string, string> = {};
  const code = normalizePromoCode(f.code);
  if (opts.isNew) {
    if (!isValidPromoCodeFormat(code)) e.code = 'Use A–Z, 0–9 and hyphens (3–20 characters).';
    else if (opts.existingCodes.includes(code)) e.code = 'This code already exists.';
  }
  if (!f.agencyName.trim() || f.agencyName.trim().length > 100) e.agencyName = 'Required (max 100 characters).';
  const v = discountNumber(f);
  if (f.discountType === 'percent') {
    if (v === null || v < 1 || v > 100) e.discountValue = 'Whole percent from 1 to 100.';
  } else if (v === null || v > 1_000_000) {
    e.discountValue = 'Whole pesos from 0 to 1,000,000.';
  }
  // 날짜 유효성은 생년월일 검증기를 재사용(형식·실존 날짜), 범위는 넉넉히
  if (f.validUntil.trim() && !isValidBirthDate(f.validUntil.trim(), '2100-12-31')) e.validUntil = 'Use a real date (YYYY-MM-DD).';
  if (f.maxPax.trim()) {
    const n = parseAmount(f.maxPax);
    if (n === null) e.maxPax = 'Whole number, 1 or more.';
  }
  return e;
}

export function toPromoDoc(f: PromoForm): Omit<PromoCode, 'code'> {
  return {
    agencyName: f.agencyName.trim(),
    contactName: f.contactName.trim(),
    contactInfo: f.contactInfo.trim(),
    discountType: f.discountType,
    discountValue: discountNumber(f) ?? 0,
    validUntil: f.validUntil.trim() || null,
    maxPax: f.maxPax.trim() ? parseAmount(f.maxPax) : null,
    active: f.active,
    notes: f.notes.trim(),
  };
}

export function referralLink(code: string): string {
  return `https://unik.ph/apply?code=${encodeURIComponent(code)}`;
}
```
- [ ] **Step 4:** `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `git add frontend/web/src/lib/admin && git commit -m "feat(admin): 상품 설정 검증·좌석 축소 경고, 프로모 코드 폼 검증·추천 링크"`

---

### Task 5: 어드민 서비스 · 메뉴 · 진입 리다이렉트 · Auth 에뮬레이터

**Files:**
- Create: `frontend/web/src/lib/services/admin/{applications,promoCodes,tourConfig}.ts`, `frontend/web/src/lib/admin/emulators.ts`
- Modify: `frontend/web/src/components/admin/Sidebar.tsx` (import·`menuItems` 만), `frontend/web/src/app/admin/(dashboard)/page.tsx`, `frontend/web/src/app/admin/(dashboard)/layout.tsx` 와 `frontend/web/src/app/admin/login/page.tsx` (각 파일 **맨 위 import 다음에 한 줄** `import '@/lib/admin/emulators';` 추가만), `firebase.json`

**Interfaces — Produces:**
- `subscribeApplications(cb: (apps: ApplicationRecord[]) => void, onError: (e: unknown) => void): () => void`
- `updateApplicationFields(id: string, fields: Record<string, unknown>): Promise<void>` (항상 `updatedAt: serverTimestamp()` 추가)
- `changeStatusTx(id: string, next: ApplicationStatus, by: string): Promise<void>` (트랜잭션: status + statusHistory 추가)
- `addPaymentTx(id: string, input: Omit<PaymentRecord,'id'|'recordedBy'>, by: string): Promise<{ suggestedStatus: ApplicationStatus | null }>` (트랜잭션)
- `removePaymentTx(id: string, paymentId: string): Promise<void>`
- `subscribePromoCodes(cb: (codes: PromoCode[]) => void, onError): () => void`, `createPromoCode(code: string, doc): Promise<void>` (이미 있으면 `Error('exists')`), `updatePromoCode(code, doc): Promise<void>`, `deletePromoCode(code): Promise<void>`
- `subscribeTourConfig(cb: (c: TourConfig | null) => void, onError): () => void`, `saveTourConfig(c: TourConfig, by: string): Promise<void>`, `subscribeAvailability(cb: (a: Availability | null) => void): () => void`

- [ ] **Step 1: 서비스**

`src/lib/services/admin/applications.ts`:
```ts
import { arrayUnion, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { ApplicationStatus } from '@unik/shared/domain';
import { fromApplicationDoc } from '@/lib/admin/applicationDoc';
import type { ApplicationRecord, PaymentRecord } from '@/lib/admin/applicationDoc';
import { applyPayment, withoutPayment } from '@/lib/admin/edits';

const col = () => collection(db, COLLECTIONS.applications);

export function subscribeApplications(cb: (apps: ApplicationRecord[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    query(col(), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => fromApplicationDoc(d.id, d.data()))),
    onError,
  );
}

/** 바꾼 필드만 쓴다. agreedToTermsAt 등 다른 필드는 건드리지 않는다. */
export async function updateApplicationFields(id: string, fields: Record<string, unknown>): Promise<void> {
  if ('agreedToTermsAt' in fields || 'createdAt' in fields || 'appNo' in fields) throw new Error('Protected field');
  await updateDoc(doc(col(), id), { ...fields, updatedAt: serverTimestamp() });
}

export async function changeStatusTx(id: string, next: ApplicationStatus, by: string): Promise<void> {
  await updateDoc(doc(col(), id), {
    status: next,
    statusHistory: arrayUnion({ status: next, at: new Date(), by }),
    updatedAt: serverTimestamp(),
  });
}

export async function addPaymentTx(
  id: string,
  input: Omit<PaymentRecord, 'id' | 'recordedBy'>,
  by: string,
): Promise<{ suggestedStatus: ApplicationStatus | null }> {
  return runTransaction(db, async (tx) => {
    const ref = doc(col(), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');
    const app = fromApplicationDoc(snap.id, snap.data());
    const payment: PaymentRecord = { ...input, id: crypto.randomUUID(), recordedBy: by };
    const { payments, paidTotal, suggestedStatus } = applyPayment(app, payment);
    tx.update(ref, { payments: payments.map(stripUndefinedPayment), paidTotal, updatedAt: serverTimestamp() });
    return { suggestedStatus };
  });
}

export async function removePaymentTx(id: string, paymentId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(col(), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Application not found');
    const { payments, paidTotal } = withoutPayment(fromApplicationDoc(snap.id, snap.data()), paymentId);
    tx.update(ref, { payments: payments.map(stripUndefinedPayment), paidTotal, updatedAt: serverTimestamp() });
  });
}

function stripUndefinedPayment(p: PaymentRecord): Record<string, unknown> {
  const { reference, ...rest } = p;
  return reference ? { ...rest, reference } : rest;
}
```
(`changeStatusTx` 는 `arrayUnion` 으로 이력이 동시 편집에도 유실되지 않는다 — 이름은 서비스 일관성을 위해 Tx 접미사를 유지.)

`src/lib/services/admin/promoCodes.ts`:
```ts
import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { PromoCode } from '@unik/shared/domain';

const col = () => collection(db, COLLECTIONS.promoCodes);

export function subscribePromoCodes(cb: (codes: PromoCode[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    col(),
    (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Omit<PromoCode, 'code'>), code: d.id })).sort((a, b) => a.code.localeCompare(b.code))),
    onError,
  );
}

export async function createPromoCode(code: string, data: Omit<PromoCode, 'code'>, by: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(col(), code);
    if ((await tx.get(ref)).exists()) throw new Error('exists');
    tx.set(ref, { ...data, createdAt: serverTimestamp(), createdBy: by });
  });
}

export async function updatePromoCode(code: string, data: Omit<PromoCode, 'code'>): Promise<void> {
  await updateDoc(doc(col(), code), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePromoCode(code: string): Promise<void> {
  await deleteDoc(doc(col(), code));
}
```
`src/lib/services/admin/tourConfig.ts`:
```ts
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, TOUR_ID } from '@unik/shared/firebase/config';
import type { Availability, TourConfig } from '@unik/shared/domain';

export function subscribeTourConfig(cb: (c: TourConfig | null) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(doc(db, COLLECTIONS.tourConfig, TOUR_ID), (s) => cb(s.exists() ? (s.data() as TourConfig) : null), onError);
}

export async function saveTourConfig(c: TourConfig, by: string): Promise<void> {
  const clean: TourConfig = {
    ...c,
    mayaPaymentLinkBase: c.mayaPaymentLinkBase?.trim() ? c.mayaPaymentLinkBase.trim() : null,
    notifyEmails: c.notifyEmails.map((e) => e.trim().toLowerCase()).filter(Boolean),
    departures: c.departures.map((d) => ({ ...d, label: d.label.trim(), flightInfo: d.flightInfo.trim() })),
  };
  await setDoc(doc(db, COLLECTIONS.tourConfig, TOUR_ID), { ...clean, updatedAt: serverTimestamp(), updatedBy: by });
}

export function subscribeAvailability(cb: (a: Availability | null) => void): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.availability, TOUR_ID),
    (s) => cb(s.exists() ? (s.data() as Availability) : null),
    () => cb(null),
  );
}
```
- [ ] **Step 2: Auth 에뮬레이터 연결(로컬 E2E 용)**

`src/lib/admin/emulators.ts`:
```ts
// 로컬 E2E 전용: NEXT_PUBLIC_USE_AUTH_EMULATOR=true 일 때 Auth 를 에뮬레이터에 연결한다.
// lib/firebase.ts(명함 보호)는 건드리지 않고, 어드민 진입 모듈에서 부작용 import 로 쓴다.
import { connectAuthEmulator } from 'firebase/auth';
import { auth } from '@/lib/firebase';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
  const w = window as Window & { __authEmulatorConnected?: boolean };
  if (!w.__authEmulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    w.__authEmulatorConnected = true;
  }
}

export {};
```
`admin/(dashboard)/layout.tsx` 와 `admin/login/page.tsx` 의 기존 import 목록 마지막에 `import '@/lib/admin/emulators';` 한 줄씩 추가(그 외 변경 금지).
`firebase.json` 의 `emulators` 에 `"auth": { "port": 9099 }` 추가.

- [ ] **Step 3: 메뉴·진입**

`Sidebar.tsx` import 줄과 `menuItems` 교체:
```tsx
import { LogOut, Menu, X, Home, IdCard, Users, Ticket, Settings } from 'lucide-react';
```
```tsx
const menuItems = [
  { href: '/admin/applicants', icon: Users, label: 'Applicants' },
  { href: '/admin/promo-codes', icon: Ticket, label: 'Promo codes' },
  { href: '/admin/tour-settings', icon: Settings, label: 'Tour settings' },
  { href: '/admin/business-cards', icon: IdCard, label: 'Business Cards' },
];
```
`admin/(dashboard)/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/applicants');
}
```
- [ ] **Step 4:** `pnpm --filter @unik/web exec tsc --noEmit && pnpm --filter @unik/web test && pnpm --filter @unik/web build` → 성공(페이지가 아직 없어 `/admin/applicants` 등은 404 — Task 6~9 에서 생성).
- [ ] **Step 5: Commit** `git add -A frontend/web/src firebase.json && git commit -m "feat(admin): 신청서·프로모·상품 설정 서비스(트랜잭션 결제), 메뉴, Auth 에뮬레이터 연결"`

---

### Task 6: 상품 설정 페이지

**Files:** Create `frontend/web/src/app/admin/(dashboard)/tour-settings/page.tsx`

**Interfaces — Consumes:** Task 4 `defaultTourConfig`, `newDeparture`, `validateTourConfig`, `canRemoveDeparture`, `DepartureUsage`; Task 5 `subscribeTourConfig`, `saveTourConfig`, `subscribeAvailability`, `subscribeApplications`; `getCurrentUser()` (`@/lib/auth`, 읽기만); `parseAmount`.

- [ ] **Step 1: 페이지 구현** — 요구사항(코드는 아래 골격을 그대로 사용):
  - 상단: 제목 "Tour settings", 저장 버튼(`admin-btn-primary`), 저장 성공/실패 메시지, 문서가 없으면 "Not set up yet — fill in and save." 안내 후 `defaultTourConfig()` 로 시작.
  - 섹션 "Applications": `acceptingApplications` 토글(체크박스, 라벨 "Accepting applications on the website"), `depositPerPax`, `bibQuota.total`(옆에 "bibs used X / total" — availability), `mayaPaymentLinkBase`, `notifyEmails`(쉼표 또는 줄바꿈 구분 textarea).
  - 섹션 "Departures": 각 출발편 카드 — id(새 카드에서만 편집 가능, 저장된 id 는 읽기 전용), label, departDate, returnDate(`type="date"`), flightInfo(textarea), seatCapacity(옆에 "seats used X / capacity"), isOpen 체크박스, prices.full/tenK/companion, singleSupplement. 숫자 입력은 `inputMode="numeric"` 텍스트 + `parseAmount`(0 허용: 빈칸/`0` → 0).
  - "Remove" 버튼: `canRemoveDeparture` 가 false 면 비활성 + 툴팁 "Has applications — close it instead (untick Open)."
  - "Add departure" 버튼.
  - 저장: `validateTourConfig(config, usage)` → errors 가 있으면 저장 안 하고 해당 필드 아래 빨간 문구, warnings 는 `confirm()` 로 확인 후 저장.
  - usage: applications 구독에서 `cancelled`·`waitlist` 를 뺀 신청의 출발편별 좌석 합(`totalPax`)과 신청 수(모든 미취소 신청).
```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { formatPHP, totalPax } from '@unik/shared/domain';
import type { Availability, Departure, TourConfig } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { parseAmount } from '@/lib/admin/edits';
import { canRemoveDeparture, defaultTourConfig, newDeparture, validateTourConfig } from '@/lib/admin/tourSettings';
import type { DepartureUsage } from '@/lib/admin/tourSettings';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { saveTourConfig, subscribeAvailability, subscribeTourConfig } from '@/lib/services/admin/tourConfig';

const num = (raw: string): number => (raw.trim() === '' || raw.trim() === '0' ? 0 : parseAmount(raw) ?? NaN);

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

export default function TourSettingsPage() {
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [exists, setExists] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const offConfig = subscribeTourConfig(
      (c) => {
        // 편집 중 덮어쓰지 않도록 최초 1회만 채운다
        setConfig((prev) => prev ?? c ?? defaultTourConfig());
        setExists(c !== null);
        setSavedIds(c?.departures.map((d) => d.id) ?? []);
      },
      () => setLoadError('Could not load tour settings.'),
    );
    const offApps = subscribeApplications(setApps, () => setLoadError('Could not load applications.'));
    const offAv = subscribeAvailability(setAvailability);
    return () => {
      offConfig();
      offApps();
      offAv();
    };
  }, []);

  const usage: DepartureUsage = useMemo(() => {
    const u: DepartureUsage = {};
    for (const a of apps) {
      if (a.status === 'cancelled') continue;
      const e = (u[a.departure.id] ??= { seatsUsed: 0, applications: 0 });
      e.applications += 1;
      if (a.status !== 'waitlist') e.seatsUsed += totalPax(a.counts);
    }
    return u;
  }, [apps]);

  if (loadError) return <p className="admin-card p-6 text-red-600">{loadError}</p>;
  if (!config) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;

  const setDep = (i: number, patch: Partial<Departure>) =>
    setConfig({ ...config, departures: config.departures.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  async function save() {
    if (!config) return;
    const { errors: found, warnings } = validateTourConfig(config, usage);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Please fix the highlighted fields.');
      return;
    }
    if (warnings.length > 0 && !window.confirm(`${warnings.join('\n')}\n\nSave anyway?`)) return;
    setSaving(true);
    setMessage('');
    try {
      await saveTourConfig(config, getCurrentUser()?.email ?? 'unknown');
      setSavedIds(config.departures.map((d) => d.id));
      setExists(true);
      setMessage('Saved.');
    } catch (e) {
      console.error(e);
      setMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Tour settings</h1>
        <div className="flex items-center gap-3">
          {message ? <span role="status" className="text-sm font-semibold text-slate-600">{message}</span> : null}
          <button type="button" onClick={() => void save()} disabled={saving} className="admin-btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
      {!exists ? <p className="admin-card p-4 text-sm text-amber-800">Not set up yet — fill in and save.</p> : null}

      <section className="admin-card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-slate-900 sm:col-span-2">Applications</h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5" checked={config.acceptingApplications} onChange={(e) => setConfig({ ...config, acceptingApplications: e.target.checked })} />
          Accepting applications on the website
        </label>
        <Field label="Deposit per traveler (PHP)" error={errors.depositPerPax}>
          <input className="admin-input" inputMode="numeric" value={String(config.depositPerPax)} onChange={(e) => setConfig({ ...config, depositPerPax: num(e.target.value) })} />
        </Field>
        <Field label={`Race bibs (used ${availability?.bibsUsed ?? 0})`} error={errors['bibQuota.total']}>
          <input className="admin-input" inputMode="numeric" value={String(config.bibQuota.total)} onChange={(e) => setConfig({ ...config, bibQuota: { total: num(e.target.value) } })} />
        </Field>
        <Field label="Maya payment link (optional)" error={errors.mayaPaymentLinkBase}>
          <input className="admin-input" placeholder="https://mymaya.me/yourstore" value={config.mayaPaymentLinkBase ?? ''} onChange={(e) => setConfig({ ...config, mayaPaymentLinkBase: e.target.value })} />
        </Field>
        <Field label="Staff notification emails (one per line)" error={errors.notifyEmails}>
          <textarea className="admin-input" rows={3} value={config.notifyEmails.join('\n')} onChange={(e) => setConfig({ ...config, notifyEmails: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) })} />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Departures</h2>
          <button type="button" className="admin-btn-secondary" onClick={() => setConfig({ ...config, departures: [...config.departures, newDeparture()] })}>
            <Plus className="h-4 w-4" /> Add departure
          </button>
        </div>
        {config.departures.map((d, i) => {
          const p = `departures.${i}`;
          const locked = savedIds.includes(d.id) && d.id !== '';
          const removable = canRemoveDeparture(usage, d.id);
          return (
            <div key={i} className="admin-card grid gap-4 p-6 sm:grid-cols-3">
              <Field label="ID" error={errors[`${p}.id`]}>
                <input className="admin-input" value={d.id} readOnly={locked} onChange={(e) => setDep(i, { id: e.target.value.trim().toLowerCase() })} />
              </Field>
              <Field label="Label" error={errors[`${p}.label`]}>
                <input className="admin-input" value={d.label} onChange={(e) => setDep(i, { label: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-800">
                <input type="checkbox" className="h-5 w-5" checked={d.isOpen} onChange={(e) => setDep(i, { isOpen: e.target.checked })} /> Open for applications
              </label>
              <Field label="Depart" error={errors[`${p}.departDate`]}>
                <input type="date" className="admin-input" value={d.departDate} onChange={(e) => setDep(i, { departDate: e.target.value })} />
              </Field>
              <Field label="Return" error={errors[`${p}.returnDate`]}>
                <input type="date" className="admin-input" value={d.returnDate} onChange={(e) => setDep(i, { returnDate: e.target.value })} />
              </Field>
              <Field label={`Seats (taken ${usage[d.id]?.seatsUsed ?? 0})`} error={errors[`${p}.seatCapacity`]}>
                <input className="admin-input" inputMode="numeric" value={String(d.seatCapacity)} onChange={(e) => setDep(i, { seatCapacity: num(e.target.value) })} />
              </Field>
              {(['full', 'tenK', 'companion'] as const).map((k) => (
                <Field key={k} label={`${k === 'full' ? 'Full marathon' : k === 'tenK' ? '10K' : 'Companion'} price (PHP)`} error={errors[`${p}.prices.${k}`]}>
                  <input className="admin-input" inputMode="numeric" value={String(d.prices[k])} onChange={(e) => setDep(i, { prices: { ...d.prices, [k]: num(e.target.value) } })} />
                </Field>
              ))}
              <Field label="Single room supplement (PHP)" error={errors[`${p}.singleSupplement`]}>
                <input className="admin-input" inputMode="numeric" value={String(d.singleSupplement)} onChange={(e) => setDep(i, { singleSupplement: num(e.target.value) })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Flight info (shown on the Tour page)">
                  <textarea className="admin-input" rows={2} value={d.flightInfo} onChange={(e) => setDep(i, { flightInfo: e.target.value })} />
                </Field>
              </div>
              <div className="flex items-end justify-between gap-3 sm:col-span-3">
                <p className="text-xs text-slate-500">
                  Prices: {formatPHP(Number.isFinite(d.prices.full) ? d.prices.full : 0)} / {formatPHP(Number.isFinite(d.prices.tenK) ? d.prices.tenK : 0)} / {formatPHP(Number.isFinite(d.prices.companion) ? d.prices.companion : 0)}
                </p>
                <button
                  type="button"
                  className="admin-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!removable}
                  title={removable ? 'Remove departure' : 'Has applications — close it instead (untick Open).'}
                  onClick={() => setConfig({ ...config, departures: config.departures.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
```
(`num()` 은 잘못된 입력을 `NaN` 으로 두어 `validateTourConfig` 가 오류로 표시하게 한다. 입력칸은 `String(NaN)` → "NaN" 이 보이므로, 사용자가 다시 고치면 사라진다 — 허용.)
- [ ] **Step 2:** `tsc`, `test`, `build` → 성공. (화면 확인은 Task 10 E2E.)
- [ ] **Step 3: Commit** `git add frontend/web/src/app/admin && git commit -m "feat(admin): 상품 설정 페이지(접수 on/off, 예약금, 배번, 출발편 CRUD, 사용 현황)"`

---

### Task 7: 프로모 코드 페이지

**Files:** Create `frontend/web/src/app/admin/(dashboard)/promo-codes/page.tsx`

**Interfaces — Consumes:** Task 2 `promoStats`, Task 4 `PromoForm`·`emptyPromoForm`·`promoToForm`·`validatePromoForm`·`toPromoDoc`·`referralLink`, Task 5 promo/applications 서비스, domain `describeDiscount`, `formatPHP`, `normalizePromoCode`.

- [ ] **Step 1: 페이지 구현** — 시안 `AdminPromo.dc.html` 구조. 요구사항:
  - KPI 4개: Active codes(active), Applications via agencies(프로모 있는 미취소 신청 수 / 전체 미취소), Travelers via agencies, Discounts given(확정 상태 합).
  - 표: Code, Travel agency(+contact), Discount(`describeDiscount`), Valid until(없으면 "No expiry"), Apps, Pax, Confirmed pax, Net sales PHP, Status(Active/Paused 배지), 행 동작 "Copy link"(클립보드에 `referralLink`; 복사 후 "Copied" 2초), "Edit".
  - 오른쪽(좁은 화면은 아래) 폼 패널: 새 코드/편집 겸용. 편집 시 code 읽기 전용. 필드: code, agency name, contact person, contact info, discount type(라디오 fixed/percent), value, valid until(date), max travelers, active 체크, notes. 미리보기: 추천 링크.
  - 저장: `validatePromoForm` → 오류 표시. 새 코드는 `createPromoCode(normalizePromoCode(code), toPromoDoc(f), email)`; `Error('exists')` 면 code 오류 "This code already exists.". 편집은 `updatePromoCode`. 편집 중 할인 변경 시 안내문 "Changes apply to new applications only."
  - 삭제: 해당 코드 `promoStats` 신청 0 이고 취소 신청에도 쓰인 적 없을 때만 버튼 표시(모든 신청서에서 `pricing.promo.code === code` 0건), `confirm()` 후 `deletePromoCode`. 사용된 코드는 버튼 대신 "Pause instead" 안내.
```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { describeDiscount, formatPHP, normalizePromoCode } from '@unik/shared/domain';
import type { PromoCode } from '@unik/shared/domain';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { CONFIRMED_STATUSES, promoStats } from '@/lib/admin/list';
import { emptyPromoForm, promoToForm, referralLink, toPromoDoc, validatePromoForm } from '@/lib/admin/promoAdmin';
import type { PromoForm } from '@/lib/admin/promoAdmin';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { createPromoCode, deletePromoCode, subscribePromoCodes, updatePromoCode } from '@/lib/services/admin/promoCodes';

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [form, setForm] = useState<PromoForm>(emptyPromoForm());
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const off1 = subscribePromoCodes(setCodes, () => setLoadError('Could not load promo codes.'));
    const off2 = subscribeApplications(setApps, () => setLoadError('Could not load applications.'));
    return () => {
      off1();
      off2();
    };
  }, []);

  const stats = useMemo(() => promoStats(apps), [apps]);
  const everUsed = useMemo(() => new Set(apps.map((a) => a.pricing.promo?.code).filter(Boolean) as string[]), [apps]);
  const active = apps.filter((a) => a.status !== 'cancelled');
  const viaAgency = active.filter((a) => a.pricing.promo);

  if (loadError) return <p className="admin-card p-6 text-red-600">{loadError}</p>;
  if (!codes) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() {
    setEditing(null);
    setForm(emptyPromoForm());
    setErrors({});
    setMessage('');
  }

  function startEdit(p: PromoCode) {
    setEditing(p.code);
    setForm(promoToForm(p));
    setErrors({});
    setMessage('');
  }

  async function save() {
    const found = validatePromoForm(form, { isNew: editing === null, existingCodes: codes!.map((c) => c.code) });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      if (editing === null) {
        const code = normalizePromoCode(form.code);
        await createPromoCode(code, toPromoDoc(form), getCurrentUser()?.email ?? 'unknown');
        setMessage(`Created ${code}.`);
        setEditing(code);
        setForm((f) => ({ ...f, code }));
      } else {
        await updatePromoCode(editing, toPromoDoc(form));
        setMessage('Saved. Changes apply to new applications only.');
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'exists') setErrors({ code: 'This code already exists.' });
      else {
        console.error(e);
        setMessage('Save failed. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(referralLink(code));
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copy this link:', referralLink(code));
    }
  }

  async function remove(code: string) {
    if (!window.confirm(`Delete promo code ${code}? This cannot be undone.`)) return;
    await deletePromoCode(code);
    if (editing === code) startNew();
  }

  const kpis = [
    ['Active codes', String(codes.filter((c) => c.active).length)],
    ['Applications via agencies', `${viaAgency.length} of ${active.length}`],
    ['Travelers via agencies', String(Object.values(stats).reduce((s, x) => s + x.pax, 0))],
    ['Discounts given (confirmed)', formatPHP(viaAgency.filter((a) => CONFIRMED_STATUSES.includes(a.status)).reduce((s, a) => s + (a.pricing.promo?.discountTotal ?? 0), 0))],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Promo codes</h1>
        <button type="button" className="admin-btn-primary" onClick={startNew}><Plus className="h-4 w-4" /> New code</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="admin-card p-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="admin-card min-w-0 flex-[999_1_640px] overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                {['Code', 'Travel agency', 'Discount', 'Valid until', 'Apps', 'Pax', 'Confirmed pax', 'Net sales', 'Status', ''].map((h) => (
                  <th key={h} className="admin-table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={10} className="admin-table-cell text-slate-500">No promo codes yet.</td></tr>
              ) : null}
              {codes.map((c) => {
                const s = stats[c.code];
                return (
                  <tr key={c.code} className="border-t border-slate-100">
                    <td className="admin-table-cell font-bold">{c.code}</td>
                    <td className="admin-table-cell"><div className="font-semibold">{c.agencyName}</div><div className="text-xs text-slate-500">{[c.contactName, c.contactInfo].filter(Boolean).join(' · ')}</div></td>
                    <td className="admin-table-cell">{describeDiscount(c.discountType, c.discountValue)}</td>
                    <td className="admin-table-cell">{c.validUntil ?? 'No expiry'}</td>
                    <td className="admin-table-cell">{s?.applications ?? 0}</td>
                    <td className="admin-table-cell">{s?.pax ?? 0}{c.maxPax !== null ? ` / ${c.maxPax}` : ''}</td>
                    <td className="admin-table-cell font-semibold">{s?.confirmedPax ?? 0}</td>
                    <td className="admin-table-cell">{formatPHP(s?.netSales ?? 0)}</td>
                    <td className="admin-table-cell"><span className={`admin-badge ${c.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{c.active ? 'Active' : 'Paused'}</span></td>
                    <td className="admin-table-cell">
                      <div className="flex gap-2">
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => void copy(c.code)} aria-label={`Copy referral link for ${c.code}`}>
                          {copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === c.code ? 'Copied' : 'Copy link'}
                        </button>
                        <button type="button" className="admin-btn-secondary !px-3 !py-1.5 text-xs" onClick={() => startEdit(c)} aria-label={`Edit ${c.code}`}><Pencil className="h-4 w-4" /></button>
                        {!everUsed.has(c.code) ? (
                          <button type="button" className="admin-btn-danger !px-3 !py-1.5 text-xs" onClick={() => void remove(c.code)} aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form
          className="admin-card flex min-w-0 flex-[1_1_320px] flex-col gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${editing}` : 'New promo code'}</h2>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Code
            <input className="admin-input font-bold uppercase" value={form.code} readOnly={editing !== null} onChange={(e) => set('code', e.target.value)} />
            {errors.code ? <span className="text-xs font-semibold text-red-600">{errors.code}</span> : null}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Travel agency name
            <input className="admin-input" value={form.agencyName} onChange={(e) => set('agencyName', e.target.value)} />
            {errors.agencyName ? <span className="text-xs font-semibold text-red-600">{errors.agencyName}</span> : null}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Contact person<input className="admin-input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Phone / email<input className="admin-input" value={form.contactInfo} onChange={(e) => set('contactInfo', e.target.value)} /></label>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700">Discount</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'fixed'} onChange={() => set('discountType', 'fixed')} /> Fixed PHP per person</label>
              <label className="flex items-center gap-2"><input type="radio" name="dtype" checked={form.discountType === 'percent'} onChange={() => set('discountType', 'percent')} /> Percent</label>
            </div>
            <input aria-label="Discount amount" className="admin-input" inputMode="numeric" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} />
            {errors.discountValue ? <span className="text-xs font-semibold text-red-600">{errors.discountValue}</span> : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Valid until
              <input type="date" className="admin-input" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
              {errors.validUntil ? <span className="text-xs font-semibold text-red-600">{errors.validUntil}</span> : null}
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Max travelers
              <input className="admin-input" inputMode="numeric" placeholder="No limit" value={form.maxPax} onChange={(e) => set('maxPax', e.target.value)} />
              {errors.maxPax ? <span className="text-xs font-semibold text-red-600">{errors.maxPax}</span> : null}
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active</label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Notes<textarea className="admin-input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
          {form.code.trim() ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs"><span className="font-semibold text-slate-500">Referral link: </span><span className="break-all font-bold text-slate-900">{referralLink(normalizePromoCode(form.code))}</span></p>
          ) : null}
          {editing && everUsed.has(editing) ? <p className="text-xs text-slate-500">This code has been used, so it can't be deleted. Untick Active to pause it.</p> : null}
          {message ? <p role="status" className="text-sm font-semibold text-slate-700">{message}</p> : null}
          <button type="submit" disabled={saving} className="admin-btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save changes' : 'Create code'}</button>
        </form>
      </div>
    </div>
  );
}
```
- [ ] **Step 2:** `tsc`, `test`, `build` → 성공.
- [ ] **Step 3: Commit** `git add frontend/web/src/app/admin && git commit -m "feat(admin): 프로모 코드 관리(생성·수정·일시중지·미사용 삭제, TA 실적, 추천 링크 복사)"`

---

### Task 8: 신청자 목록 페이지

**Files:** Create `frontend/web/src/app/admin/(dashboard)/applicants/page.tsx`, `ApplicantsList.tsx`

**Interfaces — Consumes:** Task 2 (`filterApplications`, `statusCounts`, `computeKpis`, `DEFAULT_FILTERS`, `applicationsCsv`, `travelersCsv`, `downloadCsv`, `STATUS_LABELS`, `STATUS_BADGE`, `formatManila`), Task 5 서비스. **Produces:** `ApplicantsList` props `{ apps: ApplicationRecord[]; selectedId: string | null; onSelect(id: string): void }`; 페이지가 `?id=` 를 읽어 Task 9 `ApplicantDetail` 에 넘긴다.

- [ ] **Step 1: 페이지 셸** — `applicants/page.tsx`:
```tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { subscribeApplications } from '@/lib/services/admin/applications';
import { subscribeTourConfig } from '@/lib/services/admin/tourConfig';
import { ApplicantsList } from './ApplicantsList';
import { ApplicantDetail } from './ApplicantDetail';

function ApplicantsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('id');
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const off1 = subscribeApplications(setApps, () => setError('Could not load applications. Check your connection and refresh.'));
    const off2 = subscribeTourConfig(setConfig, () => undefined);
    return () => {
      off1();
      off2();
    };
  }, []);

  if (error) return <p className="admin-card p-6 text-red-600">{error}</p>;
  if (!apps) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;

  const selected = selectedId ? apps.find((a) => a.id === selectedId) ?? null : null;
  const select = (id: string | null) => router.replace(id ? `/admin/applicants?id=${encodeURIComponent(id)}` : '/admin/applicants', { scroll: false });

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_720px]">
        <ApplicantsList apps={apps} config={config} selectedId={selectedId} onSelect={select} />
      </div>
      {selectedId ? (
        <div className="min-w-0 flex-[1_1_380px] xl:sticky xl:top-6">
          {selected ? (
            <ApplicantDetail app={selected} config={config} onClose={() => select(null)} />
          ) : (
            <p className="admin-card p-6 text-sm text-slate-600">Application not found. It may have been removed from this list.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-slate-400" />}>
      <ApplicantsPageInner />
    </Suspense>
  );
}
```
(`ApplicantsList` 는 `config` 도 받아 출발편 필터 옵션을 만든다 — Interfaces 의 props 에 `config: TourConfig | null` 포함.)

- [ ] **Step 2: 목록 컴포넌트** — `applicants/ApplicantsList.tsx` 요구사항(시안 `AdminApplicants.dc.html`):
  - 제목 "Applicants", 버튼 2개 "Export applications (CSV)", "Export travelers (CSV)" → 현재 **필터 적용된** 목록으로 `downloadCsv('applications-YYYY-MM-DD.csv', applicationsCsv(filtered))` / `travelers-…`.
  - KPI 4개(`computeKpis`, 전체 기준): Applications, Travelers(아래 `F · 10K · C` 내역), Confirmed travelers(`of N bibs`는 config 있으면 `bibQuota.total`), Missing traveler info.
  - 상태 탭: All + 7 상태, 각 건수(`statusCounts`), 선택 탭 강조, `aria-pressed`.
  - 필터: Departure select(config 출발편 + 신청서에만 남은 출발편 id 도 포함), Promo select(All / Direct / 신청서에 등장한 코드들), "Missing info only" 체크, 검색창("Search name, email, phone, app no.").
  - 표(가로 스크롤 박스, `min-w-[900px]`): App no., Lead(이름 + 마닐라 신청시각), Dep., Pax(`F/10K/C`), Promo, Total(`formatPHP`), Paid(`formatPHP(paidTotal)`), Info(`filled/total`, 미완료 주황·완료 초록), Status(배지). 행 전체가 버튼 역할: `<tr>` 안 첫 칸에 `<button onClick={() => onSelect(a.id)}>` (App no. 텍스트)로 키보드 접근, 행 클릭도 선택. 선택 행 배경 강조.
  - 결과 0건: "No applications match these filters."
```tsx
'use client';

import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { APPLICATION_STATUSES, formatPHP } from '@unik/shared/domain';
import type { ApplicationStatus, TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';
import { applicationsCsv, downloadCsv, travelersCsv } from '@/lib/admin/csv';
import { STATUS_BADGE, STATUS_LABELS, formatManila } from '@/lib/admin/format';
import { DEFAULT_FILTERS, computeKpis, filterApplications, statusCounts } from '@/lib/admin/list';
import type { ListFilters } from '@/lib/admin/list';

export function ApplicantsList({
  apps,
  config,
  selectedId,
  onSelect,
}: {
  apps: ApplicationRecord[];
  config: TourConfig | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [filters, setFilters] = useState<ListFilters>(DEFAULT_FILTERS);
  const filtered = useMemo(() => filterApplications(apps, filters), [apps, filters]);
  const counts = useMemo(() => statusCounts(apps), [apps]);
  const kpi = useMemo(() => computeKpis(apps), [apps]);
  const departureOptions = useMemo(() => {
    const m = new Map<string, string>();
    config?.departures.forEach((d) => m.set(d.id, d.label));
    apps.forEach((a) => m.has(a.departure.id) || m.set(a.departure.id, a.departure.label || a.departure.id));
    return [...m.entries()];
  }, [apps, config]);
  const promoOptions = useMemo(() => [...new Set(apps.map((a) => a.pricing.promo?.code).filter(Boolean) as string[])].sort(), [apps]);
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const set = <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const kpis: [string, string, string?][] = [
    ['Applications', String(kpi.applications)],
    ['Travelers', String(kpi.travelers), `${kpi.byCategory.full} Full · ${kpi.byCategory.tenK} 10K · ${kpi.byCategory.companion} Companion`],
    ['Confirmed travelers', String(kpi.confirmedTravelers), config ? `of ${config.bibQuota.total} bibs` : undefined],
    ['Missing traveler info', String(kpi.incomplete), 'applications need follow-up'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn-secondary" onClick={() => downloadCsv(`applications-${today}.csv`, applicationsCsv(filtered))}><Download className="h-4 w-4" /> Export applications (CSV)</button>
          <button type="button" className="admin-btn-secondary" onClick={() => downloadCsv(`travelers-${today}.csv`, travelersCsv(filtered))}><Download className="h-4 w-4" /> Export travelers (CSV)</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <div key={label} className="admin-card p-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`text-2xl font-bold ${label === 'Missing traveler info' && kpi.incomplete > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
            {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Status filter">
        {(['all', ...APPLICATION_STATUSES] as (ApplicationStatus | 'all')[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filters.status === s}
            onClick={() => set('status', s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${filters.status === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]} {counts[s]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">Departure
          <select className="admin-input !w-auto !py-1.5" value={filters.departureId} onChange={(e) => set('departureId', e.target.value)}>
            <option value="all">All</option>
            {departureOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">Promo
          <select className="admin-input !w-auto !py-1.5" value={filters.promo} onChange={(e) => set('promo', e.target.value)}>
            <option value="all">All</option>
            <option value="direct">Direct (no code)</option>
            {promoOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="h-4 w-4" checked={filters.incompleteOnly} onChange={(e) => set('incompleteOnly', e.target.checked)} /> Missing info only</label>
        <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" aria-label="Search applicants" placeholder="Search name, email, phone, app no." className="admin-input !pl-9 !py-1.5" value={filters.search} onChange={(e) => set('search', e.target.value)} />
        </div>
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>{['App no.', 'Lead', 'Dep.', 'Pax F/10K/C', 'Promo', 'Total', 'Paid', 'Info', 'Status'].map((h) => <th key={h} className="admin-table-header">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={9} className="admin-table-cell text-slate-500">No applications match these filters.</td></tr> : null}
            {filtered.map((a) => {
              const complete = a.completeness.filled >= a.completeness.total;
              return (
                <tr key={a.id} onClick={() => onSelect(a.id)} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selectedId === a.id ? 'bg-blue-50' : ''}`}>
                  <td className="admin-table-cell"><button type="button" className="font-bold text-slate-900 underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); onSelect(a.id); }}>{a.appNo}</button></td>
                  <td className="admin-table-cell"><div className="font-semibold">{a.lead.firstName} {a.lead.lastName}</div><div className="text-xs text-slate-500">{formatManila(a.createdAt)}</div></td>
                  <td className="admin-table-cell">{a.departure.id.toUpperCase()}</td>
                  <td className="admin-table-cell">{a.counts.full} / {a.counts.tenK} / {a.counts.companion}</td>
                  <td className="admin-table-cell">{a.pricing.promo?.code ?? 'Direct'}</td>
                  <td className="admin-table-cell">{formatPHP(a.pricing.total)}</td>
                  <td className="admin-table-cell">{formatPHP(a.paidTotal)}</td>
                  <td className={`admin-table-cell font-semibold ${complete ? 'text-green-700' : 'text-amber-700'}`}>{a.completeness.filled}/{a.completeness.total}</td>
                  <td className="admin-table-cell"><span className={`admin-badge ${STATUS_BADGE[a.status]}`}>{STATUS_LABELS[a.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```
- [ ] **Step 3:** Task 9 전에는 `ApplicantDetail` 이 없으므로, 이 Task 에서 임시 `applicants/ApplicantDetail.tsx` 를 만든다:
```tsx
'use client';

import type { TourConfig } from '@unik/shared/domain';
import type { ApplicationRecord } from '@/lib/admin/applicationDoc';

// Task 9 에서 전체 상세 패널로 교체한다.
export function ApplicantDetail({ app, onClose }: { app: ApplicationRecord; config: TourConfig | null; onClose: () => void }) {
  return (
    <div className="admin-card p-5">
      <button type="button" className="admin-btn-secondary" onClick={onClose}>Close</button>
      <p className="mt-3 font-bold">{app.appNo}</p>
    </div>
  );
}
```
- [ ] **Step 4:** `tsc`, `test`, `build` → 성공.
- [ ] **Step 5: Commit** `git add frontend/web/src/app/admin && git commit -m "feat(admin): 신청자 목록(상태 탭·필터·검색·KPI·CSV 2종)"`

---

### Task 9: 신청자 상세 패널

**Files:** Modify(전체 교체) `frontend/web/src/app/admin/(dashboard)/applicants/ApplicantDetail.tsx`

**Interfaces — Consumes:** Task 1 `whatsappLink`, `viberLink`, `mayaPaymentLink`; Task 2 `STATUS_LABELS`, `STATUS_BADGE`, `formatManila`; Task 3 `recalculate`, `parseAmount`, `statusChangeWarnings`, `normalizeLead`, `validateLead`, `validateTravelers`; Task 5 `updateApplicationFields`, `changeStatusTx`, `addPaymentTx`, `removePaymentTx`; `getCurrentUser`; domain `APPLICATION_STATUSES`, `CATEGORY_LABELS`, `TSHIRT_SIZES`, `PAYMENT_TYPES`, `PAYMENT_METHODS`, `formatPHP`, `describeCounts`, `missingFields`, `manilaDate`.

- [ ] **Step 1: 구현** — 섹션(위→아래), 각 섹션은 독립적으로 저장(다른 직원 편집을 덮지 않도록 바꾼 필드만 `updateApplicationFields`):
  1. **헤더**: `APP-xxxx · 이름`, 상태 배지, Close 버튼(`aria-label="Close"`), 신청시각(마닐라), 출발편 라벨·날짜, 프로모(`code · agency · −PHP x`) 또는 "Direct".
  2. **Status**: select(7 상태) + "Update" 버튼. 저장 전 `statusChangeWarnings` 가 있으면 `confirm()`. `changeStatusTx(app.id, next, email)`. 아래에 이력(최신순, `formatManila(at) · Label · by`).
  3. **Contact**: 보기 모드 — 이메일(`mailto:`), 전화(`tel:`), Viber/WhatsApp 체크된 채널만 링크 버튼(`viberLink`/`whatsappLink`, null 이면 숨김). "Edit" → 편집 폼(firstName, lastName, email, phoneDial, phoneNumber, viber, whatsapp) → `validateLead` 오류 표시 → `updateApplicationFields(id, { lead: normalizeLead(lead) })`.
  4. **Travelers**: 인원 카운터(Full/10K/Companion −/+) 변경 시 "Recalculate" 미리보기 박스: `recalculate(app, { counts }, config)` 결과의 새 총액·예약금과 기존 총액 비교, 오류면 문구, "Apply new counts" 버튼 → `updateApplicationFields(id, { counts, travelers, completeness, pricing })`. 정원 초과 여부는 서버가 강제하지 않으므로 안내문 "Staff changes are not limited by seats/bibs — check Tour settings usage."
     참가자 카드 목록(접이식): 카테고리, 빠진 항목(`missingFields`) 표시, 편집 필드(passportName, dob(date), gender(select), nationality, tshirtSize(러너만), expectedFinish(러너만), recentMarathon(러너만), room(select twin/single), emergencyContact). "Save travelers" → `validateTravelers(travelers, manilaDate(new Date()))` → 오류 표시 → `recalculate(app, { travelers }, config)` (방 변경 시 싱글 추가요금 반영; 출발편이 설정에서 사라졌으면 `{ travelers, completeness: computeCompleteness(travelers) }` 만 저장) → `updateApplicationFields`.
  5. **Payments**: 요약 `Total · Deposit due · Paid · Balance`(formatPHP). 결제 목록(날짜·유형·수단·금액·참조·기록자, 각 행 "Remove" → `confirm` → `removePaymentTx`). "Record payment" 폼: type(select `PAYMENT_TYPES`), method(select `PAYMENT_METHODS` 라벨 매핑: maya_link "Maya payment link", maya_qr "Maya QR", maya_terminal "Maya terminal", bank_transfer "Bank transfer", cash "Cash", maya_checkout "Maya Checkout (online)"), amount(텍스트 → `parseAmount`, 오류 "Enter whole pesos, e.g. 10,000"), paid date(`type="date"`, 기본 오늘 마닐라; 저장은 해당 날짜 12:00 마닐라 = `new Date(\`${date}T04:00:00Z\`)`), reference(선택). 저장 → `addPaymentTx` → `suggestedStatus` 가 있으면 `confirm("Payment saved. Change status to <Label>?")` → 예면 `changeStatusTx`.
     **Maya 결제 링크**: `config?.mayaPaymentLinkBase` 가 있으면 버튼 2개 "Copy deposit link (PHP x)" / "Copy balance link (PHP y)"(`mayaPaymentLink(base, amount)`; balance = total − paid, 0 이하면 숨김). 복사 성공 "Copied".
  6. **Special requests**(읽기 전용, 줄바꿈 유지) 와 **Staff notes**(textarea + "Save notes" → `updateApplicationFields(id, { staffNotes: value.trim() || null })`).
  7. **Emails**: `notifications` 가 있으면 "Customer email: sent/skipped/failed", "Staff email: …" (오류면 빨간 글씨로 오류 문구).
  - 모든 저장 버튼은 진행 중 비활성, 실패 시 섹션 아래 "Save failed. Please try again." 표시.
  - `app` prop 이 실시간으로 바뀌면 편집 중이 아닌 섹션은 새 값으로 갱신(편집 상태는 섹션별 `editing` 플래그로 관리하고, 편집 시작 시점의 값으로 폼을 채운다).
  - 파일이 커지면 같은 폴더에 섹션 컴포넌트(`detail/StatusSection.tsx`, `detail/ContactSection.tsx`, `detail/TravelersSection.tsx`, `detail/PaymentsSection.tsx`, `detail/NotesSection.tsx`)로 나눠도 된다(각 200줄 이하 권장).
- [ ] **Step 2:** `tsc`, `test`, `build` → 성공.
- [ ] **Step 3: Commit** `git add frontend/web/src/app/admin && git commit -m "feat(admin): 신청자 상세(상태·연락·참가자 편집·인원 재계산·결제 기록·Maya 링크·메모·메일 결과)"`

---

### Task 10: 에뮬레이터 E2E · 오픈 런북 · 문서 정리

**Files:**
- Create: `backend/functions/scripts/seed-emulator-applications.mjs`, `docs/superpowers/notes/launch-runbook.md`
- Modify: `backend/functions/package.json` (script), `README.md`, `docs/superpowers/notes/2026-10-12-part1-carryover.md`

- [ ] **Step 1: 신청서 시드 스크립트** — 이미 있는 `seed-emulator.mjs`(tourConfig·TA-SUNRISE) 뒤에 실행. `FIRESTORE_EMULATOR_HOST` 없으면 종료(기존 스크립트와 같은 가드), `projectId: 'demo-unik'`. `applications` 에 3건(문서 ID 는 고정 UUID): APP-9001 new(mnl, 2 full + 1 companion, TA-SUNRISE 스냅샷 할인 2,000/인, 참가자 정보 일부), APP-9002 contacted(ceb, 1 tenK, Direct, 정보 완전), APP-9003 cancelled(mnl, 1 full). 각 문서는 서버 `submit.ts` 가 쓰는 필드와 같은 모양(`statusHistory`, `payments: []`, `paidTotal: 0`, `pricing` 은 `computePricing` 과 같은 숫자로 직접 기입, `agreedToTermsAt`·`createdAt` 은 `Timestamp.now()`), `counters/seoul2027` 는 건드리지 않는다. `package.json` scripts 에 `"seed:emulator:applications": "node scripts/seed-emulator-applications.mjs"`.
- [ ] **Step 2: E2E (브라우저, 결과를 보고서에 기록)**
  1. `cd backend/functions && FUNCTIONS_DISCOVERY_TIMEOUT=60 npx firebase emulators:start --only auth,firestore,functions --project demo-unik --config ../../firebase.json` (백그라운드, PID 기록)
  2. 시드: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator:applications`
  3. 웹: `cd frontend/web && NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-unik NEXT_PUBLIC_USE_FIRESTORE_EMULATOR=true NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=true NEXT_PUBLIC_USE_AUTH_EMULATOR=true pnpm dev -p 3101` (백그라운드, PID 기록)
  4. `/admin/login` → Google 로그인 버튼 → Auth 에뮬레이터 화면에서 "Add new account" 로 `staff@cebudirectclub.com` 생성·로그인 (이메일 인증된 계정으로 생성; 규칙의 `email_verified` 필요). `/admin` → `/admin/applicants` 이동 확인.
  5. 확인 목록(각각 통과/실패 기록):
     - 목록: 3건, 상태 탭 건수, 검색 "santos", Promo 필터 TA-SUNRISE/Direct, Missing info only, KPI(취소 제외)
     - CSV 2종 다운로드(파일 열어 헤더·행 수 확인)
     - 상세: 상태 변경(confirmed 시 경고 confirm), 이력 추가
     - 결제: "10,000" 입력 → 저장 → deposit_paid 제안 → 수락 → 상태 변경; 같은 신청서를 **두 탭**에서 열고 각각 결제 기록 → 두 결제 모두 남는지(Review Focus 5)
     - Maya 링크: 상품 설정에 `https://mymaya.me/test` 저장 후 상세에서 복사 버튼 표시
     - 인원 변경: APP-9001 Companion +1 → 미리보기 금액(할인 2,000/인 유지) → 적용 → 목록·남은 자리(상품 설정 화면 seats taken) 갱신
     - 참가자 편집: 잘못된 생년월일 오류, 정상 저장 후 Info 수치 증가
     - 연락 편집: 이메일 대문자 입력 → 소문자로 저장
     - 프로모: 새 코드 `TA-TEST` 생성(정률 5), 중복 생성 시 오류, 추천 링크 복사, 일시중지, 미사용 코드 삭제 가능·TA-SUNRISE 삭제 버튼 없음
     - 상품 설정: 출발편 추가·저장, 신청 있는 mnl 의 Remove 비활성, 좌석을 사용량보다 낮추면 경고 confirm
     - 공개 사이트 `/apply` 에서 새 신청 1건 → 어드민 목록에 실시간 등장
  6. 띄운 프로세스만 PID 로 종료.
- [ ] **Step 3: 오픈 런북** — `docs/superpowers/notes/launch-runbook.md` (아래 내용 그대로, 실제 값은 사용자가 채움):
```markdown
# 오픈 런북 — unik.ph 서울마라톤 2027

> 오픈 당일 이 순서대로 진행한다. 각 단계 결과를 체크한다. 문제가 생기면 "롤백" 절을 따른다.

## D-3 ~ D-1 (사전 준비, 사이트 영향 없음)
- [ ] 대표 승인: 색상 테마, 랜딩·투어 문구
- [ ] `LAUNCH=1 pnpm --filter @unik/web test` 통과 (모든 [TBC: …] 제거)
- [ ] Firestore 백업: `gcloud firestore export gs://unik-90206.firebasestorage.app/backups/<YYYY-MM-DD>-pre-launch --project=unik-90206`
- [ ] 아카이브 태그 원격 푸시: `git push origin archive/pre-seoul-2027`
- [ ] App Check: reCAPTCHA Enterprise 키 생성(unik.ph, www.unik.ph, localhost, 필요 시 *.vercel.app) → Firebase App Check 웹앱 등록 → Vercel 환경변수 `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` (Production, Preview)
- [ ] **Firestore·Storage 에는 App Check 강제를 켜지 않는다** (SSR 가격 조회·NFC 명함이 토큰 없이 읽음)
- [ ] Resend 키: `firebase functions:secrets:set RESEND_API_KEY --project unik-90206`
- [ ] Firebase Auth 승인 도메인에 unik.ph, www.unik.ph 있는지 확인
- [ ] 스테이징 확인: Vercel Preview(이 브랜치)에서 공개 페이지·명함(`/profile/<slug>`) 렌더링 확인

## D-day
1. [ ] **새 함수만 배포** (구 함수 유지, 구 사이트 영향 없음):
   `firebase deploy --only functions:submitApplication,functions:checkPromoCode,functions:onApplicationCreated,functions:onApplicationWritten,functions:onTourConfigWritten,functions:onNewContact --project unik-90206`
   - 구 함수 삭제를 묻는 프롬프트가 나오면 **No**.
2. [ ] **규칙 배포 + 사이트 전환을 연달아** (이 사이 수 분간 구 사이트 일부 기능 정지 — 트래픽 적은 시간대):
   1. `firebase deploy --only firestore:rules --project unik-90206`
   2. `feat/seoul-2027` → `main` 병합 (PR 머지) → Vercel 프로덕션 배포 완료 확인
3. [ ] 어드민 로그인 → **Tour settings** 입력: 출발편·가격·좌석·예약금·배번 200·알림 메일·Maya 링크. 이때 "Accepting applications" 는 **끈 상태**로 저장.
4. [ ] **Promo codes**: TA 별 코드 생성, 추천 링크 정리.
5. [ ] 점검(접수 끈 상태): `/`·`/tour` 가격 표시(최대 60초 후), `/apply` 마감 안내, `/profile/<slug>` 명함·vCard, `/contact` 문의 1건 → 직원 메일 수신.
6. [ ] **Accepting applications 켜기** → 실제 신청 1건(직원 본인) → 확인 메일·직원 메일 수신 → 어드민에 표시 → 테스트 신청은 **Cancelled** 로 변경.
7. [ ] TA 에 추천 링크 배포.

## D+1 이후
- [ ] 안정 확인 후 구 함수 삭제: `firebase functions:delete spinRoulette createRouletteWinner onNewRegistration --region asia-northeast3 --project unik-90206`
- [ ] Firebase App Check 지표에서 미검증 요청 비율 확인

## 롤백
- 사이트: Vercel 대시보드 → 이전 프로덕션 배포 "Promote to Production" (즉시)
- 규칙: `git checkout archive/pre-seoul-2027 -- firestore.rules && firebase deploy --only firestore:rules --project unik-90206` 후 파일 원복
- 함수: 새 함수는 구 사이트와 무관하므로 그대로 두어도 된다(필요 시 `functions:delete`)
```
- [ ] **Step 4: README·이월 목록** — README 에 "Admin" 절(메뉴 4개, 로그인 도메인, 로컬 E2E 명령: 에뮬레이터 auth·firestore·functions + 시드 2종 + 웹 env 4개) 추가. 이월 목록: "3부에서 지킬 것" 항목들에 `✅ (3부)` 표시, "운영 배포 런북" 항목에 `→ docs/superpowers/notes/launch-runbook.md` 링크, 2부→3부 계약 항목에 ✅.
- [ ] **Step 5: 전체 검증 & Commit**
Run: `pnpm typecheck && pnpm test && pnpm --filter @unik/web test && pnpm --filter @unik/web build` → PASS.
```bash
git add backend/functions/scripts backend/functions/package.json docs README.md
git commit -m "docs: 오픈 런북, 어드민 E2E 시드·점검, README·이월 목록 갱신"
```
