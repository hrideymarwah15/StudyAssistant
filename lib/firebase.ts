"use client"

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCGCtP5oChWvXox4q2094VjxFCFO_NdHGI",
  authDomain: "construct-36728.firebaseapp.com",
  projectId: "construct-36728",
  storageBucket: "construct-36728.firebasestorage.app",
  messagingSenderId: "233523505673",
  appId: "1:233523505673:web:e33d871b87d3b248dae6d8",
  measurementId: "G-QGW8V4Q93E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)

export default app
