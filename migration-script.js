// migration-script.js - Ejecutar este script UNA VEZ para migrar datos existentes
const { db } = require('./config/firebase');

const migratePatientData = async () => {
  try {
    console.log('🚀 Iniciando migración de datos...');
    
    // Obtener todos los pacientes
    const patientsSnapshot = await db.collection('patients').get();
    
    const migrations = [];
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientData = patientDoc.data();
      const patientId = patientDoc.id;
      
      // Verificar si el paciente tiene datos de consulta mezclados
      const hasConsultationData = patientData.disease || patientData.diagnosis || patientData.consultationDate;
      
      if (hasConsultationData) {
        console.log(`📝 Migrando datos del paciente: ${patientData.firstName} ${patientData.lastName}`);
        
        // 1. Crear consulta con los datos mezclados
        const consultationData = {
          patientId: patientId,
          date: patientData.consultationDate || new Date().toISOString(),
          disease: patientData.disease || '',
          diagnosis: patientData.diagnosis || '',
          photos: [],
          doctorId: patientData.doctorId,
          createdAt: patientData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Crear la consulta
        const consultationRef = await db.collection('consultations').add(consultationData);
        console.log(`✅ Consulta creada con ID: ${consultationRef.id}`);
        
        // 2. Limpiar datos del paciente (eliminar campos de consulta)
        const cleanPatientData = {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          age: patientData.age,
          photos: patientData.photos || [],
          photo: patientData.photo || null,
          doctorId: patientData.doctorId,
          createdAt: patientData.createdAt,
          updatedAt: new Date().toISOString()
        };
        
        // Actualizar el paciente eliminando campos de consulta
        await db.collection('patients').doc(patientId).set(cleanPatientData);
        console.log(`✅ Paciente limpiado: ${patientData.firstName} ${patientData.lastName}`);
        
        migrations.push({
          patientId,
          consultationId: consultationRef.id,
          patientName: `${patientData.firstName} ${patientData.lastName}`
        });
      } else {
        console.log(`✅ Paciente ya está limpio: ${patientData.firstName} ${patientData.lastName}`);
      }
    }
    
    console.log('🎉 Migración completada!');
    console.log(`📊 Total de migraciones: ${migrations.length}`);
    
    if (migrations.length > 0) {
      console.log('\n📋 Resumen de migraciones:');
      migrations.forEach(m => {
        console.log(`- ${m.patientName}: Consulta ${m.consultationId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
};

// Ejecutar migración
if (require.main === module) {
  migratePatientData()
    .then(() => {
      console.log('🏁 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migratePatientData };