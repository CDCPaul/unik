import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, TOUR_ID } from '@unik/shared/firebase/config';
import type { Availability, TourConfig } from '@unik/shared/domain';

export function subscribeTourConfig(cb: (c: TourConfig | null) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(doc(db, COLLECTIONS.tourConfig, TOUR_ID), (s) => cb(s.exists() ? (s.data() as TourConfig) : null), onError);
}

export async function saveTourConfig(c: TourConfig, by: string): Promise<void> {
  const clean: TourConfig = {
    ...c,
    mayaPaymentLinkBase: c.mayaPaymentLinkBase?.trim() ? c.mayaPaymentLinkBase.trim() : null,
    notifyEmails: c.notifyEmails.map((e) => e.trim().toLowerCase()).filter(Boolean),
    departures: c.departures.map((d) => ({ ...d, label: d.label.trim(), flightInfo: d.flightInfo.trim() })),
  };
  await setDoc(doc(db, COLLECTIONS.tourConfig, TOUR_ID), { ...clean, updatedAt: serverTimestamp(), updatedBy: by });
}

export function subscribeAvailability(cb: (a: Availability | null) => void): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.availability, TOUR_ID),
    (s) => cb(s.exists() ? (s.data() as Availability) : null),
    () => cb(null),
  );
}
