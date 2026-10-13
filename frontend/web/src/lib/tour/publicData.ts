import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, TOUR_ID } from '@unik/shared/firebase/config';
import { exceedsCapacity } from '@unik/shared/domain';
import type { Availability, Category, Counts, TourConfig } from '@unik/shared/domain';

export async function fetchTourConfig(): Promise<TourConfig | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.tourConfig, TOUR_ID));
    return snap.exists() ? (snap.data() as TourConfig) : null;
  } catch (error) {
    console.error('fetchTourConfig failed', error);
    return null;
  }
}

export function subscribeTourData(
  callback: (data: { config: TourConfig | null; availability: Availability | null }) => void,
  onError?: (error: unknown) => void,
): () => void {
  let config: TourConfig | null = null;
  let availability: Availability | null = null;
  const emit = () => callback({ config, availability });
  const offConfig = onSnapshot(
    doc(db, COLLECTIONS.tourConfig, TOUR_ID),
    (s) => {
      config = s.exists() ? (s.data() as TourConfig) : null;
      emit();
    },
    (error) => onError?.(error),
  );
  const offAvailability = onSnapshot(
    doc(db, COLLECTIONS.availability, TOUR_ID),
    (s) => {
      availability = s.exists() ? (s.data() as Availability) : null;
      emit();
    },
    (error) => onError?.(error),
  );
  return () => {
    offConfig();
    offAvailability();
  };
}

export type DepartureStatus = 'open' | 'closed' | 'full';

export function departureStatus(
  config: TourConfig,
  availability: Availability | null,
  departureId: string,
  counts: Counts,
): DepartureStatus {
  const dep = config.departures.find((d) => d.id === departureId);
  if (!config.acceptingApplications || !dep || !dep.isOpen) return 'closed';
  // 남은 자리 문서가 아직 없거나 새 출발편이 반영되기 전이면 서버 판단에 맡긴다.
  if (!availability || !availability.departures[departureId]) return 'open';
  return exceedsCapacity(availability, departureId, counts) ? 'full' : 'open';
}

export function lowestPrice(config: TourConfig, category: Category): number | null {
  const prices = config.departures.filter((d) => d.isOpen).map((d) => d.prices[category]);
  return prices.length > 0 ? Math.min(...prices) : null;
}
