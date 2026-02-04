import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import type { NavItem, TabItem } from '@unik/shared/types';

export type { NavItem, TabItem };

export const defaultNavItems: NavItem[] = [
  { id: '1', label: 'Home', href: '/', isVisible: true, order: 0 },
  { 
    id: '2', 
    label: 'Tour', 
    href: '/tour', 
    isVisible: true, 
    order: 1,
    children: [
      { 
        id: '2-1', 
        label: 'Courtside', 
        href: '/tour/courtside', 
        isVisible: true, 
        order: 0,
        tabs: [
          { id: 'overview', label: 'Overview', path: 'overview', isVisible: true, order: 0 },
          { id: 'schedule', label: 'Schedule', path: 'schedule', isVisible: true, order: 1 },
          { id: 'itinerary', label: 'Itinerary', path: 'itinerary', isVisible: true, order: 2 },
          { id: 'players', label: 'Players', path: 'players', isVisible: true, order: 3 },
          { id: 'gallery', label: 'Gallery', path: 'gallery', isVisible: true, order: 4 },
        ]
      },
      { id: '2-2', label: 'Cherry Blossom Marathon', href: '/cherry-blossom-marathon', isVisible: true, order: 1 },
    ]
  },
  { id: '3', label: 'Gallery', href: '/gallery', isVisible: true, order: 2 },
  { id: '4', label: 'Info', href: '/info', isVisible: true, order: 3 },
  { id: '5', label: 'Register', href: '/register', isVisible: true, order: 4 },
  { id: '6', label: 'Event', href: '/cdc-travel/roulette', isVisible: true, order: 5 },
  { id: '7', label: 'Contact', href: '/contact', isVisible: true, order: 6 },
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

