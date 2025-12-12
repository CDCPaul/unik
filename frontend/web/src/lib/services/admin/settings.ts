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
  heroTitle: {
    text: '',
    fontFamily: 'display',
  },
  homePageMedia: {
    heroBackgroundByProduct: {
      default: '',
      courtside: '',
      'cherry-blossom': '',
    },
  },
  homePageText: {
    heroBadgeText: 'Official Tour Package',
    heroSubtitleText: '',
    primaryCtaText: 'View Tour Details',
    secondaryCtaText: 'Book Now',
    tbaText: 'TBA',
    quickInfoDateLabel: 'Date',
    quickInfoVenueLabel: 'Venue',
    featuredPlayersHeading: 'Filipino Stars',
    featuredPlayersSubheading: 'Meet the pride of Philippines in KBL.',
    featuredPlayersCtaText: 'View All Players',
    galleryHeading: 'Tour Gallery',
    gallerySubheading: 'Sneak peek of what awaits you in Korea.',
    galleryCtaText: 'View Full Gallery',
    ctaHeading: "Don't Miss the Action!",
    ctaBody: 'Secure your spot now for the KBL All-Star 2026 Tour. Limited seats available for this exclusive experience.',
    ctaButtonText: 'Register Now',
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

// Upload home hero background image (optionally per product)
export async function uploadHomeHeroBackground(
  file: File,
  productKey: 'default' | 'courtside' | 'cherry-blossom'
): Promise<string> {
  try {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const storageRef = ref(storage, `settings/home-hero/${productKey}/${Date.now()}_${safeName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading home hero background:', error);
    throw error;
  }
}

