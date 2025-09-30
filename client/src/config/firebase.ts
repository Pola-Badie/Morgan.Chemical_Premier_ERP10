import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from "firebase/auth";

// Check if Firebase credentials are available
const hasFirebaseConfig = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_APP_ID;

const firebaseConfig = hasFirebaseConfig ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} : null;

// Initialize Firebase only if config is available
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

// Initialize Firebase Authentication and get a reference to the service
export const auth = app ? getAuth(app) : undefined;

// Initialize Google Auth Provider only if Firebase is configured
export const googleProvider = hasFirebaseConfig ? new GoogleAuthProvider() : null;

// Configure Google Provider if available
if (googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

// Sign in with Google using popup
export const signInWithGooglePopup = () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase not configured. Please add your Firebase credentials to enable Google login.');
  }
  return signInWithPopup(auth, googleProvider);
};

// Sign in with Google using redirect
export const signInWithGoogleRedirect = () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase not configured. Please add your Firebase credentials to enable Google login.');
  }
  return signInWithRedirect(auth, googleProvider);
};

// Handle redirect result
export const handleGoogleRedirectResult = () => {
  if (!auth) {
    throw new Error('Firebase not configured. Please add your Firebase credentials to enable Google login.');
  }
  return getRedirectResult(auth);
};

export default app;