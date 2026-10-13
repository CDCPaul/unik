# 오픈 런북 — unik.ph 서울마라톤 2027

> 오픈 당일 이 순서대로 진행한다. 각 단계 결과를 체크한다. 문제가 생기면 "롤백" 절을 따른다.
>
> **모든 명령은 Git Bash 에서 실행한다 (PowerShell 아님).** 아래 `LAUNCH=1 …` 처럼 환경변수를 앞에 붙이는 형식은 Git Bash 전용이다.
> PowerShell 에서 LAUNCH 테스트를 돌려야 하면: `$env:LAUNCH='1'; pnpm --filter @unik/web test` (끝나면 `Remove-Item Env:LAUNCH`).

## D-3 ~ D-1 (사전 준비, 사이트 영향 없음)
- [ ] 대표 승인: 색상 테마, 랜딩·투어 문구
- [ ] `LAUNCH=1 pnpm --filter @unik/web test` 통과 (모든 [TBC: …] 제거)
- [ ] 백업 전용 GCS 버킷 만들기 (최초 1회; Firebase Storage 기본 버킷은 규칙·공개 자산과 섞이므로 백업에 쓰지 않는다):
  `gcloud storage buckets create gs://unik-90206-backups --location=asia-northeast3 --project=unik-90206 --uniform-bucket-level-access`
- [ ] Firestore 백업: `gcloud firestore export gs://unik-90206-backups/<YYYY-MM-DD>-pre-launch --project=unik-90206`
- [ ] 구 `onNewContact` 환경변수 점검: Firebase 콘솔 → Functions → `onNewContact` → "Environment variables"(또는 Cloud Run 리비전의 변수)에서 `RESEND_API_KEY` 가 **일반 환경변수**로 들어 있는지 확인한다. 일반 환경변수이면 새 버전이 같은 이름의 시크릿으로 배포될 때 충돌하므로, D-day 1단계에서 **먼저 삭제 후 배포**한다 (아래 참고).
- [ ] 아카이브 태그 원격 푸시: `git push origin archive/pre-seoul-2027`
- [ ] App Check: reCAPTCHA Enterprise 키 생성(unik.ph, www.unik.ph, localhost, 필요 시 *.vercel.app) → Firebase App Check 웹앱 등록 → Vercel 환경변수 `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` (Production, Preview)
- [ ] **Firestore·Storage 에는 App Check 강제를 켜지 않는다** (SSR 가격 조회·NFC 명함이 토큰 없이 읽음)
- [ ] Resend 키: `firebase functions:secrets:set RESEND_API_KEY --project unik-90206`
- [ ] Firebase Auth 승인 도메인에 unik.ph, www.unik.ph 있는지 확인
- [ ] 스테이징 확인: Vercel Preview(이 브랜치)에서 공개 페이지·명함(`/profile/<slug>`) 렌더링 확인

## D-day
> 모든 `firebase` 명령은 저장소 루트에서, **병합 전** 오픈할 커밋을 체크아웃한 `feat/seoul-2027` 에서 실행한다.
> 어떤 `firebase deploy` 든 실행하기 전에 먼저: `npm ci --prefix backend/functions` (배포 때 함수 소스가 이 의존성으로 빌드된다).

1. [ ] (D-3 점검에서 `RESEND_API_KEY` 가 `onNewContact` 의 일반 환경변수였다면) 먼저 `firebase functions:delete onNewContact --region asia-northeast3 --project unik-90206` — 문의 메일이 약 1분간 멈춘다. 그렇지 않으면 이 단계는 건너뛴다.
   **새 함수만 배포** (구 함수 spinRoulette·createRouletteWinner·onNewRegistration 은 그대로 유지, 구 사이트 영향 없음):
   `firebase deploy --only functions:submitApplication,functions:checkPromoCode,functions:onApplicationCreated,functions:onApplicationWritten,functions:onTourConfigWritten,functions:onNewContact --project unik-90206`
   - 구 함수 삭제를 묻는 프롬프트가 나오면 **No**.
   - `onNewContact` 는 이미 존재하므로 이 배포로 **새 버전으로 교체**된다 (수신자를 `tourConfig.notifyEmails` 에서 읽고, 없으면 `ticket@cebudirectclub.com` 으로 보냄. `RESEND_API_KEY` 시크릿 필요).
2. [ ] **규칙 배포 + 사이트 전환을 연달아** (이 사이 수 분간 구 사이트 일부 기능 정지 — 트래픽 적은 시간대):
   1. `firebase deploy --only firestore:rules --project unik-90206`
   2. `feat/seoul-2027` → `main` 병합 (PR 머지) → Vercel 프로덕션 배포 완료 확인
3. [ ] 어드민 로그인 → **Tour settings** 입력: 출발편·가격·좌석·예약금·배번 200·알림 메일·Maya 링크. 이때 "Accepting applications" 는 **끈 상태**로 저장.
4. [ ] **Promo codes**: TA 별 코드 생성, 추천 링크 정리.
5. [ ] 점검(접수 끈 상태): `/`·`/tour` 가격 표시(최대 60초 후), `/apply` 마감 안내, `/profile/<slug>` 명함·vCard, `/contact` 문의 1건 → 직원 메일 수신.
6. [ ] **Accepting applications 켜기** → 실제 신청 1건(직원 본인) → 확인 메일·직원 메일 수신 → 어드민에 표시 → 테스트 신청을 **Cancelled** 로 바꾸고, **Firebase 콘솔 → Firestore → `applications` 에서 그 문서도 삭제**한 뒤에 TA 를 초대한다 (집계·메일 목록에 테스트가 남지 않게). 신청번호 카운터는 삭제하지 않으므로 첫 실제 신청은 **APP-0002** 부터 시작한다 (의도된 동작, 문제 아님).
7. [ ] TA 에 추천 링크 배포.

## D+1 이후
- [ ] 안정 확인 후 구 함수 삭제: `firebase functions:delete spinRoulette createRouletteWinner onNewRegistration --region asia-northeast3 --project unik-90206`
- [ ] Firebase App Check 지표에서 미검증 요청 비율 확인

## 롤백
- 먼저 어드민에 접속할 수 있으면 Tour settings 에서 "Accepting applications" 를 **끈다**.
- 사이트: Vercel 대시보드 → 이전 프로덕션 배포 "Promote to Production" (즉시). 문제가 해결되기 전에는 **main 에 push 하지 않는다** (push 하면 새 사이트가 다시 배포된다).
- 규칙: `git checkout archive/pre-seoul-2027 -- firestore.rules && firebase deploy --only firestore:rules --project unik-90206` 후 `git checkout HEAD -- firestore.rules` 로 파일을 원복한다.
- 함수: 새 함수는 구 사이트와 무관하므로 그대로 두어도 된다(필요 시 `functions:delete`). 단 `onNewContact` 는 새 버전으로 교체된 상태다. 구 버전으로 되돌리려면 아카이브 태그에서 다시 배포한다: `git worktree add ../unik-archive archive/pre-seoul-2027` 후 `npm ci --prefix ../unik-archive/backend/functions` 를 실행하고, 그 디렉터리(`../unik-archive`)에서 `firebase deploy --only functions:onNewContact --project unik-90206`. 끝나면 `git worktree remove ../unik-archive` 로 정리한다. 되돌리지 않고 두어도 문의 폼은 계속 동작한다.
