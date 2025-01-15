// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAN-MdcvUsusrkZBVxBdvJnmz4vwVlNlEY",
  authDomain: "talento-transfer-app.firebaseapp.com",
  projectId: "talento-transfer-app",
  storageBucket: "talento-transfer-app.firebasestorage.app",
  messagingSenderId: "775089240781",
  appId: "1:775089240781:web:0177625a3ccaee8afa4784",
  measurementId: "G-K6LQJZ8MFG"
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Types
export interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'client';
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
  clientId?: string;
}

export { app, auth, db, database, storage };
