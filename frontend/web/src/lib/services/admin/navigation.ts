import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

export const defaultNavItems: NavItem[] = [
  { id: '1', label: 'Home', href: '/', isVisible: true, order: 0 },
  { id: '2', label: 'Players', href: '/players', isVisible: true, order: 1 },
  { id: '3', label: 'Tour', href: '/tour', isVisible: true, order: 2 },
  { id: '4', label: 'Info', href: '/info', isVisible: true, order: 3 },
  { id: '5', label: 'Register', href: '/register', isVisible: true, order: 4 },
  { id: '6', label: 'Contact', href: '/contact', isVisible: true, order: 5 },
];

// Get navigation items
export async function getNavigation(): Promise<NavItem[]> {
  try {
    const docRef = doc(db, COLLECTIONS.navigation, 'main');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().items as NavItem[];
    }
    return defaultNavItems;
  } catch (error) {
    console.error('Error getting navigation:', error);
    return defaultNavItems;
  }
}

// Save navigation items
export async function saveNavigation(items: NavItem[]): Promise<void> {
  const docRef = doc(db, COLLECTIONS.navigation, 'main');
  await setDoc(docRef, {
    items,
    updatedAt: serverTimestamp(),
  });
}

