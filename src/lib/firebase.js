import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB0Yv_5_2wZAJNrL3diIfvH93Xx8jr33ng',
  authDomain: 'shriharishcracker.firebaseapp.com',
  projectId: 'shriharishcracker',
  storageBucket: 'shriharishcracker.firebasestorage.app',
  messagingSenderId: '599179135756',
  appId: '1:599179135756:web:e9e6ef629da16014dd5729',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
