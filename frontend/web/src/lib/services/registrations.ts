import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { Registration, RegistrationStatus } from '@unik/shared/types';

// Create a new registration
export async function createRegistration(data: Omit<Registration, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.registrations), {
    ...data,
    status: 'new' as RegistrationStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Get all registrations
export async function getRegistrations() {
  const q = query(
    collection(db, COLLECTIONS.registrations),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Registration[];
}

// Update registration status
export async function updateRegistrationStatus(id: string, status: RegistrationStatus, notes?: string) {
  const docRef = doc(db, COLLECTIONS.registrations, id);
  await updateDoc(docRef, {
    status,
    notes: notes || null,
    updatedAt: serverTimestamp(),
  });
}

// Delete registration
export async function deleteRegistration(id: string) {
  const docRef = doc(db, COLLECTIONS.registrations, id);
  await deleteDoc(docRef);
}

