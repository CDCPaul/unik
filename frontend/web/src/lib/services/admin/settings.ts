import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { CompanyInfo } from '@unik/shared/types';

export const defaultSettings: CompanyInfo = {
  id: 'company',
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
    const docRef = doc(db, 'settings', 'company');
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
  const docRef = doc(db, 'settings', 'company');
  // Remove undefined values
  const data = JSON.parse(JSON.stringify(settings));
  
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Upload logo image
export async function uploadLogo(file: File): Promise<string> {
  try {
    const storageRef = ref(storage, `settings/logo/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

