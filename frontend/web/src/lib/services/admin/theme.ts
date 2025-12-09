import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';

export interface ThemeColors {
  pageBg: string;
  navbarBg: string;
  cardBg: string;
  footerBg: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  primaryBtnHoverBg: string;
  secondaryBtnBg: string;
  secondaryBtnText: string;
  secondaryBtnBorder: string;
  accentColor: string;
  goldColor: string;
}

export const defaultTheme: ThemeColors = {
  pageBg: '#0f172a',
  navbarBg: '#0f172a',
  cardBg: '#1e293b',
  footerBg: '#020617',
  headingText: '#ffffff',
  bodyText: '#f1f5f9',
  mutedText: '#94a3b8',
  primaryBtnBg: '#d4876a',
  primaryBtnText: '#ffffff',
  primaryBtnHoverBg: '#c66a4a',
  secondaryBtnBg: '#334155',
  secondaryBtnText: '#ffffff',
  secondaryBtnBorder: '#475569',
  accentColor: '#0ea5e9',
  goldColor: '#eab308',
};

// Get current theme
export async function getTheme(): Promise<ThemeColors> {
  try {
    const docRef = doc(db, COLLECTIONS.theme, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { ...defaultTheme, ...data } as ThemeColors;
    }
    return defaultTheme;
  } catch (error) {
    console.error('Error getting theme:', error);
    return defaultTheme;
  }
}

// Save theme
export async function saveTheme(theme: ThemeColors): Promise<void> {
  const docRef = doc(db, COLLECTIONS.theme, 'current');
  await setDoc(docRef, {
    ...theme,
    updatedAt: serverTimestamp(),
  });
}

