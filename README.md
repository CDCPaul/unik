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
