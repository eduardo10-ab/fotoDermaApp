// firebase.js o firebase-config.js en tu frontend
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Verificar que las variables se carguen correctamente
console.log('Firebase Config Status:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ OK' : '❌ Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ OK' : '❌ Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ OK' : '❌ Missing',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ OK' : '❌ Missing',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ OK' : '❌ Missing',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ OK' : '❌ Missing',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ? '✅ OK' : '❌ Missing'
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;