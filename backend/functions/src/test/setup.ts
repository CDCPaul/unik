import { getApps, initializeApp } from 'firebase-admin/app';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Run tests with `npm test` so the Firestore emulator is started (FIRESTORE_EMULATOR_HOST missing).');
}
if (getApps().length === 0) initializeApp({ projectId: 'demo-unik' });
