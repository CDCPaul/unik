# Cloud Run 403 Forbidden 해결 방법

## 문제
프로덕션에서 룰렛 API 호출 시 403 Forbidden 오류 발생:
- `POST https://www.unik.ph/api/roulette/spin 403 (Forbidden)`
- Cloud Run 서비스가 인증되지 않은 요청을 차단하고 있음

## 해결 방법

### 옵션 1: Google Cloud Console (GUI)

1. https://console.cloud.google.com/run 접속
2. 다음 서비스들을 각각 클릭:
   - `spinroulette`
   - `createroulettewinner`
3. 각 서비스에서:
   - 상단의 "보안" 또는 "SECURITY" 탭 클릭
   - "인증" 섹션에서 **"인증되지 않은 호출 허용"** 체크
   - "저장" 클릭

### 옵션 2: gcloud CLI (권장 - 빠름)

```powershell
# spinroulette 서비스에 공개 접근 허용
gcloud run services add-iam-policy-binding spinroulette `
  --region=asia-northeast3 `
  --member="allUsers" `
  --role="roles/run.invoker"

# createroulettewinner 서비스에 공개 접근 허용
gcloud run services add-iam-policy-binding createroulettewinner `
  --region=asia-northeast3 `
  --member="allUsers" `
  --role="roles/run.invoker"
```

### 옵션 3: 서비스 재배포 시 플래그 추가

```bash
gcloud run deploy spinroulette \
  --allow-unauthenticated \
  --region=asia-northeast3
```

## 적용된 코드 수정

### API Routes 업데이트
- `/api/roulette/spin/route.ts`: 프로덕션에서 Cloud Run URL 사용
- `/api/roulette/winner/route.ts`: 프로덕션에서 Cloud Run URL 사용

### 수정 내용
```typescript
// Production: use Cloud Run URL
if (process.env.NODE_ENV === 'production') {
  return 'https://spinroulette-6b6i7iageq-du.a.run.app';
}
```

## 확인 방법

Cloud Run 인증 설정 후:
1. `pnpm run build` (frontend/web)
2. Git push하여 재배포
3. https://www.unik.ph/cdc-travel/roulette 접속
4. 룰렛 스핀 테스트

## 보안 고려사항

- 현재는 모든 사용자가 접근 가능 (allUsers)
- 추후 필요시 Firebase Auth token 검증으로 보안 강화 가능
- Rate limiting 추가 권장 (Cloud Armor, API Gateway 등)
