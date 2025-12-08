import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { ALLOWED_ADMIN_DOMAIN } from '@unik/shared/firebase/config';

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Check if email domain is allowed
  const email = user.email;
  if (!email || !email.endsWith(`@${ALLOWED_ADMIN_DOMAIN}`)) {
    await firebaseSignOut(auth);
    throw new Error(`Only @${ALLOWED_ADMIN_DOMAIN} email addresses are allowed.`);
  }
  
  return user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Check if user is authenticated and authorized
export function isAuthorized(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.endsWith(`@${ALLOWED_ADMIN_DOMAIN}`);
}

