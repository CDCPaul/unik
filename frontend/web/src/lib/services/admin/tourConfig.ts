import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, TOUR_ID } from '@unik/shared/firebase/config';
import type { Availability, TourConfig } from '@unik/shared/domain';

export type TourConfigMeta = { updatedAtMs: number | null; pending: boolean };

/** 두 번째 인자(meta)는 동시 편집 감지용: 서버가 기록한 updatedAt(ms)과 로컬 쓰기 대기 여부. */
export function subscribeTourConfig(
  cb: (c: TourConfig | null, meta: TourConfigMeta) => void,
  onError: (e: unknown) => void,
): () => void {
  return onSnapshot(
    doc(db, COLLECTIONS.tourConfig, TOUR_ID),
    (s) => {
      const ts = s.exists() ? (s.get('updatedAt') as { toMillis?: () => number } | null | undefined) : null;
      const updatedAtMs = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : null;
      cb(s.exists() ? (s.data() as TourConfig) : null, { updatedAtMs, pending: s.metadata.hasPendingWrites });
    },
    onError,
  );
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
