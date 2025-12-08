import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { ContactMessage } from '@unik/shared/types';

// Create contact message
export async function createContactMessage(data: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.contacts), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Get all contact messages
export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.contacts),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as ContactMessage[];
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
}

// Mark message as read
export async function markAsRead(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.contacts, id);
  await updateDoc(docRef, { isRead: true });
}

// Delete contact message
export async function deleteContactMessage(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.contacts, id);
  await deleteDoc(docRef);
}

