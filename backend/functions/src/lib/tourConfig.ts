import type { Firestore } from 'firebase-admin/firestore';
import type { TourConfig } from '../shared-domain';
import { COL, FALLBACK_NOTIFY_EMAIL, TOUR_ID } from './collections';

export async function loadTourConfig(db: Firestore): Promise<TourConfig | null> {
  const snap = await db.collection(COL.tourConfig).doc(TOUR_ID).get();
  return snap.exists ? (snap.data() as TourConfig) : null;
}

export async function getNotifyEmails(db: Firestore): Promise<string[]> {
  const config = await loadTourConfig(db);
  const emails = (config?.notifyEmails ?? []).map((e) => e.trim()).filter((e) => e.includes('@'));
  return emails.length > 0 ? emails : [FALLBACK_NOTIFY_EMAIL];
}
