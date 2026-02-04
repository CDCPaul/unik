import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { RouletteWinner } from '@unik/shared/types';

export async function getRouletteWinners(maxItems: number = 200): Promise<RouletteWinner[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.rouletteWinners),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as RouletteWinner[];
  } catch (error) {
    console.error('Error getting roulette winners:', error);
    return [];
  }
}
