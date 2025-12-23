"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

// Firebase configuration - Read from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Check if running in browser
const isBrowser = typeof window !== "undefined"

// Validate Firebase configuration
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
if (!isConfigValid && isBrowser) {
  console.error("❌ Firebase configuration is incomplete. Please check your .env.local file.")
  console.error("Required variables: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  console.error("Current config:", {
    apiKey: firebaseConfig.apiKey ? "✓ Set" : "✗ Missing",
    authDomain: firebaseConfig.authDomain ? "✓ Set" : "✗ Missing",
    projectId: firebaseConfig.projectId ? "✓ Set" : "✗ Missing",
  })
}

// Initialize Firebase only if it hasn't been initialized already
// This prevents the "Firebase: Error (app/already-initialized)" error
let app: FirebaseApp
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig)
    if (isBrowser) {
      console.log("✓ Firebase initialized successfully for project:", firebaseConfig.projectId)
    }
  } catch (error: any) {
    console.error("Firebase initialization error:", error)
    throw new Error("Failed to initialize Firebase. Please check your configuration.")
  }
} else {
  app = getApps()[0]
}

// Initialize Firebase services with error handling
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)

// Set auth persistence to LOCAL (persists even after browser is closed)
if (isBrowser) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Failed to set auth persistence:", error)
  })
}

// Log auth state for debugging
if (isBrowser) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("✓ User authenticated:", user.email, "UID:", user.uid)
    } else {
      console.log("○ No user signed in")
    }
  }, (error) => {
    const authError = error as { code?: string; message?: string }
    console.error("✗ Auth state error:", authError.code, authError.message)
  })
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: "select_account",
})

export default app
