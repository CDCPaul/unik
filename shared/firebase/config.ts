// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAy8U6juEFaRkuzZ9_nkHx6KmGcXnMvWtA",
  authDomain: "unik-90206.firebaseapp.com",
  projectId: "unik-90206",
  storageBucket: "unik-90206.firebasestorage.app",
  messagingSenderId: "884586493742",
  appId: "1:884586493742:web:7ea7ddc03c2653ac2facbf",
  measurementId: "G-KZ37Z5VKCR"
};

// Allowed email domain for admin access
export const ALLOWED_ADMIN_DOMAIN = 'cebudirectclub.com';

// Email configuration
export const EMAIL_CONFIG = {
  receiverEmail: 'ticket@cebudirectclub.com',
};

// Collection names
export const COLLECTIONS = {
  registrations: 'registrations',
  players: 'players',
  tours: 'tours',
  gallery: 'gallery',
  contacts: 'contacts',
  infoSections: 'infoSections',
} as const;

