import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from '@unik/shared/firebase/config';

let app: FirebaseApp;

// Initialize Firebase
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Firestore 에뮬레이터 연결 (명시적으로 환경변수 설정 시에만)
if (typeof window !== 'undefined') {
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true';
  const globalWindow = window as Window & { __firestoreEmulatorConnected?: boolean };
  
  if (useEmulator && !globalWindow.__firestoreEmulatorConnected) {
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      globalWindow.__firestoreEmulatorConnected = true;
      console.log('✅ Firestore 에뮬레이터에 연결됨');
    } catch (error) {
      console.warn('⚠️ Firestore 에뮬레이터 연결 실패:', error);
    }
  }
}

// Initialize Analytics (only in browser)
let analytics: Analytics | null = null;
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && !analytics) {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
};

export { app, analytics };
export default app;
