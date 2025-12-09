import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CompanyInfo } from '@unik/shared/types';

export const defaultSettings: CompanyInfo = {
  id: 'general',
  brandName: 'UNI-K Tour',
  logoUrl: '',
  description: 'Experience the KBL All-Star 2026 Tour',
  contactEmail: 'ticket@cebudirectclub.com',
  contactPhone: '+63-XXX-XXX-XXXX',
  contactViber: '+63-XXX-XXX-XXXX',
  officeAddress: 'Cebu City, Philippines',
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
  },
};

// Get settings
export async function getSettings(): Promise<CompanyInfo> {
  try {
    const docRef = doc(db, 'settings', 'general');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() } as CompanyInfo;
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

// Save settings
export async function saveSettings(settings: CompanyInfo): Promise<void> {
  const docRef = doc(db, 'settings', 'general');
  // Remove undefined values
  const data = JSON.parse(JSON.stringify(settings));
  
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

