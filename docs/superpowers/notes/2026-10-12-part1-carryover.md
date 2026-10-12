# 1부 완료 → 2·3부/오픈 전 반드시 처리할 항목

1부(정리·도메인·보안 규칙·Functions) 최종 리뷰에서 넘어온 항목. 2부 계획 작성 시 이 목록을 전부 Task 로 반영한다.

## 오픈 차단 항목 (Go-live blockers)
1. ✅ (2부, 코드 완료 · **콘솔 설정은 사용자 작업으로 남음**) **App Check 강제** — `submitApplication`, `checkPromoCode` 에 `enforceAppCheck: true`. 웹에 App Check(reCAPTCHA Enterprise) 연동 후 켠다.
2. ✅ (2부) **서버 측 제출 제한(throttle)** — App Check 만으로는 실제 브라우저 스팸을 못 막음. 같은 이메일의 최근 1시간 미취소 신청 N건 초과 시 거절 등 (submit 트랜잭션이 이미 전체 신청을 읽으므로 저비용). → 구현: per-email (5/hour). IP 기반 제한은 두지 않음.
3. **운영 배포 런북** — 스펙 §12 의 "규칙·함수 먼저 배포(기존 사이트 무영향)"는 더 이상 사실이 아님. 새 규칙은 구 사이트의 공개 읽기/신청을 막고, `firebase deploy --only functions` 는 구 함수(spinRoulette, createRouletteWinner, onNewRegistration) 삭제를 제안함. 순서:
   1. Firestore 백업(gcloud export) + 아카이브 태그 푸시 (사용자 확인)
   2. `firebase functions:secrets:set RESEND_API_KEY`
   3. 새 함수만 이름 지정 배포: `--only functions:submitApplication,functions:checkPromoCode,functions:onApplicationCreated,functions:onApplicationWritten,functions:onTourConfigWritten,functions:onNewContact`
   4. 규칙 배포와 Vercel 프로덕션 전환을 연달아 (또는 과도기 규칙)
   5. 확인 후 구 함수 삭제
4. **`feat/seoul-2027` 은 오픈 당일까지 main 에 병합하지 않는다** (main 병합 = Vercel 프로덕션 전환).

## 2부(공개 사이트·신청 폼)에서 지킬 계약 ✅ (2부, 전 항목 반영)
- `submitApplication` 오류: `invalid-argument` + `details.code='invalid_input'`, `details.issues[{path,message}]` / `failed-precondition` + `details.code ∈ closed|departure_closed|promo_invalid`, 프로모면 `details.reason` / `internal`·`aborted`·`deadline-exceeded` 는 **같은 idempotencyKey 로 자동 재시도**(긴 타임아웃).
- 응답 `status` 는 `ApplicationStatus` 전체 범위가 올 수 있음(중복 재제출 시 저장된 상태 반환).
- `checkPromoCode` 에 `pax` 를 넘겨 `limit_reached` 를 제출 전에 표시.
- 폼 검증 규칙(전화 `^[0-9 -]{6,20}$`, 이름 제어문자/링크 금지, dob 실제 날짜)을 서버와 일치시키기 — 가능하면 `shared/domain` 으로 이동.
- 문의 폼은 `contacts` 에 `{name,email,phone?,subject,message,isRead:false,createdAt: serverTimestamp()}` 만 전송 (phone ≤ 40자, email ≥ 3자).
- 옛 URL(`/cbm`, `/tour/courtside/*` 등) → `/past-tours` 리다이렉트.

## 2부 → 3부 계약
- 어드민에서 신청서를 고쳐도 `lead.email` 은 항상 트림 + 소문자로 저장한다 (서버 입력 정규화와 동일).
- `agreedToTermsAt` 은 절대 수정하지 않는다 (이메일당 1시간 신청 제한 계산에 쓰인다).
- 이름·전화 검증은 `shared/domain` 의 함수만 쓴다: `normalizePhoneNumber`, `isValidName`, `isValidPassportName` (웹 폼·서버와 규칙 일치).
- 가격·예약금은 0 이상의 정수만 허용한다.
- Viber/WhatsApp 링크용 전화번호 정규화(+63 / 앞자리 0 → 국제 표기)는 3부에서 처리한다 (2부는 입력값을 그대로 저장).

## 3부(어드민)에서 지킬 것
- 상품 설정 폼: 가격·예약금·싱글 추가요금은 0 이상의 정수만 (서버는 잘못된 값이면 `departure_closed`).
- 프로모 정률 할인은 1–100 정수만 허용 (소수 % 는 페소 내림 오차).
- 신청서 상세에 `notifications.*`(메일 발송 결과) 표시.
- 상세 URL 규약: `/admin/applicants?id=<docId>`.

## 나중에 해도 되는 개선
- availability 재계산 경합(표시만 영향, 다음 쓰기에 자가 복구) → 트랜잭션 재계산 고려
- 트리거 연결 자동 테스트, 메일 재시도 중복 방지
- honeypot 오류가 필드를 드러냄 → 가짜 성공 응답 고려
- 로컬 Functions 에뮬레이터 탐색 타임아웃 시 `FUNCTIONS_DISCOVERY_TIMEOUT=60`
- `tourConfig.notifyEmails` 공개 읽기 (스펙 §5 대로 유지, 필요 시 private 문서로 분리)

## 오픈 전 사용자 작업 (2부 이후)
- App Check 콘솔 설정 (README "App Check" 절차) + Vercel 환경변수
- Vercel Production·Preview 에 reCAPTCHA 사이트 키 설정 후 실제 신청 1건으로 확인 (키 없으면 모든 신청이 서버에서 거절됨)
- 약관·개인정보·환불 규정 문구 확정 (`frontend/web/src/content/legal.ts` 의 [TBC] 항목)
- 투어 문구 확정: 포함사항·일정·항공·박수 (`frontend/web/src/content/tour.ts`), 아트조이 기록·프로그램 (`content/artjoy.ts`), 과거 투어 소개 (`content/pastTours.ts`)
- 문구 확인: 신청 마감 안내 "General registration for the 2027 race has closed", 히어로의 "MNL · CEB" 출발지 문구 (`app/(site)/seoul-marathon/page.tsx`, `app/(site)/page.tsx`)
- 색상 테마 대표 승인 (현재 A안. 변경 시 `globals.css` 의 brand 토큰만 교체)
- 운영 Firestore 에 `tourConfig/seoul2027` 입력 (3부 어드민 "상품 설정" 화면으로)

## 오픈 당일 점검
- `LAUNCH=1 pnpm --filter @unik/web test` 가 통과해야 한다 (모든 [TBC: …] 제거)
