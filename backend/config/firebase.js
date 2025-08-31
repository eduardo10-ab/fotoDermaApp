const admin = require('firebase-admin');

// Cargar variables de entorno desde archivo .env
require('dotenv').config();

/**
 * Variables de entorno requeridas para Firebase Admin SDK
 * Estas deben estar configuradas en el archivo .env o en las variables del sistema
 */
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_CLIENT_CERT_URL',
  'FIREBASE_STORAGE_BUCKET'
];

/**
 * Validación de variables de entorno
 * Verifica que todas las variables necesarias estén configuradas
 * Si falta alguna, termina la ejecución del programa
 */
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Variable de entorno faltante: ${envVar}`);
    process.exit(1);
  }
}

/**
 * Configuración de la cuenta de servicio para Firebase Admin SDK
 * Utiliza las variables de entorno para construir el objeto de credenciales
 */
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // Reemplaza las secuencias de escape \n con saltos de línea reales
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  // URLs estándar de Google OAuth2
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

/**
 * Inicialización de Firebase Admin SDK
 * Solo inicializa si no existe una aplicación previamente configurada
 * Esto evita errores al reinicializar la aplicación durante el desarrollo
 */
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      // URL de la base de datos en tiempo real (opcional)
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
    });
    console.log('Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error);
    process.exit(1);
  }
}

/**
 * Instancias de los servicios de Firebase
 */
const db = admin.firestore(); // Cliente de Firestore para base de datos NoSQL
const bucket = admin.storage().bucket(); // Cliente de Storage para archivos
const auth = admin.auth(); // Cliente de Authentication para gestión de usuarios

/**
 * Exportación de los servicios para uso en otros módulos
 */
module.exports = {
  admin,  // Instancia completa de Firebase Admin
  db,     // Cliente de Firestore
  bucket, // Cliente de Storage
  auth    // Cliente de Authentication
};