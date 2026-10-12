import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { computeAvailability, type Availability } from '../shared-domain';
import { COL, TOUR_ID } from '../lib/collections';
import { loadTourConfig } from '../lib/tourConfig';
import { toSummary } from './summary';

export async function recomputeAvailability(db: Firestore): Promise<Availability | null> {
  const config = await loadTourConfig(db);
  if (!config) return null;
  const apps = await db.collection(COL.applications).get();
  const availability = computeAvailability(
    config,
    apps.docs.map((d) => toSummary(d.data())),
  );
  await db
    .collection(COL.availability)
    .doc(TOUR_ID)
    .set({ ...availability, updatedAt: FieldValue.serverTimestamp() });
  return availability;
}
