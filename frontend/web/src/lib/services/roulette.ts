import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firebaseConfig } from '@unik/shared/firebase/config';
import type { RouletteConfig, RouletteSlot } from '@unik/shared/types';

export const DEFAULT_ROULETTE_ID = 'cdc-travel';

const buildDefaultSlots = (): RouletteSlot[] =>
  Array.from({ length: 50 }).map((_, idx) => ({
    id: `slot-${idx + 1}`,
    label: `Gift ${idx + 1}`,
    grade: idx % 10 === 0 ? 'high' : idx % 3 === 0 ? 'mid' : 'low',
    probability: idx % 10 === 0 ? 1 : idx % 3 === 0 ? 2 : 3,
    total_stock: idx % 10 === 0 ? 10 : idx % 3 === 0 ? 30 : 60,
    current_stock: idx % 10 === 0 ? 10 : idx % 3 === 0 ? 30 : 60,
  }));

export const defaultRouletteConfig: RouletteConfig = {
  id: DEFAULT_ROULETTE_ID,
  title: 'CDC TRAVEL Roulette',
  slotCount: 50,
  targetSpins: 1000,
  visualCounts: { high: 5, mid: 10, low: 35 },
  visualPattern: ['low', 'low', 'low', 'mid', 'high', 'mid', 'low', 'low', 'low'],
  tiers: [
    { id: 'high', name: 'Premium Prize', probability: 0.2 },
    { id: 'mid', name: 'Special Prize', probability: 1.0 },
    { id: 'low', name: 'Regular Prize', probability: 98.8 },
  ],
  slots: buildDefaultSlots(),
};

export async function getRouletteConfig(
  rouletteId: string = DEFAULT_ROULETTE_ID
): Promise<RouletteConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.roulette, rouletteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultRouletteConfig, ...(docSnap.data() as RouletteConfig) };
    }
    return defaultRouletteConfig;
  } catch (error) {
    console.error('Error getting roulette config:', error);
    return defaultRouletteConfig;
  }
}

export async function saveRouletteConfig(config: RouletteConfig): Promise<void> {
  const docRef = doc(db, COLLECTIONS.roulette, config.id || DEFAULT_ROULETTE_ID);
  const data = JSON.parse(JSON.stringify(config));
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export interface RouletteSpinResponse {
  index: number;
  slot: RouletteSlot;
  remainingStock: number;
}

export interface RouletteWinnerPayload {
  rouletteId: string;
  winnerName: string;
  winnerContact: string;
  slot: RouletteSlot;
  slotIndex?: number;
}

export async function spinRoulette(
  rouletteId: string = DEFAULT_ROULETTE_ID
): Promise<RouletteSpinResponse> {
  const projectId = firebaseConfig.projectId;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const endpoint = explicitBase
    ? `${explicitBase.replace(/\/$/, '')}/spinRoulette`
    : isLocalhost
      ? `http://127.0.0.1:5001/${projectId}/asia-northeast3/spinRoulette`
      : `https://asia-northeast3-${projectId}.cloudfunctions.net/spinRoulette`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rouletteId }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to spin roulette');
  }

  return response.json();
}

export async function createRouletteWinner(payload: RouletteWinnerPayload): Promise<{ id: string }> {
  const projectId = firebaseConfig.projectId;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const endpoint = explicitBase
    ? `${explicitBase.replace(/\/$/, '')}/createRouletteWinner`
    : isLocalhost
      ? `http://127.0.0.1:5001/${projectId}/asia-northeast3/createRouletteWinner`
      : `https://asia-northeast3-${projectId}.cloudfunctions.net/createRouletteWinner`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to save winner');
  }

  return response.json();
}
