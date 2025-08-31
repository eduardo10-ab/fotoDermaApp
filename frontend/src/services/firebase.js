import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyCumMUbfteWSb96zQNMoC51iw6YSE3KXpw",
  authDomain: "fotoderma-12b1a.firebaseapp.com",
  projectId: "fotoderma-12b1a",
  storageBucket: "fotoderma-12b1a.firebasestorage.app",
  messagingSenderId: "22087608948",
  appId: "1:22087608948:web:2e8aeb51830b9f39ab7f21",
  measurementId: "G-1CVVKGTT70"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;