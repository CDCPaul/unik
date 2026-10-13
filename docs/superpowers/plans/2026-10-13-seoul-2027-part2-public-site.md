# Seoul 2027 — Part 2: 공개 사이트 · 신청 폼 · 오픈 차단 항목 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** unik.ph 공개 사이트(랜딩·대회·투어·아트조이·FAQ·과거 투어·문의·약관 3종)와 신청 폼(`/apply`, `/apply/thanks`)을 만들고, 1부에서 넘어온 오픈 차단 항목(App Check, 제출 제한, 입력 규칙 공유)을 처리한다.

**Architecture:** 공개 페이지는 `src/app/(site)/` 라우트 그룹에 두고 전용 레이아웃(폰트·헤더·푸터·추천코드 저장·App Check 시작)을 쓴다. 문구는 `src/content/*.ts` 에 두고, 가격·출발편·남은 자리는 Firestore `tourConfig`/`availability` 에서 읽는다(서버 컴포넌트는 60초 ISR, 신청 폼은 실시간 구독). 신청 폼의 상태·검증·페이로드 생성은 순수 모듈(`src/lib/apply/*`)로 분리해 vitest 로 테스트하고, UI 는 그 위의 얇은 클라이언트 컴포넌트다. 입력 규칙은 `shared/domain/validation.ts` 하나를 웹과 Functions 가 같이 쓴다.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@theme` 토큰), Firebase JS SDK 12 (firestore, functions, app-check), `next/font` (Barlow Condensed, Manrope), vitest 3, Cloud Functions (npm, Node 22).

**Spec:** `docs/superpowers/specs/2026-10-12-seoul-marathon-2027-site-design.md`
**이월 목록:** `docs/superpowers/notes/2026-10-12-part1-carryover.md` (이 계획이 "오픈 차단 1·2" 와 "2부 계약" 을 처리한다. "배포 런북" 은 3부)
**시안(시각 기준):** `docs/design/mockups/Main.dc.html`(랜딩), `Apply.dc.html`(신청 폼), `Themes.dc.html`. 인라인 스타일을 Tailwind 클래스로 옮기되 구조·문구·간격을 따른다. `/_blob/...` 이미지 경로는 이 계획의 `public/images/*` 로 바꾼다.

## Global Constraints

- 브랜치 `feat/seoul-2027` 에서만 작업. push·merge·운영 배포 금지. 에뮬레이터는 `--project demo-unik` 만.
- **명함 보호:** `src/app/profile/**`, `src/app/admin/**`, `src/components/admin/**`, `src/lib/{auth,firebase,vcard,businessCardConfig}.ts`, `src/lib/services/businessCards.ts`, `src/lib/services/admin/businessCards.ts` 는 수정 금지. `src/app/layout.tsx`(루트, Outfit 글꼴) 수정 금지. `globals.css` 는 **추가만** 허용(기존 팔레트·유틸 삭제/변경 금지 — 명함·로그인 화면이 사용).
- 공개 사이트 언어: 영어. 통화 표기 `PHP 1,234` (`formatPHP`).
- 색상 토큰 (테마 A "PH × KR", 대표 승인 대기 — 토큰만 바꾸면 교체 가능해야 함): ink `#0B1F4D`, red `#C8242B`(버튼 배경·강조 텍스트), sun `#F6C343`(어두운 배경 위 강조), soft `#EEF2FA`, line `#D9E0EE`, body `#33405C`.
- 글꼴: 제목 Barlow Condensed(600/700/800, italic 800), 본문 Manrope. 공개 레이아웃에서만 로드.
- 대회 사실: 2027 Seoul Marathon (97th Dong-A Marathon), Sunday March 21, 2027. 집결: 풀코스 Gwanghwamun Square(예정), 10K Jamsil Sports Complex(예정). 코스맵 미공개. 아트조이 기록 `2:33:48 (2026 Tokyo Marathon)`(본인 확인 대기). 배번 200석(KTO 지원, 풀·10K 공용).
- 사진 출처 표기: 서울마라톤 공식 사진에는 `Photo: Seoul Marathon`.
- 신청 폼 필수: 출발편, 인원(1–10), 대표자 이름·이메일·전화, 약관 동의. 참가자 상세는 전부 선택.
- 추천코드: 어느 공개 페이지든 `?code=` 를 30일간 저장(localStorage, 실패해도 동작).
- `submitApplication` 재시도: `functions/internal|unavailable|deadline-exceeded|aborted` 는 **같은 idempotencyKey** 로 최대 3회.
- 폼 검증 규칙은 `shared/domain/validation.ts` 를 웹·서버가 공유한다.
- 문의 폼은 `contacts` 에 `{name,email,phone?,subject,message,isRead:false,createdAt}` 만 보낸다(phone 은 값이 있을 때만 키 포함, ≤40자; email ≥3자).
- backend/functions 는 npm. 웹·shared 는 pnpm (lockfile 변경 시 다른 패키지의 resolved 버전이 바뀌지 않았는지 확인).

## Review Focus

1. **제출 중 네트워크 오류**: 응답을 못 받아도 같은 키로 재시도해 중복 신청이 생기지 않고, 실패 시 입력 내용이 남아 있다 → Task 3 `retries retryable errors with the same payload`, Task 4 `draft round-trips the idempotencyKey`.
2. **다른 페이지에서 받은 TA 코드**: `/tour?code=TA-X` 로 들어와 둘러본 뒤 `/apply` 로 가도(새로고침 포함) 코드가 채워진다; 30일 지나면 사라진다 → Task 3 `loadPromoCode` 테스트.
3. **필리핀식 전화번호 입력**: `(0917) 123-4567`, `0917.123.4567` 이 클라이언트·서버 모두 통과 → Task 1 `normalizePhoneNumber` 테스트, Task 4 `toSubmitPayload normalizes phone`.
4. **작성 중 마감/만석**: 실시간 남은 자리로 출발편 상태가 바뀌고, 서버가 `waitlist` 를 돌려주면 완료 페이지가 대기 안내를 보인다 → Task 3 `departureStatus` 테스트, Task 9 완료 페이지 분기.
5. **localStorage 사용 불가(사파리 개인정보 모드 등)**: 추천코드 저장·임시저장이 실패해도 폼이 동작한다 → Task 3/4 `throwing store` 테스트.

---

## File Structure

**Create**
- `shared/domain/validation.ts` (+ `validation.test.ts`) — 이름·전화·생년월일·이메일 규칙
- `frontend/web/vitest.config.mts`
- `frontend/web/src/lib/store.ts` — 안전한 localStorage 래퍼 타입
- `frontend/web/src/lib/promo/storage.ts` (+ test) — 추천코드 30일 저장
- `frontend/web/src/lib/functions.ts` — Functions 클라이언트(서울 리전, 에뮬레이터)
- `frontend/web/src/lib/appCheck.ts` — App Check 시작
- `frontend/web/src/lib/apply/errors.ts` (+ test) — 서버 오류 → 사용자 문구
- `frontend/web/src/lib/apply/api.ts` (+ test) — submit 재시도, 프로모 확인
- `frontend/web/src/lib/apply/model.ts` (+ test) — 폼 상태 리듀서·검증·페이로드·예상 금액
- `frontend/web/src/lib/apply/draft.ts` (+ test) — 임시저장
- `frontend/web/src/lib/tour/publicData.ts` (+ `publicData.test.ts`) — tourConfig/availability 읽기, 출발편 상태, 최저가
- `frontend/web/src/content/{site,race,tour,artjoy,faq,pastTours,legal}.ts` — 문구
- `frontend/web/src/components/site/{Header,Footer,Section,ButtonLink,PromoCodeCapture,AppCheckInit,PhotoCredit}.tsx`
- `frontend/web/src/app/(site)/layout.tsx` 및 페이지들: `page.tsx`(랜딩), `seoul-marathon/`, `tour/`, `artjoy/`, `faq/`, `past-tours/`, `contact/`, `terms/`, `privacy/`, `refund-policy/`, `apply/`, `apply/thanks/`
- `frontend/web/src/app/(site)/apply/ApplyForm.tsx`, `frontend/web/src/app/(site)/contact/ContactForm.tsx`
- `frontend/web/src/app/{sitemap,robots}.ts`
- `frontend/web/public/images/{seoul-marathon-gwanghwamun.jpg,seoul-marathon-runners.jpg,artjoy-torregosa-poster.webp}`
- `backend/functions/scripts/seed-emulator.mjs`

**Modify**
- `shared/domain/index.ts`, `backend/functions/src/applications/{input,submit,errors,callables}.ts` (+ tests)
- `frontend/web/package.json`, `frontend/web/next.config.js`(redirects 추가만), `frontend/web/src/app/globals.css`(추가만)
- `shared/types/index.ts` (`ContactMessage.phone?` 추가)
- **Delete:** `frontend/web/src/app/page.tsx` (임시 홈 → `(site)/page.tsx` 로 대체)
- `.github/workflows/ci.yml`, `README.md`, `docs/superpowers/notes/2026-10-12-part1-carryover.md`

---

### Task 1: 공유 입력 규칙 + 서버 제출 제한(throttle)

**Files:**
- Create: `shared/domain/validation.ts`, `shared/domain/validation.test.ts`
- Modify: `shared/domain/index.ts`, `backend/functions/src/applications/input.ts`, `errors.ts`, `submit.ts`, `callables.ts`, `submit.test.ts`, `input.test.ts`

**Interfaces:**
- Produces (Task 4·9 사용): `NAME_MAX=60`, `PHONE_DIAL_PATTERN`, `PHONE_NUMBER_PATTERN`, `EMAIL_PATTERN`, `hasControlChars(v)`, `hasControlCharsExceptWhitespace(v)`, `hasLinkOrMarkup(v)`, `isValidName(v)`, `normalizePhoneNumber(raw)`, `isValidBirthDate(v, today)` from `@unik/shared/domain`
- Produces (서버 계약): 새 오류 `details.code='rate_limited'` (HttpsError `resource-exhausted`). 동일 이메일 1시간 내 미취소 신청 5건 이상, 또는 동일 IP 해시 1시간 내 10건 이상이면 거절. 신청서에 `clientIpHash` 필드 저장(IP 원문 저장 금지).

- [ ] **Step 1: 도메인 실패 테스트**

`shared/domain/validation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  EMAIL_PATTERN,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  hasControlChars,
  hasControlCharsExceptWhitespace,
  hasLinkOrMarkup,
  isValidBirthDate,
  isValidName,
  normalizePhoneNumber,
} from './validation';

describe('names', () => {
  it('accepts real-world names', () => {
    for (const n of ['María José', "O'Neil-Santos", 'Dela Cruz', '김민지', 'Ñino']) expect(isValidName(n)).toBe(true);
  });
  it('rejects blank, too long, control characters, links and markup', () => {
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('A'.repeat(61))).toBe(false);
    expect(isValidName('Maria\nBcc: x')).toBe(false);
    expect(isValidName('visit www.spam.com')).toBe(false);
    expect(isValidName('http://x.y')).toBe(false);
    expect(isValidName('<b>x</b>')).toBe(false);
  });
  it('exposes the low-level checks', () => {
    expect(hasControlChars('a\u0007b')).toBe(true);
    expect(hasControlCharsExceptWhitespace('line1\nline2\tx')).toBe(false);
    expect(hasLinkOrMarkup('WWW.x.com')).toBe(true);
  });
});

describe('phone', () => {
  it('normalizes Philippine formats so they pass the pattern', () => {
    expect(normalizePhoneNumber('(0917) 123-4567')).toBe('0917 123-4567');
    expect(normalizePhoneNumber('0917.123.4567')).toBe('0917 123 4567');
    expect(normalizePhoneNumber('  917   123 4567 ')).toBe('917 123 4567');
    expect(PHONE_NUMBER_PATTERN.test(normalizePhoneNumber('(0917) 123-4567'))).toBe(true);
  });
  it('validates dial codes', () => {
    expect(PHONE_DIAL_PATTERN.test('+63')).toBe(true);
    expect(PHONE_DIAL_PATTERN.test('63')).toBe(false);
  });
});

describe('email', () => {
  it('accepts normal addresses and rejects obvious garbage', () => {
    expect(EMAIL_PATTERN.test('maria@example.com')).toBe(true);
    expect(EMAIL_PATTERN.test('maria@example')).toBe(false);
    expect(EMAIL_PATTERN.test('maria example.com')).toBe(false);
  });
});

describe('isValidBirthDate', () => {
  const today = '2026-10-13';
  it('accepts real past dates', () => {
    expect(isValidBirthDate('1990-05-14', today)).toBe(true);
    expect(isValidBirthDate('2026-10-13', today)).toBe(true);
  });
  it('rejects impossible, future and too-old dates', () => {
    expect(isValidBirthDate('2027-02-30', today)).toBe(false);
    expect(isValidBirthDate('1990-13-01', today)).toBe(false);
    expect(isValidBirthDate('2026-10-14', today)).toBe(false);
    expect(isValidBirthDate('1899-12-31', today)).toBe(false);
    expect(isValidBirthDate('14/05/1990', today)).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm --filter @unik/shared test` → FAIL (`./validation` 없음).

- [ ] **Step 3: 구현**

`shared/domain/validation.ts`:
```ts
// 신청 폼 입력 규칙. 웹 폼과 Cloud Functions 가 같은 규칙을 쓴다.

export const NAME_MAX = 60;
export const PHONE_DIAL_PATTERN = /^\+\d{1,4}$/;
export const PHONE_NUMBER_PATTERN = /^[0-9 -]{6,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ASCII 제어문자(U+0000–U+001F, U+007F): 메일 헤더·본문 주입 방지
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
// 자유 서술칸은 탭·줄바꿈만 허용
const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const LINK_OR_MARKUP = /[<>]|:\/\/|www\./i;

export function hasControlChars(value: string): boolean {
  return CONTROL_CHARS.test(value);
}

export function hasControlCharsExceptWhitespace(value: string): boolean {
  return CONTROL_CHARS_EXCEPT_WHITESPACE.test(value);
}

export function hasLinkOrMarkup(value: string): boolean {
  return LINK_OR_MARKUP.test(value);
}

export function isValidName(value: string): boolean {
  const v = value.trim();
  return v.length >= 1 && v.length <= NAME_MAX && !hasControlChars(v) && !hasLinkOrMarkup(v);
}

/** 괄호·점을 공백으로 바꾸고 연속 공백을 하나로 줄인다. "(0917) 123-4567" → "0917 123-4567" */
export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[().]/g, ' ').replace(/\s+/g, ' ').replace(/\s+-/g, '-').trim();
}

/** 실제 달력 날짜이며 1900-01-01 ~ today(YYYY-MM-DD) 범위인가 */
export function isValidBirthDate(value: string, today: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return false;
  return value >= '1900-01-01' && value <= today;
}
```
Note: `normalizePhoneNumber('(0917) 123-4567')` → replace → `' 0917  123-4567'` → collapse → `' 0917 123-4567'` → `\s+-` 없음 → trim → `'0917 123-4567'` ✓. `'0917.123.4567'` → `'0917 123 4567'` ✓.
`shared/domain/index.ts` 끝에 `export * from './validation';` 추가.

- [ ] **Step 4: 통과 확인** — Run: `pnpm --filter @unik/shared test && pnpm --filter @unik/shared typecheck` → PASS.

- [ ] **Step 5: Functions 입력 규칙을 도메인으로 교체 (실패 테스트 먼저)**

`backend/functions/src/applications/input.test.ts` 의 `describe('parseSubmitInput', …)` 안에 추가:
```ts
  it('accepts and normalizes Philippine phone formats', () => {
    const r = parseSubmitInput(validInput({ lead: { ...validInput().lead, phoneNumber: '(0917) 123-4567' } }));
    expect(r.lead.phoneNumber).toBe('0917 123-4567');
  });
```
Run: `cd backend/functions && npm test` → 이 테스트 FAIL (현재 정규식이 괄호를 거부).

`input.ts` 수정 — 파일 상단의 로컬 `CONTROL_CHARS`, `CONTROL_CHARS_EXCEPT_WHITESPACE`, `NO_CONTROL`, `NO_LINK_OR_MARKUP`, `isValidBirthDate` 정의를 삭제하고 도메인 함수로 교체:
```ts
import {
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  PROMO_CODE_PATTERN,
  TSHIRT_SIZES,
  hasControlChars,
  hasControlCharsExceptWhitespace,
  isValidBirthDate,
  isValidName,
  manilaDate,
  normalizePhoneNumber,
  validateCounts,
} from '../shared-domain';
```
- `optText`: `.refine((v) => !hasControlChars(v), 'Invalid characters')`
- `nameText`: `z.string().trim().refine(isValidName, 'Invalid name')`
- `dob`: `.refine((v) => isValidBirthDate(v, manilaDate(new Date())), 'Invalid date')`
- `phoneDial`: `z.string().regex(PHONE_DIAL_PATTERN)`
- `phoneNumber`: `z.preprocess((v) => (typeof v === 'string' ? normalizePhoneNumber(v) : v), z.string().regex(PHONE_NUMBER_PATTERN))`
- `specialRequests`: `.refine((v) => !hasControlCharsExceptWhitespace(v), 'Invalid characters')`
Run: `npm test` → 전체 PASS (기존 입력 테스트 포함).

- [ ] **Step 6: 제출 제한 실패 테스트**

`submit.test.ts` 의 describe 안에 추가:
```ts
  it('rate-limits many applications from the same email within an hour', async () => {
    for (let i = 0; i < 5; i++) {
      await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now);
    }
    const err = await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now).then(
      () => null,
      (e) => e,
    );
    expect(err).toBeInstanceOf(SubmitError);
    expect(err.code).toBe('rate_limited');
    const other = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
    other.lead = { ...other.lead, email: 'someone.else@example.com' };
    expect((await submitApplicationCore(testDb(), other, now)).status).toBe('new');
  });

  it('rate-limits many applications from the same client IP hash within an hour', async () => {
    for (let i = 0; i < 10; i++) {
      const input = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
      input.lead = { ...input.lead, email: `p${i}@example.com` };
      await submitApplicationCore(testDb(), input, now, { clientIpHash: 'abc' });
    }
    const input = validInput({ counts: { full: 0, tenK: 0, companion: 1 } });
    input.lead = { ...input.lead, email: 'p99@example.com' };
    await expectSubmitError(submitApplicationCore(testDb(), input, now, { clientIpHash: 'abc' }), 'rate_limited');
    expect((await submitApplicationCore(testDb(), input, now, { clientIpHash: 'other' })).status).toBe('new');
  });

  it('ignores submissions older than an hour for rate limiting', async () => {
    const earlier = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    for (let i = 0; i < 5; i++) {
      await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), earlier);
    }
    expect((await submitApplicationCore(testDb(), validInput({ counts: { full: 0, tenK: 0, companion: 1 } }), now)).status).toBe('new');
  });
```
(기존 `expectSubmitError` 헬퍼 사용. `validInput()` 은 기본 이메일이 같으므로 첫 테스트가 동작한다.)
Run: `npm test` → 3개 FAIL.

- [ ] **Step 7: 제한 구현**

`errors.ts`: `export type SubmitErrorCode = 'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid' | 'rate_limited';`

`submit.ts`:
- 시그니처: `export async function submitApplicationCore(db: Firestore, raw: unknown, now = new Date(), ctx: { clientIpHash?: string } = {}): Promise<SubmitResult>`
- 파일 상단 상수:
```ts
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL_PER_WINDOW = 5;
const MAX_PER_IP_PER_WINDOW = 10;
```
- 트랜잭션 안, `const summaries = …` 바로 다음에:
```ts
    const windowStart = now.getTime() - RATE_WINDOW_MS;
    const recent = appsSnap.docs
      .map((d) => d.data())
      .filter((d) => d.status !== 'cancelled' && submittedAtMs(d) >= windowStart);
    const sameEmail = recent.filter((d) => d.lead?.email === input.lead.email).length;
    const sameIp = ctx.clientIpHash ? recent.filter((d) => d.clientIpHash === ctx.clientIpHash).length : 0;
    if (sameEmail >= MAX_PER_EMAIL_PER_WINDOW || sameIp >= MAX_PER_IP_PER_WINDOW) {
      throw new SubmitError(
        'rate_limited',
        'We received several applications from you in a short time. Please contact us if you need to add more travelers.',
      );
    }
```
- 파일 하단 헬퍼 (`agreedToTermsAt` 은 트랜잭션 안에서 `Timestamp.fromDate(now)` 로 즉시 기록되므로 `createdAt` 서버타임스탬프보다 신뢰할 수 있다):
```ts
function submittedAtMs(data: FirebaseFirestore.DocumentData): number {
  const at = data.agreedToTermsAt;
  return at && typeof at.toMillis === 'function' ? at.toMillis() : 0;
}
```
- 문서 저장 객체에 `clientIpHash: ctx.clientIpHash ?? null,` 추가.

`callables.ts`:
```ts
import { createHash } from 'node:crypto';
```
- `submitApplication` 핸들러:
```ts
    const ip = request.rawRequest?.ip;
    const clientIpHash = ip ? createHash('sha256').update(`unik:${ip}`).digest('hex').slice(0, 32) : undefined;
    return await submitApplicationCore(getFirestore(), request.data, new Date(), { clientIpHash });
```
- 오류 매핑을 교체:
```ts
const HTTPS_CODE: Record<SubmitErrorCode, 'invalid-argument' | 'failed-precondition' | 'resource-exhausted'> = {
  invalid_input: 'invalid-argument',
  closed: 'failed-precondition',
  departure_closed: 'failed-precondition',
  promo_invalid: 'failed-precondition',
  rate_limited: 'resource-exhausted',
};
```
그리고 `throw new HttpsError(HTTPS_CODE[error.code], error.message, { code: error.code, ...error.details });` (`SubmitErrorCode` 를 `./errors` 에서 import).

- [ ] **Step 8: 통과·빌드** — Run: `cd backend/functions && npm test && npm run build` → PASS (기존 32 + 신규 4).

- [ ] **Step 9: Commit**
```bash
git add shared/domain backend/functions/src
git commit -m "feat: 입력 규칙을 shared/domain 으로 공유하고 신청 제출 제한(이메일·IP) 추가"
```

---

### Task 2: 웹 테스트 환경 + 추천코드 저장 + 공개 데이터 헬퍼

**Files:**
- Create: `frontend/web/vitest.config.mts`, `src/lib/store.ts`, `src/lib/promo/storage.ts`, `src/lib/promo/storage.test.ts`, `src/lib/tour/publicData.ts`, `src/lib/tour/publicData.test.ts`
- Modify: `frontend/web/package.json`

**Interfaces:**
- Produces: `type KeyValueStore = Pick<Storage,'getItem'|'setItem'|'removeItem'>`, `browserStore(): KeyValueStore | null`
- Produces: `PROMO_TTL_MS`, `savePromoCode(store, raw, now): string | null`, `loadPromoCode(store, now): string | null`, `clearPromoCode(store): void`
- Produces: `fetchTourConfig(): Promise<TourConfig|null>`, `subscribeTourData(cb: (d: {config: TourConfig|null; availability: Availability|null}) => void): () => void`, `type DepartureStatus = 'open'|'closed'|'full'`, `departureStatus(config, availability, departureId, counts): DepartureStatus`, `lowestPrice(config, category): number | null`

- [ ] **Step 1: vitest 설치**

```bash
cd /c/Users/hanas/CBM
pnpm --filter @unik/web add -D vitest@^3.2.7
git diff pnpm-lock.yaml | grep -E '^[-+] +(version|resolution)' | head
```
다른 importer 의 resolved 버전이 바뀌었으면 해당 hunk 를 되돌린 뒤 `pnpm install --frozen-lockfile --offline --lockfile-only` 로 확인.
`frontend/web/package.json` scripts 에 `"test": "vitest run"` 추가.
`frontend/web/vitest.config.mts`:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@unik/shared': fileURLToPath(new URL('../../shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 2: 실패 테스트**

`src/lib/promo/storage.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PROMO_TTL_MS, clearPromoCode, loadPromoCode, savePromoCode } from './storage';
import type { KeyValueStore } from '../store';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}
const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('promo storage', () => {
  const t0 = 1_800_000_000_000;
  it('normalizes and saves a valid code, then loads it', () => {
    const s = memoryStore();
    expect(savePromoCode(s, ' ta-sunrise ', t0)).toBe('TA-SUNRISE');
    expect(loadPromoCode(s, t0 + 1000)).toBe('TA-SUNRISE');
  });
  it('rejects malformed codes without storing', () => {
    const s = memoryStore();
    expect(savePromoCode(s, 'a_b', t0)).toBeNull();
    expect(s.data.size).toBe(0);
  });
  it('expires after 30 days and removes the entry', () => {
    const s = memoryStore();
    savePromoCode(s, 'TA-X1', t0);
    expect(loadPromoCode(s, t0 + PROMO_TTL_MS + 1)).toBeNull();
    expect(s.data.size).toBe(0);
  });
  it('survives a throwing or missing store', () => {
    expect(savePromoCode(throwingStore, 'TA-X1', t0)).toBe('TA-X1');
    expect(loadPromoCode(throwingStore, t0)).toBeNull();
    expect(loadPromoCode(null, t0)).toBeNull();
    expect(() => clearPromoCode(throwingStore)).not.toThrow();
  });
  it('ignores corrupted entries', () => {
    const s = memoryStore();
    s.data.set('unik.promoCode', '{not json');
    expect(loadPromoCode(s, t0)).toBeNull();
  });
});
```
`src/lib/tour/publicData.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { departureStatus, lowestPrice } from './publicData';
import type { Availability, TourConfig } from '@unik/shared/domain';

const config = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 3 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [
    { id: 'mnl', label: 'Manila', departDate: '', returnDate: '', flightInfo: '', seatCapacity: 4, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 },
    { id: 'ceb', label: 'Cebu', departDate: '', returnDate: '', flightInfo: '', seatCapacity: 4, isOpen: false, prices: { full: 70000, tenK: 65000, companion: 60000 }, singleSupplement: 15000 },
  ],
} satisfies TourConfig;
const availability: Availability = {
  bibsUsed: 2,
  bibsTotal: 3,
  departures: { mnl: { seatsUsed: 3, seatCapacity: 4 }, ceb: { seatsUsed: 0, seatCapacity: 4 } },
};

describe('departureStatus', () => {
  it('is closed when the departure or applications are closed', () => {
    expect(departureStatus(config, availability, 'ceb', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
    expect(departureStatus({ ...config, acceptingApplications: false }, availability, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
    expect(departureStatus(config, availability, 'xyz', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
  });
  it('is full when the requested group does not fit', () => {
    expect(departureStatus(config, availability, 'mnl', { full: 2, tenK: 0, companion: 0 })).toBe('full');
    expect(departureStatus(config, availability, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('open');
  });
  it('is open when availability is unknown or lacks the departure', () => {
    expect(departureStatus(config, null, 'mnl', { full: 9, tenK: 0, companion: 0 })).toBe('open');
    expect(departureStatus(config, { ...availability, departures: {} }, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('open');
  });
});

describe('lowestPrice', () => {
  it('uses open departures only', () => {
    expect(lowestPrice(config, 'full')).toBe(80000);
    expect(lowestPrice({ ...config, departures: [] }, 'full')).toBeNull();
  });
});
```

- [ ] **Step 3: 실패 확인** — Run: `pnpm --filter @unik/web test` → FAIL (모듈 없음).

- [ ] **Step 4: 구현**

`src/lib/store.ts`:
```ts
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** 브라우저 localStorage. 서버 렌더링 중이거나 접근이 막혀 있으면 null. */
export function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
```
`src/lib/promo/storage.ts`:
```ts
import { isValidPromoCodeFormat, normalizePromoCode } from '@unik/shared/domain';
import type { KeyValueStore } from '../store';

const KEY = 'unik.promoCode';
export const PROMO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 유효한 코드면 정규화해 저장하고 반환. 저장 실패는 무시한다(코드는 그대로 반환). */
export function savePromoCode(store: KeyValueStore | null, raw: string, now: number): string | null {
  const code = normalizePromoCode(raw);
  if (!isValidPromoCodeFormat(code)) return null;
  try {
    store?.setItem(KEY, JSON.stringify({ code, savedAt: now }));
  } catch {
    // 저장소가 막혀 있어도 이번 방문에서는 코드가 쓰인다.
  }
  return code;
}

export function loadPromoCode(store: KeyValueStore | null, now: number): string | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { code?: unknown; savedAt?: unknown };
    if (typeof value.code !== 'string' || typeof value.savedAt !== 'number') return null;
    if (now - value.savedAt > PROMO_TTL_MS) {
      store?.removeItem(KEY);
      return null;
    }
    return isValidPromoCodeFormat(value.code) ? value.code : null;
  } catch {
    return null;
  }
}

export function clearPromoCode(store: KeyValueStore | null): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // 무시
  }
}
```
`src/lib/tour/publicData.ts`:
```ts
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, TOUR_ID } from '@unik/shared/firebase/config';
import { exceedsCapacity } from '@unik/shared/domain';
import type { Availability, Category, Counts, TourConfig } from '@unik/shared/domain';

export async function fetchTourConfig(): Promise<TourConfig | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.tourConfig, TOUR_ID));
    return snap.exists() ? (snap.data() as TourConfig) : null;
  } catch (error) {
    console.error('fetchTourConfig failed', error);
    return null;
  }
}

export function subscribeTourData(
  callback: (data: { config: TourConfig | null; availability: Availability | null }) => void,
): () => void {
  let config: TourConfig | null = null;
  let availability: Availability | null = null;
  const emit = () => callback({ config, availability });
  const offConfig = onSnapshot(doc(db, COLLECTIONS.tourConfig, TOUR_ID), (s) => {
    config = s.exists() ? (s.data() as TourConfig) : null;
    emit();
  });
  const offAvailability = onSnapshot(doc(db, COLLECTIONS.availability, TOUR_ID), (s) => {
    availability = s.exists() ? (s.data() as Availability) : null;
    emit();
  });
  return () => {
    offConfig();
    offAvailability();
  };
}

export type DepartureStatus = 'open' | 'closed' | 'full';

export function departureStatus(
  config: TourConfig,
  availability: Availability | null,
  departureId: string,
  counts: Counts,
): DepartureStatus {
  const dep = config.departures.find((d) => d.id === departureId);
  if (!config.acceptingApplications || !dep || !dep.isOpen) return 'closed';
  // 남은 자리 문서가 아직 없거나 새 출발편이 반영되기 전이면 서버 판단에 맡긴다.
  if (!availability || !availability.departures[departureId]) return 'open';
  return exceedsCapacity(availability, departureId, counts) ? 'full' : 'open';
}

export function lowestPrice(config: TourConfig, category: Category): number | null {
  const prices = config.departures.filter((d) => d.isOpen).map((d) => d.prices[category]);
  return prices.length > 0 ? Math.min(...prices) : null;
}
```
`publicData.ts` 는 `@/lib/firebase` 를 import 하므로 테스트에서 Firebase 가 초기화되지만 네트워크 호출은 없다(순수 함수만 테스트). 초기화가 테스트를 깨면 `departureStatus`·`lowestPrice` 를 `src/lib/tour/status.ts` 로 분리하고 `publicData.ts` 가 재수출하도록 바꾼 뒤 테스트는 `./status` 를 import 한다 — 이 경우 보고서에 적는다.

- [ ] **Step 5: 통과 확인** — Run: `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.

- [ ] **Step 6: Commit**
```bash
git add frontend/web/vitest.config.mts frontend/web/package.json frontend/web/src/lib pnpm-lock.yaml
git commit -m "feat(web): 추천코드 30일 저장, 공개 투어 데이터 헬퍼, 웹 vitest 환경"
```

---

### Task 3: 신청 API 클라이언트 (재시도·오류 문구)

**Files:**
- Create: `frontend/web/src/lib/functions.ts`, `src/lib/apply/errors.ts`, `src/lib/apply/errors.test.ts`, `src/lib/apply/api.ts`, `src/lib/apply/api.test.ts`

**Interfaces:**
- Consumes: 서버 계약(이월 목록 "2부 계약" + Task 1 `rate_limited`)
- Produces:
  - `functions` (Functions 인스턴스, `asia-northeast3`; `NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR==='true'` 면 `127.0.0.1:5001`)
  - `type SubmitPayload` (서버 `SubmitInput` 과 같은 모양), `type SubmitResponse = { appNo: string; status: ApplicationStatus; pricing: Pricing; duplicate: boolean }`
  - `type PromoCheckResponse = { valid: false; reason: PromoInvalidReason } | { valid: true; code; agencyName; discountType; discountValue; description }`
  - `submitWithRetry(payload, deps?: { call?: (p) => Promise<SubmitResponse>; sleep?: (ms) => Promise<void>; attempts?: number; delayMs?: number }): Promise<SubmitResponse>`
  - `checkPromo(code: string, pax: number, deps?: { call?: (d) => Promise<PromoCheckResponse> }): Promise<PromoCheckResponse>`
  - `isRetryable(err: unknown): boolean`, `type DescribedError = { kind: 'invalid_input'|'closed'|'departure_closed'|'promo_invalid'|'rate_limited'|'network'|'unknown'; message: string; promoReason?: PromoInvalidReason; issues?: {path: string; message: string}[] }`, `describeSubmitError(err): DescribedError`, `PROMO_REASON_MESSAGES: Record<PromoInvalidReason, string>`

- [ ] **Step 1: 실패 테스트**

`src/lib/apply/errors.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { describeSubmitError, isRetryable } from './errors';

const fnError = (code: string, details?: unknown, message = 'x') => Object.assign(new Error(message), { code, details });

describe('isRetryable', () => {
  it('retries transient function errors only', () => {
    for (const c of ['functions/internal', 'functions/unavailable', 'functions/deadline-exceeded', 'functions/aborted']) {
      expect(isRetryable(fnError(c))).toBe(true);
    }
    expect(isRetryable(fnError('functions/failed-precondition'))).toBe(false);
    expect(isRetryable(new Error('plain'))).toBe(false);
  });
});

describe('describeSubmitError', () => {
  it('maps invalid input with field issues', () => {
    const d = describeSubmitError(
      fnError('functions/invalid-argument', { code: 'invalid_input', issues: [{ path: 'lead.email', message: 'Invalid email' }] }, 'Please check the form and try again.'),
    );
    expect(d.kind).toBe('invalid_input');
    expect(d.issues).toEqual([{ path: 'lead.email', message: 'Invalid email' }]);
  });
  it('maps promo errors with a reason message', () => {
    const d = describeSubmitError(fnError('functions/failed-precondition', { code: 'promo_invalid', reason: 'expired' }));
    expect(d).toMatchObject({ kind: 'promo_invalid', promoReason: 'expired' });
    expect(d.message).toMatch(/expired/i);
  });
  it('maps closed, departure_closed and rate_limited', () => {
    expect(describeSubmitError(fnError('functions/failed-precondition', { code: 'closed' })).kind).toBe('closed');
    expect(describeSubmitError(fnError('functions/failed-precondition', { code: 'departure_closed' })).kind).toBe('departure_closed');
    expect(describeSubmitError(fnError('functions/resource-exhausted', { code: 'rate_limited' }, 'We received several')).kind).toBe('rate_limited');
  });
  it('treats exhausted retries as a network problem', () => {
    expect(describeSubmitError(fnError('functions/unavailable')).kind).toBe('network');
  });
  it('falls back to unknown', () => {
    expect(describeSubmitError('boom').kind).toBe('unknown');
  });
});
```
`src/lib/apply/api.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { checkPromo, submitWithRetry } from './api';
import type { SubmitPayload, SubmitResponse } from './api';

const payload = { idempotencyKey: 'k' } as unknown as SubmitPayload;
const ok: SubmitResponse = { appNo: 'APP-0001', status: 'new', pricing: {} as never, duplicate: false };
const transient = () => Object.assign(new Error('x'), { code: 'functions/unavailable' });
const fatal = () => Object.assign(new Error('x'), { code: 'functions/failed-precondition', details: { code: 'closed' } });

describe('submitWithRetry', () => {
  it('retries retryable errors with the same payload', async () => {
    const call = vi.fn().mockRejectedValueOnce(transient()).mockRejectedValueOnce(transient()).mockResolvedValue(ok);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(submitWithRetry(payload, { call, sleep })).resolves.toEqual(ok);
    expect(call).toHaveBeenCalledTimes(3);
    for (const args of call.mock.calls) expect(args[0]).toBe(payload);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
  it('gives up after the attempt limit', async () => {
    const call = vi.fn().mockRejectedValue(transient());
    await expect(submitWithRetry(payload, { call, sleep: async () => {}, attempts: 3 })).rejects.toMatchObject({ code: 'functions/unavailable' });
    expect(call).toHaveBeenCalledTimes(3);
  });
  it('does not retry business errors', async () => {
    const call = vi.fn().mockRejectedValue(fatal());
    await expect(submitWithRetry(payload, { call, sleep: async () => {} })).rejects.toMatchObject({ details: { code: 'closed' } });
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe('checkPromo', () => {
  it('sends the normalized code and pax', async () => {
    const call = vi.fn().mockResolvedValue({ valid: false, reason: 'not_found' });
    await checkPromo(' ta-x ', 3, { call });
    expect(call).toHaveBeenCalledWith({ code: 'TA-X', pax: 3 });
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm --filter @unik/web test` → FAIL.

- [ ] **Step 3: 구현**

`src/lib/functions.ts`:
```ts
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import app from '@/lib/firebase';

export const functions = getFunctions(app, 'asia-northeast3');

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
  const w = window as Window & { __functionsEmulatorConnected?: boolean };
  if (!w.__functionsEmulatorConnected) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    w.__functionsEmulatorConnected = true;
  }
}
```
`src/lib/apply/errors.ts`:
```ts
import type { PromoInvalidReason } from '@unik/shared/domain';

const RETRYABLE = new Set([
  'functions/internal',
  'functions/unavailable',
  'functions/deadline-exceeded',
  'functions/aborted',
]);

export const PROMO_REASON_MESSAGES: Record<PromoInvalidReason, string> = {
  not_found: "We couldn't find this promo code. Please check it with your travel agency.",
  inactive: 'This promo code is no longer active.',
  expired: 'This promo code has expired.',
  limit_reached: 'This promo code has reached its limit for the number of travelers.',
};

export type DescribedError = {
  kind: 'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid' | 'rate_limited' | 'network' | 'unknown';
  message: string;
  promoReason?: PromoInvalidReason;
  issues?: { path: string; message: string }[];
};

interface FunctionsLikeError {
  code?: unknown;
  message?: unknown;
  details?: { code?: unknown; reason?: unknown; issues?: unknown };
}

export function isRetryable(err: unknown): boolean {
  return typeof (err as FunctionsLikeError)?.code === 'string' && RETRYABLE.has((err as FunctionsLikeError).code as string);
}

export function describeSubmitError(err: unknown): DescribedError {
  const e = (err ?? {}) as FunctionsLikeError;
  const detailCode = e.details?.code;
  const serverMessage = typeof e.message === 'string' && e.message ? e.message : undefined;
  switch (detailCode) {
    case 'invalid_input':
      return {
        kind: 'invalid_input',
        message: serverMessage ?? 'Please check the form and try again.',
        issues: Array.isArray(e.details?.issues) ? (e.details?.issues as DescribedError['issues']) : undefined,
      };
    case 'closed':
      return { kind: 'closed', message: 'Applications are currently closed. Please contact us.' };
    case 'departure_closed':
      return { kind: 'departure_closed', message: 'This departure is no longer available. Please choose another one.' };
    case 'promo_invalid': {
      const reason = e.details?.reason as PromoInvalidReason | undefined;
      return {
        kind: 'promo_invalid',
        promoReason: reason,
        message: reason ? PROMO_REASON_MESSAGES[reason] : PROMO_REASON_MESSAGES.not_found,
      };
    }
    case 'rate_limited':
      return { kind: 'rate_limited', message: serverMessage ?? 'Too many applications in a short time. Please contact us.' };
  }
  if (isRetryable(err)) {
    return {
      kind: 'network',
      message: "We couldn't reach our server. Your answers are saved — please try again in a moment.",
    };
  }
  return { kind: 'unknown', message: 'Something went wrong. Please try again or contact us.' };
}
```
`src/lib/apply/api.ts`:
```ts
import { httpsCallable } from 'firebase/functions';
import { normalizePromoCode } from '@unik/shared/domain';
import type {
  ApplicationStatus,
  Counts,
  DiscountType,
  Pricing,
  PromoInvalidReason,
  Traveler,
} from '@unik/shared/domain';
import { isRetryable } from './errors';

export interface SubmitPayload {
  idempotencyKey: string;
  departureId: string;
  counts: Counts;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phoneDial: string;
    phoneNumber: string;
    viber: boolean;
    whatsapp: boolean;
  };
  travelers: Traveler[];
  promoCode?: string;
  specialRequests?: string;
  agreedToTerms: boolean;
  website: string;
}

export interface SubmitResponse {
  appNo: string;
  status: ApplicationStatus;
  pricing: Pricing;
  duplicate: boolean;
}

export type PromoCheckResponse =
  | { valid: false; reason: PromoInvalidReason }
  | { valid: true; code: string; agencyName: string; discountType: DiscountType; discountValue: number; description: string };

async function callSubmit(payload: SubmitPayload): Promise<SubmitResponse> {
  const { functions } = await import('@/lib/functions');
  const fn = httpsCallable<SubmitPayload, SubmitResponse>(functions, 'submitApplication', { timeout: 60_000 });
  return (await fn(payload)).data;
}

async function callCheckPromo(data: { code: string; pax: number }): Promise<PromoCheckResponse> {
  const { functions } = await import('@/lib/functions');
  const fn = httpsCallable<{ code: string; pax: number }, PromoCheckResponse>(functions, 'checkPromoCode');
  return (await fn(data)).data;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 일시적 오류는 같은 payload(같은 idempotencyKey)로 재시도한다. 서버가 중복을 막는다. */
export async function submitWithRetry(
  payload: SubmitPayload,
  deps: {
    call?: (p: SubmitPayload) => Promise<SubmitResponse>;
    sleep?: (ms: number) => Promise<void>;
    attempts?: number;
    delayMs?: number;
  } = {},
): Promise<SubmitResponse> {
  const call = deps.call ?? callSubmit;
  const sleep = deps.sleep ?? defaultSleep;
  const attempts = deps.attempts ?? 3;
  const delayMs = deps.delayMs ?? 1500;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await call(payload);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || i === attempts - 1) throw error;
      await sleep(delayMs * (i + 1));
    }
  }
  throw lastError;
}

export async function checkPromo(
  code: string,
  pax: number,
  deps: { call?: (d: { code: string; pax: number }) => Promise<PromoCheckResponse> } = {},
): Promise<PromoCheckResponse> {
  return (deps.call ?? callCheckPromo)({ code: normalizePromoCode(code), pax });
}
```
(`@/lib/functions` 는 동적 import 로 불러 테스트에서 Firebase 를 초기화하지 않는다.)

- [ ] **Step 4: 통과 확인** — Run: `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/web/src/lib
git commit -m "feat(web): 신청 제출 재시도와 서버 오류 문구 매핑, 프로모 확인 클라이언트"
```

---

### Task 4: 신청 폼 상태 모델 · 검증 · 임시저장

**Files:**
- Create: `frontend/web/src/lib/apply/model.ts`, `model.test.ts`, `draft.ts`, `draft.test.ts`

**Interfaces:**
- Consumes: Task 1 validation, Task 3 `SubmitPayload`, `PromoCheckResponse`
- Produces:
  - `type AppliedPromo = Extract<PromoCheckResponse, {valid: true}>` 에서 `valid` 를 뺀 모양 `{ code; agencyName; discountType; discountValue; description }`
  - `interface LeadState`, `interface ApplyState { departureId: string|null; counts; lead; travelers; promoInput; promo: AppliedPromo|null; specialRequests; agreedToTerms; website; idempotencyKey }`
  - `type ApplyAction` (아래 코드), `initialApplyState(idempotencyKey, promoCode?)`, `applyReducer(state, action)`
  - `validateForSubmit(state, today): Record<string, string>` (키: `departureId`, `lead.firstName`, `lead.lastName`, `lead.email`, `lead.phoneNumber`, `agreedToTerms`, `travelers.<i>.passportName`, `travelers.<i>.dob`, `travelers.<i>.emergencyContact`)
  - `toSubmitPayload(state): SubmitPayload`, `estimatePricing(state, config): Pricing | null`
  - `saveDraft(store, state)`, `loadDraft(store): ApplyState | null`, `clearDraft(store)`

- [ ] **Step 1: 실패 테스트**

`src/lib/apply/model.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyReducer, estimatePricing, initialApplyState, toSubmitPayload, validateForSubmit } from './model';
import type { ApplyState } from './model';
import type { TourConfig } from '@unik/shared/domain';

const config = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [
    { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: '', seatCapacity: 120, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 },
  ],
} satisfies TourConfig;

function filled(): ApplyState {
  let s = initialApplyState('key-1');
  s = applyReducer(s, { type: 'setDeparture', departureId: 'mnl' });
  s = applyReducer(s, { type: 'setLead', field: 'firstName', value: 'Maria' });
  s = applyReducer(s, { type: 'setLead', field: 'lastName', value: 'Santos' });
  s = applyReducer(s, { type: 'setLead', field: 'email', value: 'maria@example.com' });
  s = applyReducer(s, { type: 'setLead', field: 'phoneNumber', value: '(0917) 123-4567' });
  return applyReducer(s, { type: 'setAgreed', value: true });
}

describe('applyReducer', () => {
  it('starts with one full marathon runner and the stored promo code', () => {
    const s = initialApplyState('k', 'TA-SUNRISE');
    expect(s.counts).toEqual({ full: 1, tenK: 0, companion: 0 });
    expect(s.travelers).toEqual([{ category: 'full' }]);
    expect(s.promoInput).toBe('TA-SUNRISE');
  });
  it('keeps travelers in sync with counts and preserves entered details', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'passportName', value: 'SANTOS MARIA' });
    s = applyReducer(s, { type: 'changeCount', category: 'companion', delta: 1 });
    expect(s.travelers).toEqual([{ category: 'full', passportName: 'SANTOS MARIA' }, { category: 'companion' }]);
  });
  it('never goes below 1 or above 10 travelers', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'changeCount', category: 'full', delta: -1 });
    expect(s.counts.full).toBe(1);
    for (let i = 0; i < 12; i++) s = applyReducer(s, { type: 'changeCount', category: 'tenK', delta: 1 });
    expect(s.counts.full + s.counts.tenK + s.counts.companion).toBe(10);
  });
  it('drops an applied promo when the code input changes', () => {
    let s = initialApplyState('k');
    s = applyReducer(s, { type: 'promoApplied', promo: { code: 'TA-A', agencyName: 'A', discountType: 'fixed', discountValue: 1000, description: 'x' } });
    s = applyReducer(s, { type: 'setPromoInput', value: 'ta-a' });
    expect(s.promo?.code).toBe('TA-A');
    s = applyReducer(s, { type: 'setPromoInput', value: 'TA-B' });
    expect(s.promo).toBeNull();
  });
});

describe('validateForSubmit', () => {
  it('passes a minimally filled form', () => {
    expect(validateForSubmit(filled(), '2026-10-13')).toEqual({});
  });
  it('reports every missing required field', () => {
    const errors = validateForSubmit(initialApplyState('k'), '2026-10-13');
    expect(Object.keys(errors).sort()).toEqual(
      ['agreedToTerms', 'departureId', 'lead.email', 'lead.firstName', 'lead.lastName', 'lead.phoneNumber'].sort(),
    );
  });
  it('validates optional traveler fields only when filled', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'dob', value: '2027-02-30' });
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'passportName', value: 'www.spam.com' });
    expect(validateForSubmit(s, '2026-10-13')).toEqual({
      'travelers.0.dob': expect.any(String),
      'travelers.0.passportName': expect.any(String),
    });
  });
});

describe('toSubmitPayload', () => {
  it('normalizes phone, trims and drops empty optional values', () => {
    let s = filled();
    s = applyReducer(s, { type: 'setTraveler', index: 0, field: 'nationality', value: '  ' });
    s = applyReducer(s, { type: 'setPromoInput', value: ' ta-x ' });
    const p = toSubmitPayload(s);
    expect(p.lead.phoneNumber).toBe('0917 123-4567');
    expect(p.travelers).toEqual([{ category: 'full' }]);
    expect(p.promoCode).toBe('TA-X');
    expect(p.specialRequests).toBeUndefined();
    expect(p.idempotencyKey).toBe('key-1');
    expect(p.website).toBe('');
  });
});

describe('estimatePricing', () => {
  it('prices the selected departure with the applied promo', () => {
    let s = filled();
    s = applyReducer(s, { type: 'promoApplied', promo: { code: 'TA-A', agencyName: 'A', discountType: 'fixed', discountValue: 2000, description: 'x' } });
    expect(estimatePricing(s, config)?.total).toBe(78000);
  });
  it('returns null without a departure', () => {
    expect(estimatePricing(initialApplyState('k'), config)).toBeNull();
  });
});
```
`src/lib/apply/draft.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clearDraft, loadDraft, saveDraft } from './draft';
import { applyReducer, initialApplyState } from './model';
import type { KeyValueStore } from '../store';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('draft', () => {
  it('draft round-trips the idempotencyKey and answers, never the honeypot', () => {
    const s = memoryStore();
    let state = initialApplyState('key-7');
    state = applyReducer(state, { type: 'setLead', field: 'firstName', value: 'Maria' });
    state = applyReducer(state, { type: 'setHoneypot', value: 'bot' });
    saveDraft(s, state);
    const loaded = loadDraft(s)!;
    expect(loaded.idempotencyKey).toBe('key-7');
    expect(loaded.lead.firstName).toBe('Maria');
    expect(loaded.website).toBe('');
  });
  it('ignores corrupted or foreign data', () => {
    const s = memoryStore();
    s.data.set('unik.applyDraft.v1', '{"counts":"x"}');
    expect(loadDraft(s)).toBeNull();
  });
  it('works with a throwing store', () => {
    expect(() => saveDraft(throwingStore, initialApplyState('k'))).not.toThrow();
    expect(loadDraft(throwingStore)).toBeNull();
    expect(() => clearDraft(throwingStore)).not.toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm --filter @unik/web test` → FAIL.

- [ ] **Step 3: 구현**

`src/lib/apply/model.ts`:
```ts
import {
  EMAIL_PATTERN,
  MAX_PAX_PER_APPLICATION,
  PHONE_DIAL_PATTERN,
  PHONE_NUMBER_PATTERN,
  buildTravelers,
  computePricing,
  hasControlChars,
  isValidBirthDate,
  isValidName,
  normalizePhoneNumber,
  normalizePromoCode,
  totalPax,
} from '@unik/shared/domain';
import type { Category, Counts, DiscountType, Pricing, TourConfig, Traveler } from '@unik/shared/domain';
import type { SubmitPayload } from './api';

export interface AppliedPromo {
  code: string;
  agencyName: string;
  discountType: DiscountType;
  discountValue: number;
  description: string;
}

export interface LeadState {
  firstName: string;
  lastName: string;
  email: string;
  phoneDial: string;
  phoneNumber: string;
  viber: boolean;
  whatsapp: boolean;
}

export interface ApplyState {
  departureId: string | null;
  counts: Counts;
  lead: LeadState;
  travelers: Traveler[];
  promoInput: string;
  promo: AppliedPromo | null;
  specialRequests: string;
  agreedToTerms: boolean;
  website: string; // honeypot
  idempotencyKey: string;
}

export type TravelerField = Exclude<keyof Traveler, 'category'>;

export type ApplyAction =
  | { type: 'setDeparture'; departureId: string }
  | { type: 'changeCount'; category: Category; delta: 1 | -1 }
  | { type: 'setLead'; field: keyof LeadState; value: string | boolean }
  | { type: 'setTraveler'; index: number; field: TravelerField; value: string }
  | { type: 'setPromoInput'; value: string }
  | { type: 'promoApplied'; promo: AppliedPromo }
  | { type: 'promoCleared' }
  | { type: 'setSpecialRequests'; value: string }
  | { type: 'setAgreed'; value: boolean }
  | { type: 'setHoneypot'; value: string }
  | { type: 'restore'; state: ApplyState };

export function initialApplyState(idempotencyKey: string, promoCode: string | null = null): ApplyState {
  return {
    departureId: null,
    counts: { full: 1, tenK: 0, companion: 0 },
    lead: { firstName: '', lastName: '', email: '', phoneDial: '+63', phoneNumber: '', viber: false, whatsapp: false },
    travelers: [{ category: 'full' }],
    promoInput: promoCode ?? '',
    promo: null,
    specialRequests: '',
    agreedToTerms: false,
    website: '',
    idempotencyKey,
  };
}

export function applyReducer(state: ApplyState, action: ApplyAction): ApplyState {
  switch (action.type) {
    case 'setDeparture':
      return { ...state, departureId: action.departureId };
    case 'changeCount': {
      const counts = { ...state.counts, [action.category]: Math.max(0, state.counts[action.category] + action.delta) };
      const pax = totalPax(counts);
      if (pax < 1 || pax > MAX_PAX_PER_APPLICATION) return state;
      return { ...state, counts, travelers: buildTravelers(counts, state.travelers) };
    }
    case 'setLead':
      return { ...state, lead: { ...state.lead, [action.field]: action.value } };
    case 'setTraveler':
      return {
        ...state,
        travelers: state.travelers.map((t, i) => (i === action.index ? { ...t, [action.field]: action.value } : t)),
      };
    case 'setPromoInput': {
      const keep = state.promo && normalizePromoCode(action.value) === state.promo.code;
      return { ...state, promoInput: action.value, promo: keep ? state.promo : null };
    }
    case 'promoApplied':
      return { ...state, promo: action.promo, promoInput: action.promo.code };
    case 'promoCleared':
      return { ...state, promo: null };
    case 'setSpecialRequests':
      return { ...state, specialRequests: action.value };
    case 'setAgreed':
      return { ...state, agreedToTerms: action.value };
    case 'setHoneypot':
      return { ...state, website: action.value };
    case 'restore':
      return action.state;
  }
}

const OPTIONAL_TEXT_MAX: Partial<Record<TravelerField, number>> = {
  passportName: 80,
  nationality: 60,
  expectedFinish: 20,
  recentMarathon: 120,
  emergencyContact: 120,
};

export function validateForSubmit(state: ApplyState, today: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.departureId) errors.departureId = 'Please choose a departure.';
  if (!isValidName(state.lead.firstName)) errors['lead.firstName'] = 'Please enter your first name.';
  if (!isValidName(state.lead.lastName)) errors['lead.lastName'] = 'Please enter your last name.';
  if (!EMAIL_PATTERN.test(state.lead.email.trim())) errors['lead.email'] = 'Please enter a valid email address.';
  if (!PHONE_DIAL_PATTERN.test(state.lead.phoneDial) || !PHONE_NUMBER_PATTERN.test(normalizePhoneNumber(state.lead.phoneNumber))) {
    errors['lead.phoneNumber'] = 'Please enter a valid mobile number.';
  }
  if (!state.agreedToTerms) errors.agreedToTerms = 'Please agree to the terms to continue.';
  state.travelers.forEach((t, i) => {
    const name = t.passportName?.trim();
    if (name && !isValidName(name)) errors[`travelers.${i}.passportName`] = 'Please use letters only.';
    const dob = t.dob?.trim();
    if (dob && !isValidBirthDate(dob, today)) errors[`travelers.${i}.dob`] = 'Please enter a valid date of birth.';
    for (const [field, max] of Object.entries(OPTIONAL_TEXT_MAX) as [TravelerField, number][]) {
      const v = (t[field] as string | undefined)?.trim();
      if (v && (v.length > max || hasControlChars(v)) && !errors[`travelers.${i}.${field}`]) {
        errors[`travelers.${i}.${field}`] = 'Please shorten this answer.';
      }
    }
  });
  return errors;
}

function cleanTraveler(t: Traveler): Traveler {
  const out: Record<string, unknown> = { category: t.category };
  for (const [k, v] of Object.entries(t)) {
    if (k === 'category') continue;
    if (typeof v === 'string' && v.trim() !== '') out[k] = v.trim();
  }
  return out as unknown as Traveler;
}

export function toSubmitPayload(state: ApplyState): SubmitPayload {
  const typedCode = state.promoInput.trim() ? normalizePromoCode(state.promoInput) : undefined;
  return {
    idempotencyKey: state.idempotencyKey,
    departureId: state.departureId ?? '',
    counts: state.counts,
    lead: {
      ...state.lead,
      firstName: state.lead.firstName.trim(),
      lastName: state.lead.lastName.trim(),
      email: state.lead.email.trim(),
      phoneNumber: normalizePhoneNumber(state.lead.phoneNumber),
    },
    travelers: state.travelers.map(cleanTraveler),
    promoCode: state.promo?.code ?? typedCode,
    specialRequests: state.specialRequests.trim() || undefined,
    agreedToTerms: state.agreedToTerms,
    website: state.website,
  };
}

export function estimatePricing(state: ApplyState, config: TourConfig): Pricing | null {
  const departure = config.departures.find((d) => d.id === state.departureId);
  if (!departure) return null;
  return computePricing({
    departure,
    counts: state.counts,
    travelers: state.travelers,
    promo: state.promo
      ? {
          code: state.promo.code,
          agencyName: state.promo.agencyName,
          discountType: state.promo.discountType,
          discountValue: state.promo.discountValue,
        }
      : null,
    depositPerPax: config.depositPerPax,
  });
}
```
`src/lib/apply/draft.ts`:
```ts
import type { KeyValueStore } from '../store';
import type { ApplyState } from './model';

const KEY = 'unik.applyDraft.v1';

export function saveDraft(store: KeyValueStore | null, state: ApplyState): void {
  try {
    store?.setItem(KEY, JSON.stringify({ ...state, website: '' }));
  } catch {
    // 저장 실패는 무시 (개인정보 모드 등)
  }
}

export function loadDraft(store: KeyValueStore | null): ApplyState | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<ApplyState>;
    const counts = s.counts as Record<string, unknown> | undefined;
    const valid =
      typeof s.idempotencyKey === 'string' &&
      !!counts &&
      ['full', 'tenK', 'companion'].every((k) => typeof counts[k] === 'number') &&
      !!s.lead &&
      typeof s.lead.firstName === 'string' &&
      Array.isArray(s.travelers);
    return valid ? ({ ...(s as ApplyState), website: '' }) : null;
  } catch {
    return null;
  }
}

export function clearDraft(store: KeyValueStore | null): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // 무시
  }
}
```

- [ ] **Step 4: 통과 확인** — Run: `pnpm --filter @unik/web test && pnpm --filter @unik/web exec tsc --noEmit` → PASS.

- [ ] **Step 5: Commit**
```bash
git add frontend/web/src/lib/apply
git commit -m "feat(web): 신청 폼 상태 리듀서·검증·제출 페이로드·임시저장"
```

---

### Task 5: 디자인 토큰 · 공개 레이아웃 · 헤더/푸터 · 추천코드 저장 · 리다이렉트

**Files:**
- Modify: `frontend/web/src/app/globals.css` (파일 끝에 추가만), `frontend/web/next.config.js` (redirects 추가), `shared/types/index.ts`
- Delete: `frontend/web/src/app/page.tsx`
- Create: `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`(임시: Task 6 에서 랜딩으로 교체), `src/components/site/{Header,MobileMenu,Footer,Section,ButtonLink,PhotoCredit,PromoCodeCapture}.tsx`, `src/content/site.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `public/images/*`

**Interfaces:**
- Produces: Tailwind 클래스 `bg-brand-ink`, `text-brand-red`, `bg-brand-red`, `text-brand-sun`, `bg-brand-soft`, `border-brand-line`, `text-brand-body`, `font-race`, `font-ui`
- Produces: `<Section id? tone="white"|"soft"|"ink" width="wide"|"narrow">`, `<SectionHeading eyebrow title intro? tone?>`, `<ButtonLink href variant="primary"|"outline-light"|"outline-dark">`, `<PhotoCredit>`, `SITE` (회사 정보·내비), `NAV_LINKS`

- [ ] **Step 1: 이미지 복사**

```bash
cd /c/Users/hanas/CBM/frontend/web
mkdir -p public/images
cp "/c/Users/hanas/AppData/Local/Temp/claude/C--Users-hanas-CBM/db126983-5120-4cc9-8235-8da8ac85774e/scratchpad/dl-seoul-marathon/hero-gwanghwamun.jpg" public/images/seoul-marathon-gwanghwamun.jpg
cp "/c/Users/hanas/AppData/Local/Temp/claude/C--Users-hanas-CBM/db126983-5120-4cc9-8235-8da8ac85774e/scratchpad/dl-seoul-marathon/race-city-runners.jpg" public/images/seoul-marathon-runners.jpg
cp "/c/Users/hanas/AppData/Local/Temp/claude/C--Users-hanas-CBM/db126983-5120-4cc9-8235-8da8ac85774e/images/7.webp" public/images/artjoy-torregosa-poster.webp
file public/images/*
```
Expected: JPEG 1920x1000 두 장, WebP 1장. 원본이 없으면 BLOCKED 로 보고(컨트롤러가 다시 받는다).

- [ ] **Step 2: 토큰 (globals.css 끝에 추가)**

```css
/* ========================================
   Seoul Marathon 2027 public site (테마 A "PH × KR")
   대표 승인에 따라 색만 바꾸면 되도록 토큰으로 둔다.
   ======================================== */
@theme {
  --color-brand-ink: #0b1f4d;
  --color-brand-red: #c8242b;
  --color-brand-sun: #f6c343;
  --color-brand-soft: #eef2fa;
  --color-brand-line: #d9e0ee;
  --color-brand-body: #33405c;
  --font-race: var(--font-barlow), 'Arial Narrow', sans-serif;
  --font-ui: var(--font-manrope), system-ui, sans-serif;
}
```

- [ ] **Step 3: 회사·내비 문구**

`src/content/site.ts`:
```ts
import { COMPANY_INFO } from '@/lib/businessCardConfig';

export const SITE = {
  name: 'UNIK',
  operator: 'CDC Travel (Cebu Direct Club)',
  address: COMPANY_INFO.address,
  phone: COMPANY_INFO.officePhone,
  email: COMPANY_INFO.representativeEmail,
  url: 'https://unik.ph',
} as const;

export const NAV_LINKS = [
  { href: '/seoul-marathon', label: 'Seoul Marathon' },
  { href: '/tour', label: 'The Tour' },
  { href: '/artjoy', label: 'Run with Artjoy' },
  { href: '/faq', label: 'FAQ' },
] as const;

export const FOOTER_LINKS = [
  { href: '/past-tours', label: 'Past tours' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund-policy', label: 'Refund policy' },
] as const;
```
(`businessCardConfig.ts` 는 읽기만 한다 — 수정 금지.)

- [ ] **Step 4: 공용 컴포넌트**

`src/components/site/Section.tsx`:
```tsx
import type { ReactNode } from 'react';

const TONES = {
  white: 'bg-white text-brand-body',
  soft: 'bg-brand-soft text-brand-body',
  ink: 'bg-brand-ink text-white',
} as const;

export function Section({
  id,
  tone = 'white',
  width = 'wide',
  className = '',
  children,
}: {
  id?: string;
  tone?: keyof typeof TONES;
  /** wide = 1200px, narrow = 880px (FAQ·약관·완료 페이지처럼 글 위주) */
  width?: 'wide' | 'narrow';
  className?: string;
  children: ReactNode;
}) {
  const max = width === 'narrow' ? 'max-w-[880px]' : 'max-w-[1200px]';
  return (
    <section id={id} className={TONES[tone]}>
      <div className={`mx-auto ${max} px-4 py-16 sm:px-6 sm:py-24 ${className}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = 'light',
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <p className={`text-[13px] font-extrabold tracking-[0.16em] ${tone === 'dark' ? 'text-brand-sun' : 'text-brand-red'}`}>
        {eyebrow}
      </p>
      <h2
        className={`font-race text-5xl font-extrabold uppercase leading-none sm:text-[56px] ${tone === 'dark' ? 'text-white' : 'text-brand-ink'}`}
      >
        {title}
      </h2>
      {intro ? <p className="text-lg">{intro}</p> : null}
    </div>
  );
}
```
`src/components/site/ButtonLink.tsx`:
```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

const VARIANTS = {
  primary: 'bg-brand-red text-white hover:brightness-110',
  'outline-light': 'border-2 border-white/60 text-white hover:bg-white/10',
  'outline-dark': 'border-2 border-brand-ink text-brand-ink hover:bg-brand-soft',
} as const;

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: 'md' | 'lg';
  children: ReactNode;
}) {
  const sizing = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base';
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full font-extrabold no-underline transition ${sizing} ${VARIANTS[variant]}`}
    >
      {children}
    </Link>
  );
}
```
`src/components/site/PhotoCredit.tsx`:
```tsx
export function PhotoCredit({ children = 'Photo: Seoul Marathon' }: { children?: string }) {
  return <span className="absolute bottom-2.5 left-3 text-[11px] text-white/85">{children}</span>;
}
```
`src/components/site/Header.tsx` (모바일은 `<details>` 메뉴로 JS 없이 동작):
```tsx
import Link from 'next/link';
import { NAV_LINKS } from '@/content/site';
import { ButtonLink } from './ButtonLink';

export function Header() {
  return (
    <header className="bg-brand-ink text-white">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2.5 no-underline">
          <span className="font-race text-3xl font-extrabold tracking-[0.06em]">UNIK</span>
          <span className="text-xs text-white/75">by CDC Travel</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-[15px] font-semibold md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white no-underline hover:text-brand-sun">
              {l.label}
            </Link>
          ))}
          <ButtonLink href="/apply">Apply now</ButtonLink>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
```
(`Header.tsx` 상단에 `import { MobileMenu } from './MobileMenu';` 추가.)

`src/components/site/MobileMenu.tsx` (`<details>` 기반이라 JS 없이도 열리고, 링크를 누르면 닫힌다 — 레이아웃이 유지되는 클라이언트 이동에서도 메뉴가 열린 채 남지 않게):
```tsx
'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { NAV_LINKS } from '@/content/site';

export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute('open');
  return (
    <details ref={ref} className="relative md:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-white/40 px-4 font-semibold">
        Menu
      </summary>
      <nav
        aria-label="Main mobile"
        className="absolute right-0 z-20 mt-2 flex w-60 flex-col gap-1 rounded-2xl bg-white p-3 text-brand-ink shadow-xl"
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} className="rounded-lg px-3 py-3 font-semibold no-underline hover:bg-brand-soft">
            {l.label}
          </Link>
        ))}
        <Link href="/apply" onClick={close} className="mt-1 rounded-full bg-brand-red px-3 py-3 text-center font-extrabold text-white no-underline">
          Apply now
        </Link>
      </nav>
    </details>
  );
}
```
`src/components/site/Footer.tsx`:
```tsx
import Link from 'next/link';
import { FOOTER_LINKS, SITE } from '@/content/site';

export function Footer() {
  return (
    <footer className="bg-[#0A0C10] text-sm text-white/75">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-4 py-10 sm:px-6">
        <div className="flex max-w-xl flex-col gap-1.5">
          <p className="font-race text-2xl font-extrabold tracking-[0.06em] text-white">
            UNIK <span className="font-ui text-[13px] font-semibold tracking-normal text-white/70">by {SITE.operator}</span>
          </p>
          <p>{SITE.address}</p>
          <p>
            {SITE.phone} · <a href={`mailto:${SITE.email}`} className="text-white/85">{SITE.email}</a>
          </p>
          <p>© {new Date().getFullYear()} CDC Travel. All rights reserved.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-5">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/85">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
```
`src/components/site/PromoCodeCapture.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { savePromoCode } from '@/lib/promo/storage';
import { browserStore } from '@/lib/store';

/** 어느 공개 페이지든 ?code=XXX 로 들어오면 30일간 기억한다. */
export function PromoCodeCapture() {
  const params = useSearchParams();
  const code = params.get('code');
  useEffect(() => {
    if (code) savePromoCode(browserStore(), code, Date.now());
  }, [code]);
  return null;
}
```

- [ ] **Step 5: 공개 레이아웃과 임시 홈**

```bash
git rm -q frontend/web/src/app/page.tsx
```
`src/app/(site)/layout.tsx`:
```tsx
import { Suspense } from 'react';
import { Barlow_Condensed, Manrope } from 'next/font/google';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { PromoCodeCapture } from '@/components/site/PromoCodeCapture';

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-barlow',
  display: 'swap',
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${barlow.variable} ${manrope.variable} font-ui min-h-screen bg-white text-base leading-relaxed text-brand-body`}>
      <Suspense fallback={null}>
        <PromoCodeCapture />
      </Suspense>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```
`src/app/(site)/page.tsx` (Task 6 에서 교체):
```tsx
export default function HomePage() {
  return <div className="px-6 py-24 text-center font-race text-5xl font-extrabold uppercase text-brand-ink">Seoul Marathon 2027</div>;
}
```

- [ ] **Step 6: 옛 주소 리다이렉트, sitemap, robots, ContactMessage.phone**

`next.config.js` 의 `nextConfig` 객체에 추가(기존 키 변경 금지):
```js
  async redirects() {
    const toPastTours = (source) => ({ source, destination: '/past-tours', permanent: true });
    return [
      toPastTours('/cbm'),
      toPastTours('/cbm/:path*'),
      toPastTours('/cherry-blossom-marathon'),
      toPastTours('/tour/courtside'),
      toPastTours('/tour/courtside/:path*'),
      toPastTours('/tour/cherry-blossom'),
      toPastTours('/players'),
      toPastTours('/players/:path*'),
      toPastTours('/gallery'),
      toPastTours('/info'),
      toPastTours('/cdc-travel/:path*'),
      { source: '/register', destination: '/apply', permanent: true },
    ];
  },
```
`src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next';

const PATHS = ['', '/seoul-marathon', '/tour', '/artjoy', '/faq', '/apply', '/past-tours', '/contact', '/terms', '/privacy', '/refund-policy'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `https://unik.ph${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }));
}
```
`src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/profile', '/apply/thanks'] },
    sitemap: 'https://unik.ph/sitemap.xml',
  };
}
```
`shared/types/index.ts` 의 `ContactMessage` 에 `phone?: string;` 추가.

- [ ] **Step 7: 확인**

Run: `pnpm --filter @unik/web exec tsc --noEmit && pnpm --filter @unik/web build`
Expected: 성공. 라우트에 `/`(site), `/sitemap.xml`, `/robots.txt` 포함.
dev 서버(`.claude/launch.json` 의 `web`)로 확인:
- `http://localhost:3000/` 에 남색 헤더·푸터, 모바일 375px 에서 Menu 가 열린다.
- `http://localhost:3000/cbm` → `/past-tours` 로 이동(404 여도 이동만 확인; 페이지는 Task 7).
- `http://localhost:3000/?code=ta-test` 방문 후 브라우저 콘솔 `localStorage.getItem('unik.promoCode')` 에 `TA-TEST` 저장.
- `http://localhost:3000/profile/adamkim` 이 이전과 동일(Outfit 글꼴, 명함 레이아웃).

- [ ] **Step 8: Commit**
```bash
git add -A frontend/web shared/types
git commit -m "feat(web): 공개 사이트 레이아웃·디자인 토큰·헤더/푸터·추천코드 저장·옛 주소 리다이렉트"
```

---

### Task 6: 콘텐츠 모듈 + 랜딩 페이지

**Files:**
- Create: `src/content/{race,tour,artjoy,faq,pastTours}.ts`
- Modify: `src/app/(site)/page.tsx` (전체 교체)

**Interfaces:**
- Consumes: Task 5 컴포넌트·토큰, Task 2 `fetchTourConfig`, `lowestPrice`, `formatPHP`
- Produces: `RACE`, `PACKAGES`, `INCLUSIONS`, `EXCLUSIONS`, `ITINERARY`, `ARTJOY`, `FAQ`, `PAST_TOURS` (Task 7 페이지들이 재사용)

- [ ] **Step 1: 콘텐츠 모듈**

`src/content/race.ts`:
```ts
export const RACE = {
  name: 'Seoul Marathon 2027',
  edition: 'The 97th Dong-A Marathon',
  date: 'Sunday, March 21, 2027',
  dateShort: 'MARCH 21, 2027',
  city: 'Seoul, South Korea',
  categories: [
    { key: 'full', label: 'Full Marathon', distance: '42.195 km', assembly: 'Gwanghwamun Square (planned)' },
    { key: 'tenK', label: '10K', distance: '10 km', assembly: 'Jamsil Sports Complex (planned)' },
  ],
  courseNote: 'The official course map will be released by the organizers.',
  timeLimit: 'To be announced by the organizers',
  officialSite: 'https://www.seoul-marathon.com',
  bibsTotal: 200,
} as const;
```
`src/content/tour.ts`:
```ts
import type { Category } from '@unik/shared/domain';

export const PACKAGES: { category: Category; title: string; description: string }[] = [
  { category: 'full', title: 'Full Marathon Runner', description: 'Race entry for the 42.195 km full marathon.' },
  { category: 'tenK', title: '10K Runner', description: 'Race entry for the 10 km course.' },
  { category: 'companion', title: 'Companion', description: 'For family and friends coming to cheer. No race entry.' },
];

export const INCLUSIONS = [
  'Round-trip flights from Manila or Cebu [TBC]',
  'Hotel in Seoul [number of nights TBC]',
  'Race entry and bib for runners',
  'Airport and race-day transfers',
  'Group sessions with Artjoy Torregosa',
  'English and Korean-speaking tour staff [TBC]',
];

export const EXCLUSIONS = ['Korean visa fees', 'Travel insurance [TBC]', 'Meals not listed in the itinerary', 'Personal expenses'];

export const ITINERARY = [
  { day: 'DAY 1', title: 'Fly to Seoul.', detail: 'Airport pickup and hotel check-in.' },
  { day: 'DAY 2', title: 'Bib pickup at the race expo.', detail: 'Shakeout run and strategy clinic with Artjoy.' },
  { day: 'DAY 3', title: 'Race day: Seoul Marathon 2027.', detail: 'Finisher dinner in the evening.' },
  { day: 'DAY 4', title: 'Recovery day.', detail: 'Seoul city tour [TBC].' },
  { day: 'DAY 5', title: 'Fly home.', detail: '' },
];
export const ITINERARY_NOTE = 'Draft itinerary, subject to flight schedule.';
```
`src/content/artjoy.ts`:
```ts
export const ARTJOY = {
  name: 'Artjoy Torregosa',
  title: "Philippine women's marathon record holder",
  record: '2:33:48 at the 2026 Tokyo Marathon',
  intro: 'Artjoy travels with the group from departure day to the finish line in Seoul.',
  program: [
    { title: 'Shakeout run in Seoul', detail: 'An easy group run with Artjoy the day before the race.' },
    { title: 'Race strategy clinic', detail: 'Pacing, fueling and course tips from a record holder.' },
    { title: 'Race-morning send-off', detail: 'Warm-up together and start-line support.' },
    { title: 'Finisher dinner and photo session', detail: 'Celebrate the finish with the group and Artjoy.' },
  ],
  programNote: 'Program details to be confirmed.',
  image: '/images/artjoy-torregosa-poster.webp',
  imageAlt: 'Artjoy Torregosa running in a Pilipinas singlet in front of Gwanghwamun Gate',
} as const;
```
`src/content/faq.ts`:
```ts
export const FAQ = [
  {
    q: 'Do I need a visa for Korea?',
    a: 'Philippine passport holders generally need a Korean visa. We will guide you through the requirements after you apply.',
  },
  {
    q: 'Do I pay when I apply?',
    a: 'No. Our team will contact you to confirm your slot, then send payment details for the deposit.',
  },
  {
    q: 'I was referred by a travel agency. What do I do?',
    a: 'Use the link your agency sent you, or enter the promo code they gave you on the application form.',
  },
  {
    q: 'Can I apply for a group?',
    a: 'Yes. One application can include up to 10 travelers. You can add their details later.',
  },
  {
    q: 'What if the tour is full?',
    a: 'You can still apply. We will put you on the waitlist and contact you if a slot opens.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'See our refund policy for the full details.',
    link: { href: '/refund-policy', label: 'Refund policy' },
  },
] as const;
```
`src/content/pastTours.ts`:
```ts
export const PAST_TOURS = [
  {
    year: '2026',
    title: 'Cherry Blossom Marathon Tour',
    summary: 'Filipino runners raced through cherry-blossom season in Korea with CDC Travel. [Recap TBC]',
  },
  {
    year: '[YEAR]',
    title: 'KBL All-Star Courtside Tour',
    summary: 'Filipino basketball fans watched the KBL All-Star game courtside in Korea. [Recap TBC]',
  },
] as const;
```

- [ ] **Step 2: 랜딩 페이지**

`src/app/(site)/page.tsx` — 시안 `docs/design/mockups/Main.dc.html` 의 섹션 순서·문구·간격을 따르되 데이터는 콘텐츠 모듈에서 가져온다. 아래 코드 전체로 교체:
```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES, formatPHP } from '@unik/shared/domain';
import { ButtonLink } from '@/components/site/ButtonLink';
import { PhotoCredit } from '@/components/site/PhotoCredit';
import { Section, SectionHeading } from '@/components/site/Section';
import { ARTJOY } from '@/content/artjoy';
import { FAQ } from '@/content/faq';
import { PAST_TOURS } from '@/content/pastTours';
import { RACE } from '@/content/race';
import { INCLUSIONS, PACKAGES } from '@/content/tour';
import { fetchTourConfig, lowestPrice } from '@/lib/tour/publicData';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Seoul Marathon 2027 Tour with Artjoy Torregosa',
  description:
    "Race the 2027 Seoul Marathon (March 21, 2027) with Artjoy Torregosa, the Philippine women's marathon record holder. Flights, hotel, race entry and support from the Philippines.",
};

function Check() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export default async function HomePage() {
  const config = await fetchTourConfig();
  const fromPrice = (c: (typeof CATEGORIES)[number]) => {
    const p = config ? lowestPrice(config, c) : null;
    return p === null ? 'Prices coming soon' : `From ${formatPHP(p)}`;
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-4 pb-16 pt-12 sm:px-6">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
            <p className="text-[13px] font-bold tracking-[0.16em] text-brand-sun">SEOUL MARATHON 2027 · TOUR PACKAGE</p>
            <h1 className="font-race text-[clamp(56px,7vw,96px)] font-extrabold uppercase italic leading-[0.92]">
              Run Seoul.
              <br />
              <span className="text-brand-sun">With Artjoy.</span>
            </h1>
            <p className="max-w-[540px] text-[19px] text-white/90">
              Race the 2027 Seoul Marathon alongside {ARTJOY.name}, the {ARTJOY.title}. Flights, hotel, race entry and
              race-weekend support in one package from the Philippines.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/apply" size="lg">Apply now</ButtonLink>
              <ButtonLink href="/tour" variant="outline-light" size="lg">See the tour</ButtonLink>
            </div>
            <p className="text-sm text-white/70">Booking through a travel agency? Use their link or have their promo code ready.</p>
          </div>
          <div className="relative h-[420px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-3xl sm:h-[520px]">
            <Image
              src="/images/seoul-marathon-gwanghwamun.jpg"
              alt="Runners passing the Admiral Yi Sun-sin statue at Gwanghwamun Square during the Seoul Marathon"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 560px"
              className="object-cover object-[45%_50%]"
            />
            <PhotoCredit />
          </div>
        </div>
        <div className="border-t border-white/15">
          <dl className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 px-4 py-7 sm:px-6">
            {[
              [RACE.dateShort, 'Race day, Sunday'],
              ['FULL · 10K', 'Plus a companion package for non-runners'],
              ['MNL · CEB', 'Departures [to be confirmed]'],
              [`${RACE.bibsTotal} BIBS`, 'Limited race entries for this tour'],
            ].map(([big, small]) => (
              <div key={big}>
                <dt className="font-race text-[34px] font-extrabold leading-tight text-brand-sun">{big}</dt>
                <dd className="text-sm text-white/75">{small}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Artjoy */}
      <Section id="artjoy">
        <div className="flex flex-wrap items-center gap-14">
          <div className="relative aspect-[2/3] w-full max-w-[460px] flex-[1_1_380px] overflow-hidden rounded-3xl">
            <Image src={ARTJOY.image} alt={ARTJOY.imageAlt} fill sizes="(max-width: 900px) 100vw, 460px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-5">
            <SectionHeading
              eyebrow="YOUR RUNNING CAPTAIN"
              title={`Meet ${ARTJOY.name}`}
              intro={`The ${ARTJOY.title}, ${ARTJOY.record}. ${ARTJOY.intro}`}
            />
            <ul className="mt-2 flex flex-col gap-4">
              {ARTJOY.program.map((p) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-soft text-brand-red">
                    <Check />
                  </span>
                  <span>
                    <span className="block font-extrabold text-brand-ink">{p.title}</span>
                    <span className="text-[15px]">{p.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] opacity-80">{ARTJOY.programNote}</p>
            <Link href="/artjoy" className="font-bold text-brand-red">More about Artjoy →</Link>
          </div>
        </div>
      </Section>

      {/* Race */}
      <Section id="race" tone="soft" className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="THE RACE"
          title={RACE.name}
          intro={`${RACE.edition}. One of Asia's major city marathons, running through the heart of Seoul in early spring.`}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {[
            ['RACE DATE', RACE.date, RACE.city],
            ['CATEGORIES', 'Full Marathon · 10K', '42.195 km or 10 km'],
            ['ASSEMBLY POINT', 'Gwanghwamun Square', `Full marathon (planned). 10K: Jamsil Sports Complex (planned). ${RACE.courseNote}`],
            ['TIME LIMIT', '[TBA]', RACE.timeLimit],
          ].map(([label, value, note]) => (
            <div key={label} className="flex flex-col gap-1.5 rounded-[20px] bg-white p-7">
              <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{label}</p>
              <p className="text-[22px] font-extrabold text-brand-ink">{value}</p>
              <p className="text-sm">{note}</p>
            </div>
          ))}
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-3xl sm:h-[420px]">
          <Image
            src="/images/seoul-marathon-runners.jpg"
            alt="Thousands of Seoul Marathon runners filling a city road at dawn"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
          <PhotoCredit />
        </div>
      </Section>

      {/* Packages */}
      <Section id="tour" className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="THE TOUR"
          title="Everything handled. You just run."
          intro="Choose your package. Prices are per person on twin-share accommodation."
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {PACKAGES.map((pkg) => (
            <div key={pkg.category} className="flex flex-col gap-3 rounded-3xl border-2 border-brand-line p-8">
              <p className="font-race text-3xl font-extrabold uppercase text-brand-ink">{pkg.title}</p>
              <p className="text-[15px]">{pkg.description}</p>
              <p className="text-[28px] font-extrabold text-brand-ink">{fromPrice(pkg.category)}</p>
              <p className="text-sm">per person · twin share</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl bg-brand-soft p-8">
          <p className="mb-4 text-xl font-extrabold text-brand-ink">What&apos;s included</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="flex-none text-brand-red"><Check /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ButtonLink href="/tour" variant="outline-dark">Full tour details and itinerary</ButtonLink>
        </div>
      </Section>

      {/* Track record */}
      <Section tone="soft" className="flex flex-col gap-10">
        <SectionHeading eyebrow="OUR TRACK RECORD" title="We've taken Filipino fans to Korea before" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {PAST_TOURS.map((t) => (
            <div key={t.title} className="flex flex-col gap-2 rounded-3xl bg-white p-7">
              <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{t.year}</p>
              <p className="text-[22px] font-extrabold text-brand-ink">{t.title}</p>
              <p>{t.summary}</p>
            </div>
          ))}
        </div>
        <Link href="/past-tours" className="font-bold text-brand-red">See all past tours →</Link>
      </Section>

      {/* FAQ preview */}
      <Section id="faq" width="narrow" className="flex flex-col gap-8">
        <h2 className="font-race text-5xl font-extrabold uppercase text-brand-ink sm:text-[56px]">FAQ</h2>
        <dl className="border-t-2 border-brand-line">
          {FAQ.slice(0, 4).map((f) => (
            <div key={f.q} className="flex flex-col gap-1.5 border-b border-brand-line py-5">
              <dt className="text-lg font-extrabold text-brand-ink">{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/faq" className="font-bold text-brand-red">All questions →</Link>
      </Section>

      {/* CTA */}
      <section className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-4 py-20 sm:px-6">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-3">
            <h2 className="font-race text-5xl font-extrabold uppercase italic leading-none sm:text-[56px]">
              Slots are limited. <span className="text-brand-sun">Secure yours.</span>
            </h2>
            <p className="text-lg text-white/85">Apply now with no payment. Our team will contact you to confirm details.</p>
          </div>
          <ButtonLink href="/apply" size="lg">Apply now</ButtonLink>
        </div>
      </section>
    </>
  );
}
```
FAQ 미리보기는 `width="narrow"` 로 880px 폭을 쓴다.

- [ ] **Step 3: 확인**

Run: `pnpm --filter @unik/web exec tsc --noEmit && pnpm --filter @unik/web build` → 성공.
dev 서버에서 `/` 를 데스크톱·모바일(375px) 스크린샷: 시안과 같은 섹션 순서, 가로 스크롤 없음, 사진 2장·포스터 표시. tourConfig 가 없으면 가격 칸은 "Prices coming soon".

- [ ] **Step 4: Commit**
```bash
git add frontend/web/src/content frontend/web/src/app/\(site\)/page.tsx
git commit -m "feat(web): 랜딩 페이지와 사이트 콘텐츠 모듈"
```

---

### Task 7: 정보 페이지 — 대회, 투어, 아트조이, FAQ, 과거 투어

**Files:**
- Create: `src/app/(site)/seoul-marathon/page.tsx`, `tour/page.tsx`, `artjoy/page.tsx`, `faq/page.tsx`, `past-tours/page.tsx`

**Interfaces:**
- Consumes: Task 5·6 의 컴포넌트·콘텐츠, Task 2 `fetchTourConfig`, `formatPHP`, `describeCounts` 불필요

- [ ] **Step 1: 페이지 작성** (각 파일 전체)

`src/app/(site)/seoul-marathon/page.tsx`:
```tsx
import Image from 'next/image';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { PhotoCredit } from '@/components/site/PhotoCredit';
import { Section, SectionHeading } from '@/components/site/Section';
import { RACE } from '@/content/race';

export const metadata: Metadata = {
  title: 'Seoul Marathon 2027',
  description: `${RACE.edition} on ${RACE.date}. Full marathon and 10K race information for our tour participants.`,
};

export default function SeoulMarathonPage() {
  return (
    <>
      <Section tone="ink">
        <SectionHeading tone="dark" eyebrow="THE RACE" title={RACE.name} intro={`${RACE.edition} · ${RACE.date} · ${RACE.city}`} />
      </Section>
      <Section className="flex flex-col gap-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {RACE.categories.map((c) => (
            <div key={c.key} className="flex flex-col gap-2 rounded-3xl border-2 border-brand-line p-8">
              <p className="font-race text-3xl font-extrabold uppercase text-brand-ink">{c.label}</p>
              <p className="text-lg font-bold">{c.distance}</p>
              <p>Assembly: {c.assembly}</p>
            </div>
          ))}
        </div>
        <dl className="grid gap-4 rounded-3xl bg-brand-soft p-8 sm:grid-cols-2">
          <div><dt className="font-extrabold text-brand-ink">Race date</dt><dd>{RACE.date}</dd></div>
          <div><dt className="font-extrabold text-brand-ink">Course</dt><dd>{RACE.courseNote}</dd></div>
          <div><dt className="font-extrabold text-brand-ink">Time limit</dt><dd>{RACE.timeLimit}</dd></div>
          <div>
            <dt className="font-extrabold text-brand-ink">Official website</dt>
            <dd><a href={RACE.officialSite} className="text-brand-red" rel="noopener noreferrer" target="_blank">seoul-marathon.com</a></dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold text-brand-ink">How race entry works on this tour</h2>
          <p>
            General registration for the 2027 race has closed. Our tour has {RACE.bibsTotal} race entries allocated through our
            partnership, shared between the full marathon and the 10K. We register you with the organizers once your slot is
            confirmed. Entries are first come, first served.
          </p>
          <p className="text-sm">Full marathon eligibility requirements, if any, will be confirmed with you after you apply. [TBC]</p>
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-3xl sm:h-[420px]">
          <Image src="/images/seoul-marathon-runners.jpg" alt="Thousands of Seoul Marathon runners filling a city road at dawn" fill sizes="100vw" className="object-cover" />
          <PhotoCredit />
        </div>
        <div><ButtonLink href="/apply">Apply for the tour</ButtonLink></div>
      </Section>
    </>
  );
}
```
`src/app/(site)/tour/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { formatPHP } from '@unik/shared/domain';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { EXCLUSIONS, INCLUSIONS, ITINERARY, ITINERARY_NOTE, PACKAGES } from '@/content/tour';
import { fetchTourConfig } from '@/lib/tour/publicData';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'The Tour',
  description: 'Packages, prices, departures, inclusions and itinerary for the Seoul Marathon 2027 tour.',
};

export default async function TourPage() {
  const config = await fetchTourConfig();
  const departures = config?.departures.filter((d) => d.isOpen) ?? [];
  return (
    <>
      <Section tone="ink">
        <SectionHeading tone="dark" eyebrow="THE TOUR" title="Everything handled. You just run." intro="Prices are per person on twin-share accommodation." />
      </Section>
      <Section className="flex flex-col gap-12">
        {departures.length === 0 ? (
          <p className="rounded-2xl bg-brand-soft p-6 font-semibold text-brand-ink">Departures and prices will be announced soon.</p>
        ) : (
          departures.map((d) => (
            <div key={d.id} className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-brand-ink">
                {d.label} · {d.departDate} to {d.returnDate}
              </h2>
              {d.flightInfo ? <p className="text-sm">{d.flightInfo}</p> : null}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                {PACKAGES.map((p) => (
                  <div key={p.category} className="rounded-3xl border-2 border-brand-line p-6">
                    <p className="font-race text-2xl font-extrabold uppercase text-brand-ink">{p.title}</p>
                    <p className="text-[26px] font-extrabold text-brand-ink">{formatPHP(d.prices[p.category])}</p>
                    <p className="text-sm">{p.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Single room supplement: {formatPHP(d.singleSupplement)} per person. Deposit after confirmation:{' '}
                {config ? formatPHP(config.depositPerPax) : ''} per person.
              </p>
            </div>
          ))
        )}
        <div className="flex flex-wrap gap-6">
          <div className="min-w-0 flex-[1_1_420px] rounded-3xl bg-brand-soft p-8">
            <h2 className="mb-4 text-xl font-extrabold text-brand-ink">What&apos;s included</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">{INCLUSIONS.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div className="min-w-0 flex-[1_1_320px] rounded-3xl border-2 border-brand-line p-8">
            <h2 className="mb-4 text-xl font-extrabold text-brand-ink">Not included</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">{EXCLUSIONS.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-extrabold text-brand-ink">Itinerary</h2>
            <p className="text-sm">{ITINERARY_NOTE}</p>
          </div>
          <ol className="border-t-2 border-brand-line">
            {ITINERARY.map((d) => (
              <li key={d.day} className="flex flex-wrap gap-x-6 gap-y-2 border-b border-brand-line py-4">
                <span className="w-[90px] flex-none font-race text-2xl font-extrabold text-brand-red">{d.day}</span>
                <span className="flex-[1_1_400px]"><b className="text-brand-ink">{d.title}</b> {d.detail}</span>
              </li>
            ))}
          </ol>
        </div>
        <div><ButtonLink href="/apply">Apply now</ButtonLink></div>
      </Section>
    </>
  );
}
```
`src/app/(site)/artjoy/page.tsx`:
```tsx
import Image from 'next/image';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { ARTJOY } from '@/content/artjoy';

export const metadata: Metadata = {
  title: 'Run with Artjoy Torregosa',
  description: `${ARTJOY.name}, the ${ARTJOY.title}, travels with our Seoul Marathon 2027 group.`,
};

export default function ArtjoyPage() {
  return (
    <Section className="flex flex-wrap items-start gap-14">
      <div className="relative aspect-[2/3] w-full max-w-[460px] flex-[1_1_360px] overflow-hidden rounded-3xl">
        <Image src={ARTJOY.image} alt={ARTJOY.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 460px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
        <SectionHeading eyebrow="YOUR RUNNING CAPTAIN" title={ARTJOY.name} intro={`The ${ARTJOY.title}: ${ARTJOY.record}.`} />
        <p className="text-lg">{ARTJOY.intro}</p>
        <h2 className="text-2xl font-extrabold text-brand-ink">On tour with Artjoy</h2>
        <ul className="flex flex-col gap-4">
          {ARTJOY.program.map((p) => (
            <li key={p.title} className="rounded-2xl bg-brand-soft p-5">
              <p className="font-extrabold text-brand-ink">{p.title}</p>
              <p>{p.detail}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-80">{ARTJOY.programNote}</p>
        <div><ButtonLink href="/apply">Run Seoul with Artjoy</ButtonLink></div>
      </div>
    </Section>
  );
}
```
`src/app/(site)/faq/page.tsx`:
```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { Section } from '@/components/site/Section';
import { FAQ } from '@/content/faq';

export const metadata: Metadata = { title: 'FAQ', description: 'Answers to common questions about the Seoul Marathon 2027 tour.' };

export default function FaqPage() {
  return (
    <Section width="narrow" className="flex flex-col gap-8">
      <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink sm:text-[56px]">FAQ</h1>
      <dl className="border-t-2 border-brand-line">
        {FAQ.map((f) => (
          <div key={f.q} className="flex flex-col gap-1.5 border-b border-brand-line py-5">
            <dt className="text-lg font-extrabold text-brand-ink">{f.q}</dt>
            <dd>
              {f.a}{' '}
              {'link' in f && f.link ? <Link href={f.link.href} className="font-bold text-brand-red">{f.link.label}</Link> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        Still have a question? <Link href="/contact" className="font-bold text-brand-red">Contact us</Link>.
      </p>
    </Section>
  );
}
```
`src/app/(site)/past-tours/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/site/ButtonLink';
import { Section, SectionHeading } from '@/components/site/Section';
import { PAST_TOURS } from '@/content/pastTours';

export const metadata: Metadata = { title: 'Past tours', description: 'Tours CDC Travel has run for Filipino fans and runners in Korea.' };

export default function PastToursPage() {
  return (
    <Section className="flex flex-col gap-10">
      <SectionHeading eyebrow="OUR TRACK RECORD" title="We've taken Filipino fans to Korea before" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {PAST_TOURS.map((t) => (
          <article key={t.title} className="flex flex-col gap-2 rounded-3xl bg-brand-soft p-8">
            <p className="text-[13px] font-bold tracking-[0.1em] text-brand-red">{t.year}</p>
            <h2 className="text-2xl font-extrabold text-brand-ink">{t.title}</h2>
            <p>{t.summary}</p>
          </article>
        ))}
      </div>
      <div><ButtonLink href="/">Join us for Seoul Marathon 2027</ButtonLink></div>
    </Section>
  );
}
```

- [ ] **Step 2: 확인** — `pnpm --filter @unik/web build` 성공. dev 서버에서 다섯 페이지를 모바일 375px 로 열어 가로 스크롤 없음·헤더 메뉴 동작 확인, `/cbm` → `/past-tours` 정상 표시.

- [ ] **Step 3: Commit**
```bash
git add frontend/web/src/app/\(site\)
git commit -m "feat(web): 대회·투어·아트조이·FAQ·과거 투어 페이지"
```

---

### Task 8: 약관 3종 + 문의 페이지

**Files:**
- Create: `src/content/legal.ts`, `src/app/(site)/{terms,privacy,refund-policy}/page.tsx`, `src/components/site/LegalPage.tsx`, `src/app/(site)/contact/page.tsx`, `src/app/(site)/contact/ContactForm.tsx`

**Interfaces:**
- Consumes: `createContactMessage` (`src/lib/services/contacts.ts`), `SITE`, `isValidName`, `EMAIL_PATTERN`, `hasControlCharsExceptWhitespace`
- Produces: `LEGAL.{terms,privacy,refund}: { title: string; updated: string; sections: { heading: string; body: string[] }[] }`

- [ ] **Step 1: 약관 문구 (초안 — 오픈 전 CDC 검토 필수, 이월 목록에 기록)**

`src/content/legal.ts`:
```ts
import { SITE } from './site';

type LegalDoc = { title: string; updated: string; sections: { heading: string; body: string[] }[] };

const UPDATED = 'October 2026';

export const LEGAL: Record<'terms' | 'privacy' | 'refund', LegalDoc> = {
  terms: {
    title: 'Terms and Conditions',
    updated: UPDATED,
    sections: [
      { heading: 'Who we are', body: [`This website is operated by ${SITE.operator}, ${SITE.address}.`] },
      {
        heading: 'Applications',
        body: [
          'Submitting an application does not guarantee a place on the tour. Your place is confirmed only after our team contacts you and we receive your deposit.',
          'Race entries are limited and allocated first come, first served. If the tour is full, your application is placed on a waitlist.',
        ],
      },
      {
        heading: 'Prices and payment',
        body: [
          'Prices are in Philippine pesos (PHP) per person on twin-share accommodation unless stated otherwise. Promo code discounts apply per person to the package price only.',
          'Deposit and balance due dates are sent to you when your slot is confirmed. [Payment schedule TBC]',
        ],
      },
      {
        heading: 'Travel documents',
        body: ['You are responsible for a valid passport and any visa required to enter Korea. We will guide you through the requirements.'],
      },
      {
        heading: 'Changes',
        body: ['Race details are set by the race organizers and may change. Flight times and the itinerary may change for operational reasons. We will inform you of significant changes.'],
      },
      { heading: 'Contact', body: [`${SITE.email} · ${SITE.phone}`] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Contact details (name, email, mobile number), traveler details you choose to provide (name as in passport, date of birth, gender, nationality, T-shirt size, expected finish time, room preference, emergency contact) and any requests you send us.',
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          'To process your application, register runners with the race organizers, book flights and hotels, contact you about your booking, and meet legal requirements.',
          'If you applied through a travel agency promo code, we record which agency referred you.',
        ],
      },
      {
        heading: 'Who we share it with',
        body: ['Only with the race organizers, airlines, hotels and partners needed to deliver the tour. We do not sell your data.'],
      },
      {
        heading: 'How long we keep it',
        body: ['We keep traveler details until the tour is completed and settled, then delete or anonymize them within [N] months. [Retention period TBC]'],
      },
      {
        heading: 'Your rights',
        body: [`Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) you may access, correct or ask us to delete your data. Contact ${SITE.email}.`],
      },
    ],
  },
  refund: {
    title: 'Refund and Cancellation Policy',
    updated: UPDATED,
    sections: [
      { heading: 'Before confirmation', body: ['Applying is free. You can withdraw your application at any time before paying the deposit.'] },
      {
        heading: 'After payment',
        body: ['[Cancellation charges by date to be confirmed by CDC Travel before launch, including the non-refundable race entry and airfare portions.]'],
      },
      {
        heading: 'If the race is cancelled',
        body: ['[Policy to be confirmed by CDC Travel before launch.]'],
      },
      { heading: 'How to cancel', body: [`Email ${SITE.email} with your application number.`] },
    ],
  },
};
```
`src/components/site/LegalPage.tsx`:
```tsx
import { Section } from './Section';

export function LegalPage({ doc }: { doc: { title: string; updated: string; sections: { heading: string; body: readonly string[] }[] } }) {
  return (
    <Section width="narrow" className="flex flex-col gap-8">
      <div>
        <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink">{doc.title}</h1>
        <p className="text-sm">Last updated: {doc.updated}</p>
      </div>
      {doc.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-brand-ink">{s.heading}</h2>
          {s.body.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
    </Section>
  );
}
```
각 페이지 (`terms/page.tsx` 예시 — `privacy`, `refund-policy` 는 `LEGAL.privacy`, `LEGAL.refund` 와 제목만 다르게 동일 구조):
```tsx
import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = { title: LEGAL.terms.title };

export default function TermsPage() {
  return <LegalPage doc={LEGAL.terms} />;
}
```

- [ ] **Step 2: 문의 페이지**

`src/app/(site)/contact/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { SITE } from '@/content/site';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = { title: 'Contact', description: 'Questions about the Seoul Marathon 2027 tour? Contact CDC Travel.' };

export default function ContactPage() {
  return (
    <Section className="flex flex-wrap gap-12">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        <SectionHeading eyebrow="CONTACT" title="Talk to us" intro="We usually reply within 1 to 2 business days." />
        <p>{SITE.address}</p>
        <p>{SITE.phone}</p>
        <p><a href={`mailto:${SITE.email}`} className="text-brand-red">{SITE.email}</a></p>
      </div>
      <div className="min-w-0 flex-[1_1_480px]"><ContactForm /></div>
    </Section>
  );
}
```
`src/app/(site)/contact/ContactForm.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { EMAIL_PATTERN, hasControlCharsExceptWhitespace, isValidName } from '@unik/shared/domain';
import { createContactMessage } from '@/lib/services/contacts';

const input = 'min-h-12 w-full rounded-xl border-2 border-brand-line px-3.5 font-medium text-brand-ink';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();
    if (!isValidName(name)) return setError('Please enter your name.');
    if (!EMAIL_PATTERN.test(email)) return setError('Please enter a valid email address.');
    if (phone.length > 40) return setError('Please shorten the phone number.');
    if (!message || message.length > 5000 || hasControlCharsExceptWhitespace(message)) return setError('Please enter your message.');
    setError('');
    setStatus('sending');
    try {
      await createContactMessage({
        name,
        email,
        subject: form.subject.trim().slice(0, 200) || 'General inquiry',
        message,
        ...(phone ? { phone } : {}),
      });
      setStatus('sent');
    } catch (err) {
      console.error('contact submit failed', err);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p className="rounded-2xl bg-brand-soft p-6 font-semibold text-brand-ink">Thank you! We received your message and will reply by email.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Name *<input className={input} value={form.name} onChange={set('name')} autoComplete="name" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Email *<input className={input} type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Mobile (optional)<input className={input} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Subject<input className={input} value={form.subject} onChange={set('subject')} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">Message *<textarea className={`${input} py-3`} rows={5} value={form.message} onChange={set('message')} /></label>
      {error ? <p role="alert" className="font-semibold text-brand-red">{error}</p> : null}
      {status === 'error' ? <p role="alert" className="font-semibold text-brand-red">Sending failed. Please email us at the address on the left.</p> : null}
      <button type="submit" disabled={status === 'sending'} className="min-h-14 rounded-full bg-brand-red font-extrabold text-white disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
```
(`createContactMessage` 의 인자 타입은 `Omit<ContactMessage, 'id'|'createdAt'|'isRead'>` — Task 5 에서 `phone?` 추가됨. 규칙 화이트리스트 `{name,email,phone?,subject,message,isRead,createdAt}` 와 일치.)

- [ ] **Step 3: 확인**

`pnpm --filter @unik/web build` 성공. Firestore 에뮬레이터 + 규칙으로 문의 1건 전송 확인 (Task 10 의 에뮬레이터 실행 방법 참고; 여기서는 빌드·화면만 확인해도 된다).

- [ ] **Step 4: Commit**
```bash
git add frontend/web/src
git commit -m "feat(web): 약관·개인정보·환불 규정 초안 페이지와 문의 폼"
```

---

### Task 9: 신청 페이지 + 완료 페이지

**Files:**
- Create: `src/app/(site)/apply/page.tsx`, `src/app/(site)/apply/ApplyForm.tsx`, `src/app/(site)/apply/thanks/page.tsx`

**Interfaces:**
- Consumes: Task 2 (`subscribeTourData`, `departureStatus`, `loadPromoCode`, `browserStore`), Task 3 (`submitWithRetry`, `checkPromo`, `describeSubmitError`, `PROMO_REASON_MESSAGES`), Task 4 (`applyReducer`, `initialApplyState`, `validateForSubmit`, `toSubmitPayload`, `estimatePricing`, `saveDraft`, `loadDraft`, `clearDraft`), domain `formatPHP`, `describeCounts`, `manilaDate`, `CATEGORY_LABELS`, `TSHIRT_SIZES`, `totalPax`, `DIAL_CODES` (`src/lib/data/dialCodes.ts`)
- Produces: 완료 페이지 URL 규약 `/apply/thanks?app=<appNo>&status=<ApplicationStatus>`

- [ ] **Step 1: 페이지 셸**

`src/app/(site)/apply/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { ApplyForm } from './ApplyForm';

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Apply for the Seoul Marathon 2027 tour. Takes about 2 minutes, no payment now.',
};

export default function ApplyPage() {
  return (
    <div className="bg-brand-soft">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-24 pt-12 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-race text-[44px] font-extrabold uppercase leading-none text-brand-ink sm:text-[52px]">
            Apply for the Seoul Marathon 2027 Tour
          </h1>
          <p className="text-lg">Takes about 2 minutes. No payment now. Our team will contact you to confirm your slot.</p>
        </div>
        <ApplyForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 신청 폼 컴포넌트**

`src/app/(site)/apply/ApplyForm.tsx` — 시안 `docs/design/mockups/Apply.dc.html` 의 6개 fieldset 과 우측 요약 구조를 따른다:
```tsx
'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, CATEGORY_LABELS, TSHIRT_SIZES, formatPHP, manilaDate, totalPax } from '@unik/shared/domain';
import type { Availability, Category, TourConfig } from '@unik/shared/domain';
import { DIAL_CODES } from '@/lib/data/dialCodes';
import { checkPromo, submitWithRetry } from '@/lib/apply/api';
import { clearDraft, loadDraft, saveDraft } from '@/lib/apply/draft';
import { PROMO_REASON_MESSAGES, describeSubmitError } from '@/lib/apply/errors';
import { applyReducer, estimatePricing, initialApplyState, toSubmitPayload, validateForSubmit } from '@/lib/apply/model';
import type { TravelerField } from '@/lib/apply/model';
import { clearPromoCode, loadPromoCode } from '@/lib/promo/storage';
import { browserStore } from '@/lib/store';
import { departureStatus, subscribeTourData } from '@/lib/tour/publicData';

const field = 'min-h-12 w-full rounded-xl border-2 border-brand-line bg-white px-3.5 font-medium text-brand-ink';
const card = 'm-0 flex flex-col gap-4 rounded-[20px] border-0 bg-white p-6 sm:p-7';
const legend = 'float-left mb-1 w-full p-0 text-xl font-extrabold text-brand-ink';

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="text-sm font-semibold text-brand-red">{msg}</p> : null;
}

export function ApplyForm() {
  const router = useRouter();
  const [state, dispatch] = useReducer(applyReducer, null, () => initialApplyState(newKey()));
  const [data, setData] = useState<{ config: TourConfig | null; availability: Availability | null }>({ config: null, availability: null });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openTraveler, setOpenTraveler] = useState<number | null>(0);
  const restored = useRef(false);

  // 임시저장 복원 → 없으면 저장된 추천코드로 시작
  useEffect(() => {
    const store = browserStore();
    const draft = loadDraft(store);
    if (draft) dispatch({ type: 'restore', state: draft });
    else {
      const code = loadPromoCode(store, Date.now());
      if (code) dispatch({ type: 'setPromoInput', value: code });
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (restored.current) saveDraft(browserStore(), state);
  }, [state]);

  useEffect(
    () =>
      subscribeTourData((d) => {
        setData(d);
        setLoading(false);
      }),
    [],
  );

  // 저장된 코드가 있고 아직 확인 전이면 자동 확인
  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current || !restored.current || state.promo || !state.promoInput.trim()) return;
    autoChecked.current = true;
    void applyPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.promoInput]);

  const pricing = useMemo(() => (data.config ? estimatePricing(state, data.config) : null), [state, data.config]);
  const pax = totalPax(state.counts);
  const accepting = data.config?.acceptingApplications ?? false;

  async function applyPromo() {
    const code = state.promoInput.trim();
    if (!code) return;
    setCheckingPromo(true);
    setPromoMessage('');
    try {
      const r = await checkPromo(code, pax);
      if (r.valid) {
        dispatch({
          type: 'promoApplied',
          promo: { code: r.code, agencyName: r.agencyName, discountType: r.discountType, discountValue: r.discountValue, description: r.description },
        });
      } else {
        dispatch({ type: 'promoCleared' });
        setPromoMessage(PROMO_REASON_MESSAGES[r.reason]);
      }
    } catch {
      setPromoMessage("We couldn't check the code right now. You can still submit; we'll verify it.");
    } finally {
      setCheckingPromo(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    const found = validateForSubmit(state, manilaDate(new Date()));
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      const travelerMatch = /^travelers\.(\d+)\./.exec(first);
      if (travelerMatch) setOpenTraveler(Number(travelerMatch[1]));
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus());
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitWithRetry(toSubmitPayload(state));
      const store = browserStore();
      clearDraft(store);
      clearPromoCode(store);
      router.push(`/apply/thanks?app=${encodeURIComponent(res.appNo)}&status=${encodeURIComponent(res.status)}`);
    } catch (err) {
      const d = describeSubmitError(err);
      if (d.kind === 'promo_invalid') {
        dispatch({ type: 'promoCleared' });
        setPromoMessage(d.message);
      }
      if (d.kind === 'invalid_input' && d.issues) {
        setErrors(Object.fromEntries(d.issues.map((i) => [i.path, i.message])));
      }
      setSubmitError(d.message);
      setSubmitting(false);
    }
  }

  if (!loading && (!data.config || !accepting)) {
    return (
      <div className="rounded-[20px] bg-white p-8">
        <p className="text-xl font-extrabold text-brand-ink">Applications are currently closed.</p>
        <p>
          Please <a href="/contact" className="font-bold text-brand-red">contact us</a> and we will let you know when slots open.
        </p>
      </div>
    );
  }

  const departures = data.config?.departures ?? [];

  return (
    <div className="flex flex-wrap items-start gap-8">
      <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
        {/* 1. Departure */}
        <fieldset className={card}>
          <legend className={legend}>1. Choose your departure</legend>
          {loading ? <p>Loading departures…</p> : null}
          {departures.map((d) => {
            const status = data.config ? departureStatus(data.config, data.availability, d.id, state.counts) : 'closed';
            const selected = state.departureId === d.id;
            return (
              <label
                key={d.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 px-5 py-4 ${selected ? 'border-brand-red' : 'border-brand-line'} ${status === 'closed' ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="departure"
                  data-field="departureId"
                  className="h-5 w-5 accent-brand-red"
                  checked={selected}
                  disabled={status === 'closed'}
                  onChange={() => dispatch({ type: 'setDeparture', departureId: d.id })}
                />
                <span className="flex-[1_1_200px]">
                  <span className="block font-extrabold text-brand-ink">{d.label}</span>
                  <span className="text-sm">{d.departDate} to {d.returnDate}</span>
                </span>
                <span className="text-sm font-bold text-brand-red">
                  {status === 'closed' ? 'Closed' : status === 'full' ? 'Full · join the waitlist' : 'Available'}
                </span>
              </label>
            );
          })}
          <FieldError id="err-departure" msg={errors.departureId} />
        </fieldset>

        {/* 2. Travelers */}
        <fieldset className={card}>
          <legend className={legend}>2. Who&apos;s going?</legend>
          {CATEGORIES.map((c: Category) => {
            const dep = departures.find((d) => d.id === state.departureId);
            const price = dep ? formatPHP(dep.prices[c]) : 'Choose a departure to see prices';
            return (
              <div key={c} className="flex flex-wrap items-center gap-3 border-b border-brand-line py-3.5 last:border-0">
                <div className="flex-[1_1_240px]">
                  <p className="font-extrabold text-brand-ink">{c === 'companion' ? 'Companion (non-runner)' : `${CATEGORY_LABELS[c]} runner`}</p>
                  <p className="text-sm">{price}{dep ? ' per person' : ''}</p>
                </div>
                <div className="flex items-center gap-3.5">
                  <button type="button" aria-label={`Remove one ${CATEGORY_LABELS[c]}`} onClick={() => dispatch({ type: 'changeCount', category: c, delta: -1 })} className="h-11 w-11 rounded-full border-2 border-brand-line bg-white text-2xl font-bold text-brand-ink">−</button>
                  <span className="min-w-6 text-center text-xl font-extrabold text-brand-ink" aria-live="polite">{state.counts[c]}</span>
                  <button type="button" aria-label={`Add one ${CATEGORY_LABELS[c]}`} onClick={() => dispatch({ type: 'changeCount', category: c, delta: 1 })} className="h-11 w-11 rounded-full bg-brand-red text-2xl font-bold text-white">+</button>
                </div>
              </div>
            );
          })}
          <p className="text-sm">Up to 10 travelers per application.</p>
        </fieldset>

        {/* 3. Contact */}
        <fieldset className={card}>
          <legend className={legend}>3. Your contact details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['firstName', 'lastName'] as const).map((f) => (
              <label key={f} className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {f === 'firstName' ? 'First name *' : 'Last name *'}
                <input data-field={`lead.${f}`} className={field} value={state.lead[f]} autoComplete={f === 'firstName' ? 'given-name' : 'family-name'} aria-invalid={!!errors[`lead.${f}`]} onChange={(e) => dispatch({ type: 'setLead', field: f, value: e.target.value })} />
                <FieldError id={`err-${f}`} msg={errors[`lead.${f}`]} />
              </label>
            ))}
            <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Email *
              <input data-field="lead.email" type="email" className={field} value={state.lead.email} autoComplete="email" aria-invalid={!!errors['lead.email']} onChange={(e) => dispatch({ type: 'setLead', field: 'email', value: e.target.value })} />
              <FieldError id="err-email" msg={errors['lead.email']} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Mobile number *
              <span className="flex gap-2">
                <select aria-label="Country code" className={`${field} w-24`} value={state.lead.phoneDial} onChange={(e) => dispatch({ type: 'setLead', field: 'phoneDial', value: e.target.value })}>
                  {DIAL_CODES.map((d) => <option key={d.code} value={d.code}>{d.code}</option>)}
                </select>
                <input data-field="lead.phoneNumber" type="tel" className={`${field} min-w-0 flex-1`} value={state.lead.phoneNumber} autoComplete="tel-national" placeholder="917 123 4567" aria-invalid={!!errors['lead.phoneNumber']} onChange={(e) => dispatch({ type: 'setLead', field: 'phoneNumber', value: e.target.value })} />
              </span>
              <FieldError id="err-phone" msg={errors['lead.phoneNumber']} />
            </label>
          </div>
          <div className="flex flex-wrap gap-5 text-[15px]">
            {(['viber', 'whatsapp'] as const).map((f) => (
              <label key={f} className="flex items-center gap-2">
                <input type="checkbox" className="h-5 w-5 accent-brand-red" checked={state.lead[f]} onChange={(e) => dispatch({ type: 'setLead', field: f, value: e.target.checked })} />
                Reachable on {f === 'viber' ? 'Viber' : 'WhatsApp'}
              </label>
            ))}
          </div>
          {/* honeypot: 화면·스크린리더에서 숨김 */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={state.website} onChange={(e) => dispatch({ type: 'setHoneypot', value: e.target.value })} /></label>
          </div>
        </fieldset>

        {/* 4. Traveler details (optional) */}
        <fieldset className={card}>
          <legend className="float-left mb-1 flex w-full flex-wrap items-center gap-2.5 p-0">
            <span className="text-xl font-extrabold text-brand-ink">4. Traveler details</span>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[13px] font-bold text-brand-ink">Optional</span>
          </legend>
          <p className="text-[15px]">Busy? Skip this section. Our team will collect these details from you later.</p>
          {state.travelers.map((t, i) => {
            const open = openTraveler === i;
            const isRunner = t.category !== 'companion';
            const text = (f: TravelerField, label: string, extra: Record<string, string> = {}) => (
              <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {label}
                <input data-field={`travelers.${i}.${f}`} className={field} value={(t[f] as string | undefined) ?? ''} aria-invalid={!!errors[`travelers.${i}.${f}`]} onChange={(e) => dispatch({ type: 'setTraveler', index: i, field: f, value: e.target.value })} {...extra} />
                <FieldError id={`err-t${i}-${f}`} msg={errors[`travelers.${i}.${f}`]} />
              </label>
            );
            const select = (f: TravelerField, label: string, options: readonly (readonly [string, string])[]) => (
              <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
                {label}
                <select className={field} value={(t[f] as string | undefined) ?? ''} onChange={(e) => dispatch({ type: 'setTraveler', index: i, field: f, value: e.target.value })}>
                  <option value="">Select</option>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            );
            return (
              <div key={i} className="rounded-2xl border-2 border-brand-line">
                <button type="button" aria-expanded={open} onClick={() => setOpenTraveler(open ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-extrabold text-brand-ink">Traveler {i + 1} · {CATEGORY_LABELS[t.category]}</span>
                  <span className="font-bold text-brand-red">{open ? 'Hide' : 'Add details +'}</span>
                </button>
                {open ? (
                  <div className="grid gap-3.5 px-5 pb-5 sm:grid-cols-2">
                    {text('passportName', 'Name as in passport', { autoComplete: 'off' })}
                    {text('dob', 'Date of birth', { type: 'date' })}
                    {select('gender', 'Gender', [['female', 'Female'], ['male', 'Male']])}
                    {text('nationality', 'Nationality')}
                    {isRunner ? select('tshirtSize', 'T-shirt size', TSHIRT_SIZES.map((s) => [s, s] as const)) : null}
                    {isRunner ? text('expectedFinish', 'Expected finish time', { placeholder: 'e.g. 4:30' }) : null}
                    {select('room', 'Room', [['twin', 'Twin share'], ['single', 'Single (supplement applies)']])}
                    {text('emergencyContact', 'Emergency contact', { placeholder: 'Name and phone' })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>

        {/* 5. Promo */}
        <fieldset className={card}>
          <legend className={legend}>5. Promo code</legend>
          <p className="text-[15px]">Referred by a travel agency? Enter the code they gave you.</p>
          <div className="flex flex-wrap gap-2.5">
            <label className="flex flex-[1_1_240px] flex-col gap-1.5 text-sm font-bold text-brand-ink">
              Promo code
              <input className={`${field} font-bold tracking-[0.06em]`} value={state.promoInput} autoCapitalize="characters" onChange={(e) => dispatch({ type: 'setPromoInput', value: e.target.value })} />
            </label>
            <button type="button" onClick={() => void applyPromo()} disabled={checkingPromo || !state.promoInput.trim()} className="min-h-12 self-end rounded-xl bg-brand-ink px-6 font-extrabold text-white disabled:opacity-50">
              {checkingPromo ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {state.promo ? (
            <p className="rounded-xl bg-[#E8F5EC] px-4 py-3 text-[15px] font-semibold text-[#145C33]">
              Code applied: {state.promo.agencyName} · {state.promo.description}
            </p>
          ) : null}
          {promoMessage ? <p role="alert" className="text-sm font-semibold text-brand-red">{promoMessage}</p> : null}
        </fieldset>

        {/* 6. Finish */}
        <fieldset className={card}>
          <legend className={legend}>6. Anything else?</legend>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-brand-ink">
            Special requests (optional)
            <textarea rows={3} maxLength={1000} className={`${field} py-3`} placeholder="Dietary needs, rooming with a friend, questions…" value={state.specialRequests} onChange={(e) => dispatch({ type: 'setSpecialRequests', value: e.target.value })} />
          </label>
          <label className="flex items-start gap-2.5 text-[15px]">
            <input data-field="agreedToTerms" type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-red" checked={state.agreedToTerms} onChange={(e) => dispatch({ type: 'setAgreed', value: e.target.checked })} />
            <span>
              I agree to the <a href="/terms" target="_blank" className="font-bold text-brand-red">Terms</a>,{' '}
              <a href="/privacy" target="_blank" className="font-bold text-brand-red">Privacy Policy</a> and{' '}
              <a href="/refund-policy" target="_blank" className="font-bold text-brand-red">Refund Policy</a>. *
            </span>
          </label>
          <FieldError id="err-terms" msg={errors.agreedToTerms} />
          {submitError ? <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-3 font-semibold text-brand-red">{submitError}</p> : null}
          <button type="submit" disabled={submitting} className="min-h-[60px] rounded-full bg-brand-red text-lg font-extrabold text-white disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          <p className="text-center text-sm">No payment is taken now.</p>
        </fieldset>
      </form>

      {/* Summary */}
      <aside aria-label="Booking summary" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 rounded-[20px] border-t-[6px] border-brand-red bg-white p-7 lg:sticky lg:top-6">
        <p className="text-xl font-extrabold text-brand-ink">Your booking</p>
        <div className="flex justify-between gap-3 text-[15px]">
          <span>Departure</span>
          <span className="font-bold text-brand-ink">{departures.find((d) => d.id === state.departureId)?.label ?? 'Not selected'}</span>
        </div>
        <div className="h-px bg-brand-line" />
        {pricing ? (
          <>
            {pricing.lines.map((l) => (
              <div key={l.category} className="flex justify-between gap-3 text-[15px]">
                <span>{l.qty} × {CATEGORY_LABELS[l.category]}</span>
                <span className="font-bold text-brand-ink">{formatPHP(l.amount)}</span>
              </div>
            ))}
            {pricing.singleSupplements > 0 ? (
              <div className="flex justify-between gap-3 text-[15px]"><span>Single room supplement</span><span className="font-bold text-brand-ink">{formatPHP(pricing.singleSupplements)}</span></div>
            ) : null}
            {pricing.promo ? (
              <div className="flex justify-between gap-3 text-[15px] text-[#145C33]"><span>Promo {pricing.promo.code}</span><span className="font-bold">−{formatPHP(pricing.promo.discountTotal)}</span></div>
            ) : null}
            <div className="h-px bg-brand-line" />
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-extrabold text-brand-ink">Estimated total</span>
              <span className="text-[26px] font-extrabold text-brand-ink">{formatPHP(pricing.total)}</span>
            </div>
            <p className="rounded-xl bg-brand-soft px-4 py-3.5 text-sm">
              After we confirm your slot, a deposit of <b className="text-brand-ink">{formatPHP(pricing.depositDue)}</b> is due. Pay by card, GCash, Maya or bank transfer.
            </p>
          </>
        ) : (
          <p className="text-sm">Choose a departure to see your estimated total.</p>
        )}
      </aside>
    </div>
  );
}
```
(`(Number(c) ^ (Math.random() * 16) >> (Number(c) / 4))` 은 `crypto.randomUUID` 미지원 구형 브라우저용 UUID v4 폴백.)

- [ ] **Step 3: 완료 페이지**

`src/app/(site)/apply/thanks/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/site/Section';

export const metadata: Metadata = { title: 'Application received', robots: { index: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ app?: string; status?: string }> }) {
  const { app, status } = await searchParams;
  const appNo = app && /^APP-\d{4,}$/.test(app) ? app : null;
  const waitlist = status === 'waitlist';
  return (
    <Section width="narrow" className="flex flex-col gap-6">
      <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink">
        {waitlist ? "You're on the waitlist" : 'Application received'}
      </h1>
      {appNo ? (
        <p className="text-lg">
          Your application number is <b className="text-brand-ink">{appNo}</b>. We also sent a confirmation to your email.
        </p>
      ) : null}
      <p className="text-lg">
        {waitlist
          ? 'All available slots are currently taken. We will contact you as soon as a slot opens.'
          : 'Our team will contact you within 1 to 2 business days to confirm your slot and send payment instructions. No payment is needed yet.'}
      </p>
      <p>
        Questions? <Link href="/contact" className="font-bold text-brand-red">Contact us</Link> and mention your application number.
      </p>
      <p><Link href="/" className="font-bold text-brand-red">← Back to the tour</Link></p>
    </Section>
  );
}
```

- [ ] **Step 4: 확인**

Run: `pnpm --filter @unik/web exec tsc --noEmit && pnpm --filter @unik/web test && pnpm --filter @unik/web build` → 성공.
화면 동작은 Task 11 의 에뮬레이터 E2E 에서 확인한다. 여기서는 dev 서버로 `/apply` 가 렌더링되고(설정이 없으면 "Applications are currently closed") 콘솔 오류가 없는지만 확인.

- [ ] **Step 5: Commit**
```bash
git add frontend/web/src/app/\(site\)/apply
git commit -m "feat(web): 신청 폼(실시간 남은 자리·프로모 확인·임시저장·재시도)과 완료 페이지"
```

---

### Task 10: App Check (클라이언트 시작 + 서버 강제)

**Files:**
- Create: `frontend/web/src/lib/appCheck.ts`, `frontend/web/src/components/site/AppCheckInit.tsx`
- Modify: `frontend/web/src/app/(site)/layout.tsx`, `backend/functions/src/applications/callables.ts`, `README.md`, `frontend/web/.env.example`

**Interfaces:**
- Consumes: Task 3 의 callable 호출 (App Check 토큰은 SDK 가 자동 첨부)
- Produces: 환경변수 `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`, `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN`(개발용)

- [ ] **Step 1: 클라이언트**

`src/lib/appCheck.ts`:
```ts
import { ReCaptchaEnterpriseProvider, initializeAppCheck } from 'firebase/app-check';
import app from '@/lib/firebase';

let started = false;

/** 공개 사이트에서 한 번만 호출. 키가 없으면(로컬 등) 경고만 남기고 건너뛴다. */
export function startAppCheck(): void {
  if (started || typeof window === 'undefined') return;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) {
    console.warn('App Check is not configured (NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY missing).');
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
  started = true;
}
```
`src/components/site/AppCheckInit.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { startAppCheck } from '@/lib/appCheck';

export function AppCheckInit() {
  useEffect(() => startAppCheck(), []);
  return null;
}
```
`(site)/layout.tsx` 에서 `<PromoCodeCapture />` 를 감싼 Suspense 바로 다음에 `<AppCheckInit />` 추가(import 포함).
`frontend/web/.env.example` 끝에 추가:
```
# App Check (reCAPTCHA Enterprise site key). 운영·프리뷰는 Vercel 환경변수로 설정.
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=
# 로컬 개발용 App Check 디버그 토큰 (Firebase 콘솔 > App Check > 디버그 토큰에 등록)
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=
# 로컬 에뮬레이터 사용
NEXT_PUBLIC_USE_FIRESTORE_EMULATOR=
NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=
```

- [ ] **Step 2: 서버 강제**

`callables.ts` 의 `options` 를 교체 (에뮬레이터에서는 강제하지 않아 로컬 E2E 가 가능):
```ts
// 운영에서는 App Check 토큰이 없는 호출을 거절한다. Functions 에뮬레이터(FUNCTIONS_EMULATOR=true)에서는 끈다.
const options: CallableOptions = {
  invoker: 'public',
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
  cors: ['https://unik.ph', 'https://www.unik.ph', /^http:\/\/localhost:\d+$/, /\.vercel\.app$/],
};
```
Run: `cd backend/functions && npm run build && npm test` → PASS.

- [ ] **Step 3: README 운영 설정 절차 추가** (`README.md` 의 Deploy notes 아래)

```markdown
### App Check (오픈 전 필수, Google 콘솔 권한 필요)
1. Google Cloud 콘솔 > reCAPTCHA Enterprise > 키 만들기 (웹, 도메인: unik.ph, www.unik.ph, localhost)
2. Firebase 콘솔 > App Check > 웹 앱에 reCAPTCHA Enterprise 공급자로 위 키 등록
3. Vercel 환경변수 `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` 설정 (Production, Preview)
4. 로컬 개발: 브라우저 콘솔에 출력되는 디버그 토큰을 Firebase 콘솔 > App Check > 디버그 토큰에 등록하거나 `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` 에 지정
5. Functions 를 배포하면 `submitApplication`·`checkPromoCode` 는 App Check 토큰 없는 호출을 거절한다 (에뮬레이터 제외)
```

- [ ] **Step 4: 확인** — `pnpm --filter @unik/web build` 성공, dev 서버에서 키 미설정 시 콘솔 경고 1회만 출력.

- [ ] **Step 5: Commit**
```bash
git add frontend/web backend/functions/src README.md
git commit -m "feat: App Check 클라이언트 시작과 신청 callable 의 App Check 강제(에뮬레이터 제외)"
```

---

### Task 11: 에뮬레이터 E2E 점검 · CI · 이월 목록 갱신

**Files:**
- Create: `backend/functions/scripts/seed-emulator.mjs`
- Modify: `backend/functions/package.json` (script 추가), `.github/workflows/ci.yml`, `docs/superpowers/notes/2026-10-12-part1-carryover.md`, `.claude/launch.json` 은 **수정하지 않는다**(컨트롤러 소유)

- [ ] **Step 1: 에뮬레이터 시드 스크립트**

`backend/functions/scripts/seed-emulator.mjs`:
```js
// 로컬 에뮬레이터용 투어 설정·프로모 코드 시드. 운영 프로젝트에는 절대 실행하지 않는다.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST is not set. Refusing to seed a real project.');
  process.exit(1);
}
initializeApp({ projectId: 'demo-unik' });
const db = getFirestore();

await db.doc('tourConfig/seoul2027').set({
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 200 },
  mayaPaymentLinkBase: null,
  notifyEmails: ['staff@cebudirectclub.com'],
  departures: [
    { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: 'Sample flight info', seatCapacity: 120, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 },
    { id: 'ceb', label: 'Cebu (CEB)', departDate: '2027-03-19', returnDate: '2027-03-23', flightInfo: 'Sample flight info', seatCapacity: 2, isOpen: true, prices: { full: 85000, tenK: 80000, companion: 75000 }, singleSupplement: 15000 },
  ],
});
await db.doc('promoCodes/TA-SUNRISE').set({ agencyName: 'Sunrise Travel', discountType: 'fixed', discountValue: 2000, validUntil: null, maxPax: null, active: true });
console.log('Seeded tourConfig/seoul2027 and promoCodes/TA-SUNRISE');
```
`backend/functions/package.json` scripts 에 `"seed:emulator": "node scripts/seed-emulator.mjs"` 추가.

- [ ] **Step 2: E2E 실행 (수동, 결과를 보고서에 기록)**

1. 터미널 A: `cd backend/functions && FUNCTIONS_DISCOVERY_TIMEOUT=60 npm run serve` (functions+firestore 에뮬레이터, demo-unik)
2. 터미널 B: `cd backend/functions && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator`
3. 터미널 C: `cd frontend/web && NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-unik NEXT_PUBLIC_USE_FIRESTORE_EMULATOR=true NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=true pnpm dev -p 3100`
   (`demo-unik` 프로젝트 ID 로 SDK 를 맞춰야 에뮬레이터 데이터가 보인다. `lib/firebase.ts` 는 수정하지 않고 환경변수만 쓴다.)
4. 브라우저로 확인 (모바일 375px 과 데스크톱):
   - `http://localhost:3100/tour?code=ta-sunrise` → `/apply` 이동 시 프로모 칸에 `TA-SUNRISE` 와 "Code applied: Sunrise Travel · PHP 2,000 off per person"
   - 출발편 Manila 선택, 연락처 입력(전화 `(0917) 123-4567`), 약관 동의 → 제출 → `/apply/thanks?app=APP-0001&status=new`
   - Cebu(좌석 2) 에 인원 3명 → 출발편 카드가 "Full · join the waitlist" → 제출 시 완료 페이지가 대기 안내
   - 필수 미입력 제출 → 첫 오류 칸으로 포커스, 오류 문구 표시
   - 작성 중 새로고침 → 입력 내용 유지(임시저장)
   - `/contact` 에서 문의 전송 → "Thank you" (Firestore 에뮬레이터 `contacts` 에 문서 생성, 규칙 통과)
   - `/profile/adamkim` 은 에뮬레이터에 명함 데이터가 없으므로 이 단계에서는 확인하지 않는다(Task 5 에서 운영 데이터로 확인됨)
5. 모든 서버를 종료한다.

- [ ] **Step 3: CI 에 웹 테스트·빌드 추가**

`.github/workflows/ci.yml` 의 `web-and-domain` 잡 마지막에 추가:
```yaml
      - name: Web unit tests
        run: pnpm --filter @unik/web test
      - name: Web build
        run: pnpm --filter @unik/web build
```

- [ ] **Step 4: 이월 목록 갱신**

`docs/superpowers/notes/2026-10-12-part1-carryover.md` 에서 처리된 항목에 `✅ (2부)` 표시: 오픈 차단 1(App Check — 코드 완료, **콘솔 설정은 사용자 작업으로 남음**), 2(throttle), 2부 계약 전 항목. 새로 남는 항목을 "오픈 전 사용자 작업" 섹션으로 추가:
```markdown
## 오픈 전 사용자 작업 (2부 이후)
- App Check 콘솔 설정 (README "App Check" 절차) + Vercel 환경변수
- 약관·개인정보·환불 규정 문구 확정 (`frontend/web/src/content/legal.ts` 의 [TBC] 항목)
- 투어 문구 확정: 포함사항·일정·항공·박수 (`frontend/web/src/content/tour.ts`), 아트조이 기록·프로그램 (`content/artjoy.ts`), 과거 투어 소개 (`content/pastTours.ts`)
- 색상 테마 대표 승인 (현재 A안. 변경 시 `globals.css` 의 brand 토큰만 교체)
- 운영 Firestore 에 `tourConfig/seoul2027` 입력 (3부 어드민 "상품 설정" 화면으로)
```

- [ ] **Step 5: 전체 검증 & Commit**

Run (repo root): `pnpm typecheck && pnpm test && pnpm --filter @unik/web test && pnpm --filter @unik/web build`
Expected: 모두 PASS.
```bash
git add backend/functions/scripts backend/functions/package.json .github/workflows/ci.yml docs/superpowers/notes
git commit -m "chore: 에뮬레이터 시드·E2E 점검, CI 에 웹 테스트·빌드 추가, 이월 목록 갱신"
```
