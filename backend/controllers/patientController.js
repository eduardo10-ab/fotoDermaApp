const { db } = require('../config/firebase');

/**
 * Ajusta fechas a formato local (YYYY-MM-DD) para evitar problemas de zona horaria
 * @param {string} dateString - Fecha en formato string
 * @returns {string|null} - Fecha en formato YYYY-MM-DD o null si no es válida
 */
const adjustDateForLocalTimezone = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene todos los pacientes de un doctor específico
 * Ordenados por fecha de creación (más recientes primero)
 */
const getAllPatients = async (req, res) => {
  try {
    const patientsRef = db.collection('patients');
    const snapshot = await patientsRef
      .where('doctorId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const patients = [];
    snapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: patients
    });
    
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get patients'
    });
  }
};

/**
 * Obtiene un paciente específico por su ID
 * Verifica que el paciente pertenezca al doctor autenticado
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const patientRef = db.collection('patients').doc(id);
    const patientDoc = await patientRef.get();
    
    // Verificar si el paciente existe
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    const patientData = patientDoc.data();
    
    // Verificar que el paciente pertenezca al doctor autenticado
    if (patientData.doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: patientDoc.id,
        ...patientData
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get patient'
    });
  }
};

/**
 * Crea un nuevo paciente y opcionalmente su primera consulta
 * Maneja la distribución de fotos: primera foto para perfil, resto para consulta
 */
const createPatient = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      age, 
      photos,
      photo, // Para compatibilidad con versión anterior
      // Datos de la primera consulta (opcionales)
      disease,
      consultationDate,
      diagnosis
    } = req.body;
    
    // Validación de campos requeridos
    if (!firstName || !lastName || !age) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'First name, last name, and age are required'
      });
    }

    // Validación de edad
    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Age must be a number between 1 and 120'
      });
    }
    
    // Distribución de fotos: primera para perfil, resto para consulta
    const allPhotos = Array.isArray(photos) ? photos : [];
    let profilePhoto = null;
    let consultationPhotos = [];
    
    if (allPhotos.length > 0) {
      profilePhoto = allPhotos[0];
      
      // Si hay más fotos y se va a crear una consulta, asignar el resto a la consulta
      if (allPhotos.length > 1 && diagnosis && diagnosis.trim()) {
        consultationPhotos = allPhotos.slice(1);
      }
    }
    
    // Preparar datos del paciente (solo información básica y foto de perfil)
    const patientData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: ageNumber,
      photos: profilePhoto ? [profilePhoto] : [],
      photo: profilePhoto ? profilePhoto.url : (photo || null),
      doctorId: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Agregar enfermedad si se proporciona
    if (disease && disease.trim()) {
      patientData.disease = disease.trim();
    }
    
    // Crear el paciente en Firestore
    const patientRef = await db.collection('patients').add(patientData);
    const patientId = patientRef.id;
    
    // Crear primera consulta si hay diagnóstico
    let consultationData = null;
    if (diagnosis && diagnosis.trim()) {
      // Usar fecha proporcionada o fecha actual
      let finalDate = consultationDate;
      if (!consultationDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        finalDate = `${year}-${month}-${day}`;
      }
      
      consultationData = {
        patientId: patientId,
        date: finalDate,
        disease: disease?.trim() || '',
        diagnosis: diagnosis.trim(),
        photos: consultationPhotos,
        doctorId: req.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const consultationRef = await db.collection('consultations').add(consultationData);
      consultationData.id = consultationRef.id;
    }
    
    // Preparar respuesta
    const responseData = {
      id: patientRef.id,
      ...patientData,
      firstConsultation: consultationData
    };
    
    res.status(201).json({
      success: true,
      data: responseData,
      message: consultationData 
        ? 'Patient and first consultation created successfully'
        : 'Patient created successfully'
    });
    
  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create patient: ' + error.message
    });
  }
};

/**
 * Actualiza información básica de un paciente
 * Solo permite actualizar datos personales, no información médica
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, age, photo, photos } = req.body;
    
    const patientRef = db.collection('patients').doc(id);
    const patientDoc = await patientRef.get();
    
    // Verificar si el paciente existe
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    const patientData = patientDoc.data();
    
    // Verificar que el paciente pertenezca al doctor autenticado
    if (patientData.doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    // Preparar datos de actualización
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    // Actualizar solo los campos proporcionados
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (age) updateData.age = parseInt(age);
    if (photo !== undefined) updateData.photo = photo;
    if (photos !== undefined) updateData.photos = Array.isArray(photos) ? photos : [];
    
    await patientRef.update(updateData);
    
    // Obtener datos actualizados
    const updatedDoc = await patientRef.get();
    
    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
    
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update patient'
    });
  }
};

/**
 * Elimina un paciente y todas sus consultas asociadas
 * Usa transacción para mantener consistencia de datos
 */
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const patientRef = db.collection('patients').doc(id);
    const patientDoc = await patientRef.get();
    
    // Verificar si el paciente existe
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    const patientData = patientDoc.data();
    
    // Verificar que el paciente pertenezca al doctor autenticado
    if (patientData.doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    // Obtener todas las consultas del paciente
    const consultationsRef = db.collection('consultations');
    const consultationsSnapshot = await consultationsRef
      .where('patientId', '==', id)
      .get();
    
    // Usar batch para eliminar todo de manera atómica
    const batch = db.batch();
    
    // Agregar consultas al batch para eliminación
    consultationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Agregar paciente al batch para eliminación
    batch.delete(patientRef);
    
    // Ejecutar todas las eliminaciones
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
    
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete patient'
    });
  }
};

/**
 * Busca pacientes por nombre (firstName o lastName)
 * Si no hay término de búsqueda, retorna todos los pacientes
 */
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    
    // Si no hay término de búsqueda, retornar todos los pacientes
    if (!q) {
      return getAllPatients(req, res);
    }
    
    const searchTerm = q.toLowerCase().trim();
    const patientsRef = db.collection('patients');
    const snapshot = await patientsRef
      .where('doctorId', '==', req.user.uid)
      .get();
    
    // Filtrar pacientes que coincidan con el término de búsqueda
    const patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
      
      // Buscar en nombre completo, nombre o apellido
      if (fullName.includes(searchTerm) || 
          data.firstName.toLowerCase().includes(searchTerm) ||
          data.lastName.toLowerCase().includes(searchTerm)) {
        patients.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    res.json({
      success: true,
      data: patients
    });
    
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search patients'
    });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients
};