# UNIK 사이트 개편 — 2027 서울마라톤 투어 설계

- 작성일: 2026-10-12
- 상태: 검토 대기
- 시안: https://claude.ai/artifact/RZUWpe81nJ6ru1RwBrjgnz (테마 3안, 랜딩, 신청 폼, 어드민 2화면)

## 1. 목표

unik.ph 를 **2027 서울마라톤 투어 상품의 신청 접수 사이트**로 전환한다.

성공 기준:
- 고객이 필수 정보만으로 2분 안에 신청할 수 있다.
- 다른 여행사(TA)가 프로모션 코드/추천 링크로 보낸 고객이 TA 별로 집계된다.
- 직원이 어드민 한 곳에서 신청자 연락·정보 보완·결제 기록·명단 추출을 처리한다.
- 기존 NFC 명함(`unik.ph/profile/...`)은 중단 없이 계속 동작한다.
- 목표 오픈: **2026-10-29(목)**

## 2. 확정된 사실

| 항목 | 내용 | 출처 |
|---|---|---|
| 대회 | 2027 서울마라톤 겸 제97회 동아마라톤 | seoul-marathon.com/96 |
| 대회일 | 2027-03-21(일) | 〃 |
| 집결 | 풀코스 광화문광장(예정), 10K 잠실종합운동장(예정) | 〃 |
| 코스맵 | 추후 공개 | seoul-marathon.com/91 |
| 배번 | KTO 지원 **총 200석**, 풀코스·10K 공용, 선착순 | 사용자 |
| 아트조이 토레고사 | 필리핀 여자 마라톤 기록 보유. 2:33:48 (2026 도쿄마라톤, 보도마다 2:33:48/2:33:54 상이 → 본인 확인 필요). 공식 협력 확정 | 보도, 사용자 |
| 사진 사용 | 서울마라톤 공식 사이트 사진·아트조이 공식 사진 사용 허가됨 (KTO 지원 행사, 공식 협력) | 사용자 |
| 결제 | Maya Business 2.0 계정. 현재 Static QR(1.5%)만 활성. Checkout(카드 3%+₱10, QR 1.5%)은 미활성 → Jessie 가 Maya 에 활성화 문의 중 | Maya 대시보드 |

## 3. 결정 사항

| # | 결정 |
|---|---|
| D1 | 기존 Next.js 앱을 뼈대만 남기고 그 위에 재구축 (새 앱 X). 명함 URL·Vercel·Firebase(`unik-90206`) 유지 |
| D2 | 명함 기능 외 기존 기능 전부 삭제. git 태그 `archive/pre-seoul-2027` 로 보존, Firestore 는 백업만 하고 기존 컬렉션은 그대로 둠 |
| D3 | 과거 투어(벚꽃마라톤, KBL)는 정적 `/past-tours` 페이지로 실적 소개. 옛 URL 은 여기로 리다이렉트 |
| D4 | 프로모션 코드 = TA 귀속 집계 + 1인당 할인(정액 또는 정률) |
| D5 | 상품 구성(출발편·가격)은 어드민에서 편집. 소개 문구·일정표는 코드에 둠 |
| D6 | 참가자 유형: 풀코스 / 10K / 비러너 동반자, 유형·출발편별 가격 |
| D7 | 신청 시 필수는 대표자 연락처·출발편·인원뿐. 참가자 상세는 전부 선택 입력, 직원이 사후 보완 |
| D8 | TA 는 실적을 직접 보지 않음 (집계는 어드민만) |
| D9 | 1차 오픈: 결제는 사이트 밖(Maya QR·Payment Link·단말기·계좌이체)에서 받고 어드민에 결제 기록. Maya Checkout API 는 2차 |
| D10 | 신청서 생성·가격 계산·코드 검증은 Cloud Function 에서 (클라이언트 직접 쓰기 금지) |
| D11 | 정원 초과 시 접수를 막지 않고 `waitlist` 로 받음 |
| D12 | 공개 사이트·어드민 모두 영어 |
| D13 | 색상 테마는 대표 승인 대상. 추천: A안 "PH × KR" (네이비 #0B1F4D, 레드 #C8242B, 선옐로 #F6C343) |

## 4. 범위

### 4.1 삭제 (전부 `frontend/web/src` 기준)
- 공개: `(public)/tour/**`, `(public)/players/**`, `(public)/cbm/**`, `(public)/cherry-blossom-marathon`, `(public)/gallery`, `(public)/info`, `(public)/register`, `(public)/page.tsx` 의 홈빌더 렌더링, `cdc-travel/roulette/**`, `api/roulette/**`
- 어드민: `admin/(dashboard)/{content,home,roulette,tickets,navigation,theme,ui-text,registrations,settings}/**`, 대시보드 홈은 신청자 관리로 대체
- 컴포넌트/서비스: `components/{homebuilder,products,tickets,roulette*}`, `lib/services/roulette.ts`, `lib/services/admin/parsers/*`, `lib/utils/{pdfParser,pdf,nameListParser}`, `lib/services/registrations.ts` 및 tours/players/gallery 서비스, `ThemeContext`·`NavigationContext`·`UiTextContext`·`SettingsContext` 와 해당 어드민
- Functions: `spinRoulette`, `createRouletteWinner`, `onNewRegistration` (운영 환경 함수 삭제는 실행 전 별도 확인)
- 의존성: `@react-pdf/renderer`, `jspdf`, `html2canvas`, `pdfjs-dist`, `react-custom-roulette` 등 미사용분. `latest` 고정 해제
- 정리: 루트 문서(`CLOUD_RUN_AUTH_FIX.md`, `ROULETTE_SETUP.md`, `TICKET_SYSTEM_IMPLEMENTATION_PLAN.md`, `WEBOS_*.md`), `public/ticket-templates/**`, `*.backup`, 커밋된 로그 파일, 존재하지 않는 `@unik/admin` 스크립트, README 갱신

### 4.2 유지
- 명함: `app/profile/**`, `admin/(dashboard)/business-cards`, `lib/services/businessCards.ts`, `lib/services/admin/businessCards.ts`, `lib/vcard.ts`, `lib/businessCardConfig.ts`, `next.config.js` 의 firebasestorage `remotePatterns`, `business_cards` Firestore 규칙, `business-cards/` Storage 규칙, `public/cebu-direct-logo.jpg`, `public/cdc-logo-white.png`, `globals.css` 의 `cdc-*` 색상·`admin-*` 유틸
- 어드민 인증: `lib/auth.ts` (Google, `@cebudirectclub.com` 도메인), 어드민 레이아웃·사이드바(메뉴만 교체)
- `/contact` 문의 폼 + `onNewContact` 메일 (단순화)

### 4.3 신규
- 공개 페이지(영어): `/`, `/seoul-marathon`, `/tour`, `/artjoy`, `/faq`, `/past-tours`, `/apply`, `/apply/thanks`, `/contact`, `/terms`, `/privacy`, `/refund-policy`
- 어드민 메뉴: Applicants / Promo codes / Tour settings / Business cards

### 4.4 범위 밖 (1차)
- 사이트 내 온라인 결제 (2차: Maya Checkout + 웹훅)
- TA 전용 로그인/실적 페이지
- 고객이 직접 추가 정보를 입력하는 링크
- 다국어, 어드민 권한 등급

## 5. 데이터 모델 (Firestore)

### `tourConfig/seoul2027` — 공개 읽기, 어드민 쓰기
```ts
{
  acceptingApplications: boolean
  currency: 'PHP'
  depositPerPax: number
  bibQuota: { total: number }            // 200
  mayaPaymentLinkBase: string | null     // 예: https://mymaya.me/<alias>, 없으면 링크 버튼 숨김
  notifyEmails: string[]                 // 직원 알림 수신자 (신청·문의 메일 공용). 기존 settings/company.contactEmails 대체
  departures: Array<{
    id: string                           // 'mnl', 'ceb'
    label: string
    departDate: string; returnDate: string   // YYYY-MM-DD
    flightInfo: string
    seatCapacity: number
    isOpen: boolean
    prices: { full: number; tenK: number; companion: number }
    singleSupplement: number
  }>
  updatedAt, updatedBy
}
```

### `availability/seoul2027` — 공개 읽기, 서버만 쓰기
```ts
{ bibsUsed: number; bibsTotal: number
  departures: { [id]: { seatsUsed: number; seatCapacity: number } }
  updatedAt }
```
- `bibsUsed` = 취소/대기 아닌 신청의 `full + tenK` 합
- `seatsUsed` = 해당 출발편의 취소/대기 아닌 신청 전체 인원 합

### `applications/{autoId}` — 서버 생성, 어드민 읽기/수정
```ts
{
  appNo: string                          // 'APP-0001' (counters 트랜잭션)
  status: 'new'|'contacted'|'deposit_paid'|'fully_paid'|'confirmed'|'cancelled'|'waitlist'
  departure: { id, label, departDate, returnDate }      // 스냅샷
  lead: { firstName, lastName, email, phoneDial, phoneNumber, viber: boolean, whatsapp: boolean }
  counts: { full: number; tenK: number; companion: number }   // 합계 1–10
  travelers: Array<{
    category: 'full'|'tenK'|'companion'
    passportName?, dob?, gender?, nationality?, tshirtSize?,
    expectedFinish?, recentMarathon?, room?: 'twin'|'single', emergencyContact?
  }>                                     // length = counts 합
  completeness: { filled: number; total: number }
  pricing: {
    lines: Array<{ category, qty, unitPrice }>
    singleSupplements: number
    subtotal: number
    promo: { code, agencyName, type: 'fixed'|'percent', value, discountTotal } | null
    total: number
    depositDue: number
  }                                      // 스냅샷
  payments: Array<{ id, type: 'deposit'|'balance'|'other',
    method: 'maya_link'|'maya_qr'|'maya_terminal'|'bank_transfer'|'cash'|'maya_checkout',
    amount, paidAt, reference?, recordedBy }>
  paidTotal: number
  specialRequests?: string
  staffNotes?: string
  statusHistory: Array<{ status, at, by }>
  idempotencyKey: string
  agreedToTermsAt, createdAt, updatedAt
}
```
- 완성도 대상 필드: 러너 8개(passportName, dob, gender, nationality, tshirtSize, expectedFinish, room, emergencyContact), 동반자 6개(tshirtSize, expectedFinish 제외)
- `recentMarathon` 은 풀코스 기록 증빙이 필요해질 경우 대비 선택 필드 (완성도 미포함)

### `promoCodes/{CODE}` — 어드민 전용
```ts
{ agencyName, contactName?, contactInfo?,
  discountType: 'fixed'|'percent', discountValue: number,
  validUntil: string | null, maxPax: number | null,
  active: boolean, notes?, createdAt, createdBy }
```
- 코드 형식 `^[A-Z0-9-]{3,20}$`, 문서 ID = 코드 (중복 불가)
- 실적은 저장하지 않고 어드민에서 `applications` 를 집계

### `counters/seoul2027` — 서버 전용
`{ appSeq: number }`

## 6. 가격 규칙 (`shared/pricing` — 서버·어드민 공용, 단위 테스트 필수)
- 소계 = Σ(유형별 인원 × 출발편 유형 가격) + 싱글 선택 인원 × singleSupplement
- 할인은 **1인당**, 모든 유형에 적용, 싱글 추가요금에는 미적용
  - fixed: `discountValue × 총인원`
  - percent: `Σ(유형 가격 × 인원) × discountValue / 100`, 페소 단위 내림
- 할인 후 금액은 0 미만 불가
- `depositDue = depositPerPax × 총인원`
- 신청 당시 room 미입력 시 twin 으로 계산 (싱글 변경은 직원이 수정 → 재계산)

## 7. 서버 함수 (asia-northeast3)

| 함수 | 종류 | 동작 |
|---|---|---|
| `submitApplication` | callable | zod 검증 → App Check·honeypot 확인 → idempotencyKey 중복이면 기존 결과 반환 → config 로드, 접수/출발편 열림 확인 → 프로모 검증(무효면 에러 코드 반환) → 가격 계산 → 정원 확인(초과 시 `waitlist`) → appNo 발급·저장(트랜잭션) → `{ appNo, status, pricing }` 반환 |
| `checkPromoCode` | callable | `{ valid, reason?: 'not_found'|'inactive'|'expired'|'limit_reached', agencyName?, discountType?, discountValue? }` |
| `onApplicationCreated` | Firestore onCreate | Resend 로 고객 확인 메일 + 직원 알림 메일(어드민 상세 링크) |
| `onApplicationWritten` | Firestore onWrite | `availability/seoul2027` 재계산 |
| `onNewContact` | 기존 유지 | 문의 메일. 수신자를 `tourConfig.notifyEmails` 로 변경 |
| `mayaWebhook` | HTTP (2차) | 결제 완료 시 `payments` 추가 |

- `maxPax` 판정: 해당 코드의 취소 아닌 신청 인원 합 + 이번 인원 > maxPax 이면 `limit_reached`
- 메일 발신: `noreply@unik.ph` (기존 Resend 도메인)

## 8. 보안 규칙
- `tourConfig/*`: read 공개, write `isAdmin()`
- `availability/*`: read 공개, write 금지(서버 전용)
- `applications/*`: read/update `isAdmin()`, create/delete 금지
- `promoCodes/*`: read/write `isAdmin()`
- `counters/*`: 전부 금지
- `business_cards`, `contacts`: 현행 유지
- 기존 컬렉션(`registrations`, `tours`, `players`, `gallery`, `roulette*`, `airline-tickets` 등): 어드민 전용으로 잠금
- `isAdmin()` = `@cebudirectclub.com` 이메일 인증 (현행)

## 9. 화면 동작

### 9.1 공개
- **추천 링크**: 모든 페이지에서 `?code=` 를 읽어 localStorage 에 30일 저장(try/catch, 실패해도 동작). `/apply` 진입 시 자동 입력 + 자동 검증
- **신청 폼**: 한 페이지. 출발편(닫힘 = 비활성, 만석 = "Waitlist" 표시) → 인원 카운터(합 1–10) → 대표 연락처(필수) → 참가자 상세(선택, 접힘) → 프로모 코드 → 요청사항 + 약관 동의(필수) → 제출
  - 실시간 금액 표시(같은 pricing 모듈), 저장 금액은 서버 계산값
  - 작성 중 내용 localStorage 임시 저장, 제출 성공 시 삭제
  - 제출 버튼 중복 클릭 방지 + idempotencyKey
  - `acceptingApplications=false` 면 폼 대신 마감 안내
- **완료 페이지** `/apply/thanks?app=APP-0021`: 신청번호, 다음 절차 안내 (개인정보 미표시)
- **콘텐츠 페이지**: 정적. 확정 안 된 정보는 "Coming soon"/TBA 로 오픈 가능

### 9.2 어드민
- **Applicants**: 실시간 목록, 상태 탭(건수), 출발편·프로모(Direct 포함)·정보 미완료 필터, 이름/이메일/신청번호 검색, KPI 4개
  - CSV 2종: 신청서 단위 / **참가자 단위 명단**(배번 등록용)
  - 상세: 상태 변경(이력 자동), 연락처·참가자 편집, 인원 변경 시 재계산 금액 확인 후 저장(프로모 스냅샷 유지), 결제 기록(예약금 도달 시 상태 변경 제안), Maya 결제 링크 복사(`mayaPaymentLinkBase?amt=`), 직원 메모, 정보 미완료 상태로 확정 시 경고. 삭제 없음(취소만)
- **Promo codes**: 목록 + 실시간 집계(신청·인원·확정 인원·순매출, "확정" = deposit_paid 이상), 생성(형식·중복 검증, 추천 링크 자동 생성·복사), 수정(이후 신청부터 적용), 사용된 코드는 삭제 불가 → 일시중지
- **Tour settings**: 접수 on/off, 예약금, 배번 총량, 출발편 CRUD, Maya 링크 주소, 직원 알림 메일 수신자, 출발편별 사용 현황 표시
- **Business cards**: 현행 그대로

## 10. 디자인
- 시안 기준. 폰트: Barlow Condensed(디스플레이) + Manrope(본문)
- 테마 3안 중 대표 승인 결과 적용 (추천 A안). 색상은 CSS 토큰으로 정의해 교체 가능하게
- 모바일 우선 확인 (TA 링크는 대부분 메신저로 공유됨)
- 사진: 서울마라톤 공식 사이트 사진(출처 표기), 아트조이 공식 사진(수령 대기)

## 11. 테스트
- **단위 (vitest)**: pricing, completeness, availability 계산, 프로모 판정(만료·한도·비활성), 코드 형식
- **보안 규칙**: `@firebase/rules-unit-testing` — 비로그인/타 도메인은 applications·promoCodes 읽기·쓰기 불가, availability 쓰기 불가, business_cards 공개 읽기 유지
- **함수 통합**: Firebase 에뮬레이터에서 submitApplication 정상/무효 코드/만석→waitlist/중복 제출/접수 마감
- **CI**: 기존 `tsc --noEmit` + 위 테스트 추가
- **수동 E2E (오픈 전)**: TA 링크 진입 → 신청 → 메일 2종 수신 → 어드민 처리 → 결제 기록 → CSV, 모바일 확인, **명함 회귀**(NFC URL, iOS/Android vCard 저장, 어드민 편집)
- 별도 스테이징 프로젝트 없음: 에뮬레이터로 검증, 운영의 테스트 데이터는 오픈 전 삭제

## 12. 배포
1. 보안 규칙 + 함수 배포 (추가만 하므로 기존 사이트 영향 없음)
2. Vercel 웹 배포 (사이트 전환)
3. 즉시 점검: 신청 1건, 명함 URL, 어드민
4. 문제 시 Vercel 이전 배포로 즉시 롤백
5. 안정화 후 룰렛 함수 삭제 등 정리 (실행 전 확인)

## 13. 일정 (목표 오픈 10/29 목)

| 주차 | 작업 |
|---|---|
| 1주차 10/13–10/17 | 백업·아카이브, 기존 기능 정리, 명함 회귀 확인, pricing 등 공용 로직 + 테스트, 보안 규칙 |
| 2주차 10/19–10/23 | 서버 함수·메일, 공개 페이지·신청 폼, 어드민 3화면 |
| 3주차 10/26–10/29 | 콘텐츠 채우기, E2E 점검, 테스트 데이터 정리, 오픈 |
| 이후 | Maya Checkout 연동 (승인 시) |

## 14. 필요한 자료 (일정 최대 변수)

| 자료 | 기한 |
|---|---|
| 출발편별 일정·항공편·좌석 수·유형별 가격·싱글 추가요금·예약금 | **10/19** (신청 폼 작동에 필수) |
| 확정 일정표, 포함·불포함 | 2주차 |
| 아트조이 사진·동행 프로그램·정확한 기록 | 2주차 |
| 환불·취소 규정 (약관·개인정보처리방침은 초안 작성 후 검토 가능) | 3주차 초 |
| 회사 주소·연락처, 과거 투어 소개 문구 | 3주차 초 |
| 첫 TA 프로모 코드 목록 | 오픈 전 |
| 색상 테마 대표 승인 | 2주차 초 (공개 페이지 작업 전) |

## 15. 남은 확인 사항
- 투어 배정 배번(KTO)에도 풀코스 기록 증빙(5시간 이내)이 필요한지 → 필요 시 `recentMarathon` 을 필수/증빙 업로드로 승격
- Maya Checkout 활성화 결과와 수수료·정산·카드 수수료 고객 부담 가능 여부 (Jessie 진행 중)
- 보유 Maya 단말기가 연결된 가맹 계정
- 개인정보 보관 기간 (투어 종료 후 N개월 삭제 권장)
