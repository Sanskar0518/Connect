import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential, Auth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { env } from "@/lib/env";

export const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBwXm1z-dCElY9r2MVA2e1JZLiO49p0aJw",
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "connect-5e0ba.firebaseapp.com",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "connect-5e0ba",
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "connect-5e0ba.firebasestorage.app",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "268077711547",
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:268077711547:web:a3994cf054362170d7299e",
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ZSRTXS84CV",
};

// Initialize Firebase singleton
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Google OAuth configuration
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Triggers native Google Sign-In popup with Firebase Auth
 */
export async function signInWithGooglePopup(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Uploads a file/buffer to Firebase Storage and returns the public download URL
 */
export async function uploadToFirebaseStorage(
  storagePath: string,
  data: Blob | Uint8Array | ArrayBuffer,
  contentType?: string
): Promise<{ url: string; path: string }> {
  const fileRef = ref(storage, storagePath);
  const metadata = contentType ? { contentType } : undefined;
  await uploadBytes(fileRef, data, metadata);
  const url = await getDownloadURL(fileRef);
  return { url, path: storagePath };
}

/**
 * Safely initializes Firebase Analytics in browser environments
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
}
