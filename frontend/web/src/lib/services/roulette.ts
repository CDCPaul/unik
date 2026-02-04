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
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/roulette/spin', {
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

  const projectId = firebaseConfig.projectId;
  const explicitSpinUrl = process.env.NEXT_PUBLIC_SPIN_ROULETTE_URL;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isUnikProd =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'unik.ph' || window.location.hostname === 'www.unik.ph');
  const prodSpinUrl = 'https://spinroulette-6b6i7iageq-du.a.run.app';
  const endpoint = explicitSpinUrl
    ? explicitSpinUrl
    : explicitBase
      ? `${explicitBase.replace(/\/$/, '')}/spinRoulette`
      : isLocalhost
        ? `http://127.0.0.1:5001/${projectId}/asia-northeast3/spinRoulette`
        : isUnikProd
          ? prodSpinUrl
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
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/roulette/winner', {
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

  const projectId = firebaseConfig.projectId;
  const explicitWinnerUrl = process.env.NEXT_PUBLIC_CREATE_WINNER_URL;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isUnikProd =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'unik.ph' || window.location.hostname === 'www.unik.ph');
  const prodWinnerUrl = 'https://createroulettewinner-6b6i7iageq-du.a.run.app';
  const endpoint = explicitWinnerUrl
    ? explicitWinnerUrl
    : explicitBase
      ? `${explicitBase.replace(/\/$/, '')}/createRouletteWinner`
      : isLocalhost
        ? `http://127.0.0.1:5001/${projectId}/asia-northeast3/createRouletteWinner`
        : isUnikProd
          ? prodWinnerUrl
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
