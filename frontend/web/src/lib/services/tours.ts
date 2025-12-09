import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { TourPackage } from '@unik/shared/types';

// Get all tours
export async function getTours(): Promise<TourPackage[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.tours),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TourPackage[];
  } catch (error) {
    console.error('Error getting tours:', error);
    return [];
  }
}

// Get the currently active tour package
export async function getActiveTour(): Promise<TourPackage | null> {
  try {
    // First try to get the featured active tour
    const featuredQuery = query(
      collection(db, COLLECTIONS.tours),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      limit(1)
    );
    
    const featuredSnapshot = await getDocs(featuredQuery);
    
    if (!featuredSnapshot.empty) {
      const doc = featuredSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as TourPackage;
    }

    // If no featured tour, get the latest active tour
    const latestQuery = query(
      collection(db, COLLECTIONS.tours),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const latestSnapshot = await getDocs(latestQuery);

    if (!latestSnapshot.empty) {
      const doc = latestSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as TourPackage;
    }

    return null;
  } catch (error) {
    console.error('Error getting active tour:', error);
    return null;
  }
}

