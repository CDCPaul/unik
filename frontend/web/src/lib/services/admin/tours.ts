import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { TourPackage } from '@unik/shared/types';

const COLLECTION = 'tours';

// Get active tour package
export async function getActiveTour(): Promise<TourPackage | null> {
  try {
    const q = query(
      collection(db, COLLECTION), 
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as TourPackage;
    }
    return null;
  } catch (error) {
    console.error('Error getting tour:', error);
    return null;
  }
}

// Update tour package
export async function updateTour(tour: Partial<TourPackage> & { id: string }): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, tour.id);
    await updateDoc(docRef, {
      ...tour,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    throw error;
  }
}

// Create new tour package
export async function createTour(tour: Omit<TourPackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = doc(db, COLLECTION, 'kbl-allstar-2026');
    await setDoc(docRef, {
      ...tour,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tour:', error);
    throw error;
  }
}

// Upload tour image
export async function uploadTourImage(file: File, tourId: string): Promise<string> {
  try {
    const storageRef = ref(storage, `tours/${tourId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

