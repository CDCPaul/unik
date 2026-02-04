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

if (typeof window !== 'undefined') {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const useEmulator = isLocalhost && process.env.NODE_ENV !== 'production';
  const globalWindow = window as Window & { __firestoreEmulatorConnected?: boolean };
  if (useEmulator && !globalWindow.__firestoreEmulatorConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    globalWindow.__firestoreEmulatorConnected = true;
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
