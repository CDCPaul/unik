import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type RegistrationStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
  status: RegistrationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get all registrations
export async function getRegistrations(): Promise<Registration[]> {
  try {
    const q = query(
      collection(db, 'registrations'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Registration[];
  } catch (error) {
    console.error('Error getting registrations:', error);
    return [];
  }
}

// Update registration status
export async function updateRegistrationStatus(
  id: string, 
  status: RegistrationStatus, 
  notes?: string
): Promise<void> {
  const docRef = doc(db, 'registrations', id);
  await updateDoc(docRef, {
    status,
    notes: notes || null,
    updatedAt: serverTimestamp(),
  });
}

// Delete registration
export async function deleteRegistration(id: string): Promise<void> {
  const docRef = doc(db, 'registrations', id);
  await deleteDoc(docRef);
}

// Get registration stats
export async function getRegistrationStats() {
  const registrations = await getRegistrations();
  return {
    total: registrations.length,
    new: registrations.filter(r => r.status === 'new').length,
    contacted: registrations.filter(r => r.status === 'contacted').length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
  };
}

