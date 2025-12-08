import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { GalleryImage } from '@unik/shared/types';

// Get all gallery images
export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const q = query(
      collection(db, 'gallery'), // Using 'gallery' directly as it might be missing in COLLECTIONS types sometimes or double check shared config
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as GalleryImage[];
  } catch (error) {
    console.error('Error getting gallery images:', error);
    return [];
  }
}

