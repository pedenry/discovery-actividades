import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDqx9S-abvdfz_DIq7n21FMzAFRuQ_4gU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "discovery-actividades.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "discovery-actividades",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "discovery-actividades.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "421805603915",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:421805603915:web:fccd8329ace8a655621ce",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)

// Connect to emulators only if explicitly enabled
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    console.log('🔥 Connected to Firestore emulator')
  } catch (error) {
    console.log('Firestore emulator already connected')
  }
} else {
  console.log('🌐 Using Firebase production services')
}

export default app
