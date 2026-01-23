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
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { AirlineTicket } from '@unik/shared/types';

// Import airline-specific parsers
import { parseJejuAirPdf } from './parsers/jejuAir';
import { parseJinAirHtml } from './parsers/jinAir';
import { parseCebuPacificPdf } from './parsers/cebuPacific';
import { parseAirBusanNameList } from './parsers/airBusan';

const COLLECTION = 'airline-tickets';

// ========================================
// File Upload Functions
// ========================================

export async function uploadTicketPdf(file: File): Promise<string> {
  try {
    const storageRef = ref(storage, `tickets/pdf/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

// ========================================
// CRUD Functions
// ========================================

export async function createTicket(ticket: Omit<AirlineTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const timestamp = Date.now();
    const docId = `${ticket.airline.toLowerCase()}-${ticket.reservationNumber}-${timestamp}`;
    const docRef = doc(db, COLLECTION, docId);
    
    await setDoc(docRef, {
      ...ticket,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docId;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function getTicket(id: string): Promise<AirlineTicket | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      } as AirlineTicket;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ticket:', error);
    return null;
  }
}

export async function getAllTickets(): Promise<AirlineTicket[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as AirlineTicket));
  } catch (error) {
    console.error('Error getting all tickets:', error);
    return [];
  }
}

// Helper function to remove undefined values from objects
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively clean nested objects
        const cleaned = removeUndefined(value);
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }
  });
  return result;
}

export async function updateTicket(id: string, data: Partial<AirlineTicket>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    // Remove undefined values to avoid Firestore errors
    const cleanData = removeUndefined(data);
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
}

export async function deleteTicket(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
}

// Re-export parsers
export { parseJejuAirPdf, parseJinAirHtml, parseCebuPacificPdf, parseAirBusanNameList };
