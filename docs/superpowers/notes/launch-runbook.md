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
