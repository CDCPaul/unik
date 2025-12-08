import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';

export interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  logoUrl: string;
  faviconUrl: string;
}

export const defaultSettings: SiteSettings = {
  siteName: 'UNIK',
  tagline: 'Your Gateway to Korean Basketball',
  contactEmail: 'ticket@cebudirectclub.com',
  contactPhone: '+63 912 345 6789',
  address: 'Cebu City, Philippines',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  logoUrl: '',
  faviconUrl: '',
};

// Get site settings
export async function getSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.settings, 'site');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() } as SiteSettings;
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

// Save site settings
export async function saveSettings(settings: SiteSettings): Promise<void> {
  const docRef = doc(db, COLLECTIONS.settings, 'site');
  await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
}

