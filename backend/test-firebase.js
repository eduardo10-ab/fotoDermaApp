// simple-test.js - Test diagnóstico paso a paso
require('dotenv').config();
const { admin, db, auth, bucket } = require('./config/firebase');

async function diagnosticTest() {
  console.log('🔍 Diagnóstico de Firebase...\n');

  // Verificar configuración
  console.log('📋 Configuración actual:');
  console.log('- Project ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('- Client Email:', process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 30) + '...');
  console.log('- Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);
  console.log();

  try {
    // Test 1: Verificar que Firebase Admin esté inicializado
    console.log('1️⃣ Verificando inicialización de Firebase Admin...');
    const app = admin.app();
    console.log('✅ Firebase Admin inicializado:', app.name);
    console.log('✅ Project ID confirmado:', app.options.projectId);
    console.log();

    // Test 2: Probar conexión básica con Firestore
    console.log('2️⃣ Probando conexión básica con Firestore...');
    
    // Intentar obtener configuración de la base de datos
    try {
      console.log('   Intentando acceder a Firestore...');
      const firestoreSettings = db.settings || {};
      console.log('✅ Firestore instancia creada');
      console.log('   Settings:', Object.keys(firestoreSettings));
    } catch (error) {
      console.log('❌ Error al acceder a configuración de Firestore:', error.message);
    }
    
    // Test más simple: intentar listar colecciones
    console.log('   Intentando listar colecciones...');
    try {
      const collections = await db.listCollections();
      console.log('✅ Conexión a Firestore exitosa');
      console.log('   Número de colecciones existentes:', collections.length);
      if (collections.length > 0) {
        console.log('   Colecciones:', collections.map(c => c.id).join(', '));
      }
    } catch (error) {
      console.log('❌ Error al listar colecciones:', error.message);
      console.log('   Código de error:', error.code);
      
      if (error.code === 5) {
        console.log('💡 Posible causa: La base de datos Firestore no está completamente configurada');
        console.log('💡 Solución: Ve a Firebase Console y asegúrate de haber creado la base de datos');
      }
      throw error;
    }

    // Test 3: Intentar crear un documento simple
    console.log('\n3️⃣ Intentando crear un documento de prueba...');
    try {
      const testRef = db.collection('test-connection').doc('test-doc');
      await testRef.set({
        message: 'Test de conexión',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success'
      });
      console.log('✅ Documento creado exitosamente');
      
      // Leer el documento
      const doc = await testRef.get();
      if (doc.exists) {
        console.log('✅ Documento leído exitosamente:', doc.data());
        
        // Eliminar el documento de prueba
        await testRef.delete();
        console.log('✅ Documento de prueba eliminado');
      }
    } catch (error) {
      console.log('❌ Error al crear/leer documento:', error.message);
      console.log('   Código de error:', error.code);
      throw error;
    }

    console.log('\n🎉 ¡Todas las pruebas de Firestore pasaron exitosamente!');

  } catch (error) {
    console.log('\n❌ Error en diagnóstico:', error.message);
    console.log('Código de error:', error.code || 'N/A');
    
    console.log('\n🔧 Pasos para solucionar:');
    console.log('1. Ve a https://console.firebase.google.com/project/fotoderma-12b1a');
    console.log('2. En el menú lateral, click en "Firestore Database"');
    console.log('3. Si no tienes una base de datos, click en "Crear base de datos"');
    console.log('4. Selecciona "Modo de prueba" para desarrollo');
    console.log('5. Elige una ubicación (ej: us-central1)');
    console.log('6. Espera a que se complete la configuración');
    console.log('7. Vuelve a ejecutar este test');
  }
}

// Ejecutar diagnóstico
diagnosticTest();