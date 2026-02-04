// Firebase Configuration
// IMPORTANT: API keys should be set in environment variables
// For Vercel: Set these in Project Settings > Environment Variables
// For local dev: Create .env.local file in frontend/web directory
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAy8U6juEFaRkuzZ9_nkHx6KmGcXnMvWtA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "unik-90206.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unik-90206",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "unik-90206.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "884586493742",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:884586493742:web:7ea7ddc03c2653ac2facbf",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KZ37Z5VKCR"
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
