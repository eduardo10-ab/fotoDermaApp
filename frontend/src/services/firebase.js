import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Debug extensivo - REMOVER EN PRODUCCIÓN
console.log('🔧 DEBUG FIREBASE COMPLETO:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Todas las variables REACT_APP_:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((obj, key) => {
      obj[key] = key.includes('API_KEY') ? 
        (process.env[key] ? `${process.env[key].substring(0,10)}...` : 'undefined') : 
        process.env[key];
      return obj;
    }, {})
);

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

// Verificación de configuración
console.log('🔧 Firebase Config Status:');
Object.keys(firebaseConfig).forEach(key => {
  const value = firebaseConfig[key];
  console.log(`${key}: ${value ? '✅ OK' : '❌ MISSING'} ${key === 'apiKey' && value ? `(${value.substring(0,10)}...)` : ''}`);
});

// Verificar que la configuración esté completa
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Faltan campos requeridos de Firebase:', missingFields);
  console.error('Configuración actual:', firebaseConfig);
  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
}

console.log('🚀 Inicializando Firebase...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;