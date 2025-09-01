import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Debug temporal - remover después
console.log('🔧 Debug Firebase Config:');
console.log('API Key exists:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  apiUrl: process.env.REACT_APP_API_URL
};

// Verificar configuración antes de inicializar
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key no configurada');
  console.error('Variables disponibles:', Object.keys(process.env));
}

console.log('🔧 Firebase Config (sin API key):', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;