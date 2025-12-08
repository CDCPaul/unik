import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Player } from '@unik/shared/types';

const COLLECTION = 'players';

// Get all players
export async function getPlayers(): Promise<Player[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
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

// Get single player
export async function getPlayer(id: string): Promise<Player | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
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

// Add new player
export async function addPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...player,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
}

// Update player
export async function updatePlayer(id: string, player: Partial<Player>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...player,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

// Delete player
export async function deletePlayer(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

// Upload player photo
export async function uploadPlayerPhoto(file: File, playerId: string): Promise<string> {
  try {
    const storageRef = ref(storage, `players/${playerId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

// Delete photo from storage
export async function deletePlayerPhoto(photoUrl: string): Promise<void> {
  try {
    const photoRef = ref(storage, photoUrl);
    await deleteObject(photoRef);
  } catch (error) {
    console.error('Error deleting photo:', error);
    // Don't throw - photo might already be deleted
  }
}

