# UNIK (unik.ph)

2027 서울마라톤 투어 신청 사이트 + CDC 직원 NFC 명함.

- `frontend/web` — Next.js 앱 (공개 사이트, `/admin`, 명함 `/profile/[slug]`)
- `shared/domain` — 웹·Functions 공용 도메인 로직 (가격, 프로모, 정원). `pnpm --filter @unik/shared test`
- `backend/functions` — Firebase Cloud Functions (npm 사용). `npm --prefix backend/functions test` (Firestore 에뮬레이터, Java 필요)
- `backend/rules-tests` — Firestore 보안 규칙 테스트. `pnpm --filter @unik/rules-tests test`

설계: `docs/superpowers/specs/2026-10-12-seoul-marathon-2027-site-design.md`
이전 사이트(KBL/벚꽃마라톤): git 태그 `archive/pre-seoul-2027`

## Deploy notes

- 메일 발송(Resend) 키는 Secret Manager 로 바인딩한다. Functions 를 배포하기 전에 한 번 `firebase functions:secrets:set RESEND_API_KEY` 를 실행할 것.
- 로컬 에뮬레이터: `backend/functions/.secret.local` (gitignore 됨)에 `RESEND_API_KEY=...` 를 넣거나, 비워 두면 메일 발송을 건너뛴다.

### App Check (오픈 전 필수, Google 콘솔 권한 필요)
1. Google Cloud 콘솔 > reCAPTCHA Enterprise > 키 만들기 (웹, 도메인: unik.ph, www.unik.ph, localhost)
2. Firebase 콘솔 > App Check > 웹 앱에 reCAPTCHA Enterprise 공급자로 위 키 등록
3. Vercel 환경변수 `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` 설정 (Production, Preview)
4. 로컬 개발: 브라우저 콘솔에 출력되는 디버그 토큰을 Firebase 콘솔 > App Check > 디버그 토큰에 등록하거나 `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` 에 지정
5. Functions 를 배포하면 `submitApplication`·`checkPromoCode` 는 App Check 토큰 없는 호출을 거절한다 (에뮬레이터 제외)
6. Vercel 프리뷰 도메인(`*.vercel.app`)은 reCAPTCHA 키의 허용 도메인에 추가해야 한다. 추가하지 않으면 프리뷰에서는 디버그 토큰(4번)으로만 신청이 가능하다.
7. **Firestore·Storage 에는 App Check 를 강제(Enforce)하지 말 것.** 서버 렌더링(SSR) 가격 조회와 NFC 명함 페이지는 App Check 토큰을 보내지 않으므로 강제하면 깨진다. 강제 대상은 Functions 호출뿐이다.

## Admin

`/admin` 은 `@cebudirectclub.com` Google 계정으로만 로그인한다 (규칙은 이메일 인증된 계정만 허용). 메뉴는 4개다.

- **Applicants** — 신청자 목록(상태 탭·필터·검색·KPI·CSV 2종)과 상세(상태·연락·참가자 편집·인원 재계산·결제 기록·Maya 링크·메모·메일 결과). URL: `/admin/applicants?id=<docId>`
- **Promo codes** — 여행사 프로모 코드 생성·수정·일시중지·미사용 삭제, 실적, 추천 링크 복사
- **Tour settings** — 접수 on/off, 출발편·가격·좌석, 예약금, 배번, 알림 메일, Maya 링크
- **Business Cards** — NFC 명함 관리

오픈 순서는 `docs/superpowers/notes/launch-runbook.md` 를 따른다.

### 로컬 E2E (에뮬레이터, 운영 프로젝트 `unik-90206` 에는 절대 연결하지 않는다)
1. 에뮬레이터 (auth·firestore·functions): `cd backend/functions && npm run build && FUNCTIONS_DISCOVERY_TIMEOUT=60 firebase emulators:start --only auth,firestore,functions --project demo-unik --config ../../firebase.json`
2. 시드 2종 (다른 터미널): `cd backend/functions && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator:applications`
3. 웹: `cd frontend/web && NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-unik NEXT_PUBLIC_USE_FIRESTORE_EMULATOR=true NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=true NEXT_PUBLIC_USE_AUTH_EMULATOR=true pnpm dev -p 3101`
4. `/admin/login` → Google 로그인 → Auth 에뮬레이터 화면에서 "Add new account" 로 `staff@cebudirectclub.com` 생성 (이메일 인증된 계정이어야 규칙 통과).
5. 어드민은 `localhost`, 공개 `/apply` 는 `127.0.0.1` 로 열면 로그인 세션이 섞이지 않는다 (공개 사이트는 Auth 에뮬레이터에 연결하지 않는다).
