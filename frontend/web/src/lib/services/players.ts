import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { Player } from '@unik/shared/types';

// Get all players
export async function getPlayers(): Promise<Player[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.players),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Player[];
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
}

// Get single player by ID
export async function getPlayer(id: string): Promise<Player | null> {
  try {
    const docRef = doc(db, COLLECTIONS.players, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      } as Player;
    }
    return null;
  } catch (error) {
    console.error('Error getting player:', error);
    return null;
  }
}

// Get active players only
export async function getActivePlayers(): Promise<Player[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.players),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Player[];
  } catch (error) {
    console.error('Error getting active players:', error);
    return [];
  }
}

// Create player
export async function createPlayer(data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.players), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Update player
export async function updatePlayer(id: string, data: Partial<Player>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.players, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete player
export async function deletePlayer(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.players, id);
  await deleteDoc(docRef);
}

// Reorder players
export async function reorderPlayers(players: { id: string; order: number }[]): Promise<void> {
  const promises = players.map(({ id, order }) => {
    const docRef = doc(db, COLLECTIONS.players, id);
    return updateDoc(docRef, { order, updatedAt: serverTimestamp() });
  });
  await Promise.all(promises);
}
