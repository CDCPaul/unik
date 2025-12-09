import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { TourPackage } from '@unik/shared/types';

const COLLECTION = 'tours';

// Get all tours
export async function getAllTours(): Promise<TourPackage[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as TourPackage));
  } catch (error) {
    console.error('Error getting all tours:', error);
    return [];
  }
}

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

// Get single tour by ID
export async function getTour(id: string): Promise<TourPackage | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
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
    // Generate a slug-based ID from title and productId
    const timestamp = Date.now();
    const slug = `${tour.productId}-${tour.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`;
    const docRef = doc(db, COLLECTION, slug);
    
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

// Delete tour package
export async function deleteTour(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting tour:', error);
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
