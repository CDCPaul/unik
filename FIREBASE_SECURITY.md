# 🔐 Firebase API 키 보안 가이드

## ⚠️ 긴급: API 키 제한 설정 필요

GitHub에 Firebase API 키가 노출되었습니다. 즉시 아래 단계를 따라주세요.

## 1단계: Google Cloud Console에서 API 키 제한 (가장 중요!)

1. https://console.cloud.google.com/apis/credentials?project=unik-90206 접속
2. API 키 `AIzaSyAy8U6juEFaRkuzZ9_nkHx6KmGcXnMvWtA` 클릭
3. **애플리케이션 제한사항** 설정:
   - "HTTP 리퍼러(웹사이트)" 선택
   - 허용할 리퍼러 추가:
     ```
     https://www.unik.ph/*
     https://unik.ph/*
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```

4. **API 제한사항** 설정:
   - "키 제한" 선택
   - 다음 API만 선택:
     - ✅ Identity Toolkit API
     - ✅ Firebase Installations API  
     - ✅ Cloud Firestore API
     - ✅ Firebase Storage API
     - ✅ Cloud Functions API

5. 저장 클릭

## 2단계: Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAy8U6juEFaRkuzZ9_nkHx6KmGcXnMvWtA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unik-90206.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unik-90206
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unik-90206.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=884586493742
NEXT_PUBLIC_FIREBASE_APP_ID=1:884586493742:web:7ea7ddc03c2653ac2facbf
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-KZ37Z5VKCR
```

## 3단계: 로컬 개발 환경

`.env.local` 파일이 `frontend/web/` 디렉터리에 생성되었습니다.
이 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다.

## 중요 참고사항

### Firebase API 키는 완전히 비밀이 아닙니다
- Firebase API 키는 클라이언트 브라우저에서 사용되므로 어느 정도 공개됩니다
- **중요한 것은 제한사항 설정입니다**
- Firestore Security Rules와 함께 사용하면 안전합니다

### 이미 노출된 키는?
- 제한사항을 설정하면 악용을 방지할 수 있습니다
- 필요시 새 키를 생성할 수 있지만, 제한사항 설정이 더 중요합니다

## 참고 자료
- [Firebase API 키 보안](https://firebase.google.com/docs/projects/api-keys)
- [API 키 제한사항](https://cloud.google.com/docs/authentication/api-keys)
