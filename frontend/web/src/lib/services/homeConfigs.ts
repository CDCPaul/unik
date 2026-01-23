import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { HomeConfig, HomeConfigsDoc, HomeProductKey } from '@unik/shared/types';

const HOME_CONFIGS_DOC_ID = 'homeConfigs';

export async function getHomeConfig(productKey: HomeProductKey): Promise<HomeConfig | null> {
  const ref = doc(db, COLLECTIONS.settings, HOME_CONFIGS_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as HomeConfigsDoc;
  return (data.configs?.[productKey] || data.configs?.default || null) as HomeConfig | null;
}

export function subscribeHomeConfig(
  productKey: HomeProductKey,
  onValue: (config: HomeConfig | null) => void,
  onError?: (err: unknown) => void
) {
  const ref = doc(db, COLLECTIONS.settings, HOME_CONFIGS_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return onValue(null);
      const data = snap.data() as HomeConfigsDoc;
      onValue((data.configs?.[productKey] || data.configs?.default || null) as HomeConfig | null);
    },
    (err) => onError?.(err)
  );
}














