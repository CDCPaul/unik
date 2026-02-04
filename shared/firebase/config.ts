// Firebase Configuration
// IMPORTANT: API keys should be set in environment variables
// For Vercel: Set these in Project Settings > Environment Variables
// For local dev: Create .env.local file in frontend/web directory
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Allowed email domain for admin access
export const ALLOWED_ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || 'cebudirectclub.com';

// Email configuration
export const EMAIL_CONFIG = {
  receiverEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'ticket@cebudirectclub.com',
};

// Collection names
export const COLLECTIONS = {
  registrations: 'registrations',
  players: 'players',
  tours: 'tours',
  gallery: 'gallery',
  contacts: 'contacts',
  infoSections: 'infoSections',
  navigation: 'navigation',
  theme: 'theme',
  settings: 'settings',
  roulette: 'roulette',
  rouletteWinners: 'roulette_winners',
} as const;
