const { db, bucket } = require('../config/firebase');
const multer = require('multer');
const path = require('path');

/**
 * Formatea las fechas recibidas del frontend para almacenamiento consistente
 * Maneja diferentes formatos de fecha y evita problemas de zona horaria
 * 
 * @param {string} dateString - Fecha en formato string desde el frontend
 * @returns {string} - Fecha formateada en ISO string
 */
const formatDateFromFrontend = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Si ya viene en formato completo ISO, devolverlo tal como está
    if (dateString.includes('T') && dateString.includes('Z')) {
      return dateString;
    }
    
    // Si viene solo la fecha (YYYY-MM-DD), crear fecha local sin conversión de zona horaria
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Crear la fecha manteniendo exactamente el día especificado
      const [year, month, day] = dateString.split('-');
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      
      // Formatear como ISO pero ajustando a zona horaria local de El Salvador (UTC-6)
      const offsetMinutes = localDate.getTimezoneOffset();
      const adjustedDate = new Date(localDate.getTime() - (offsetMinutes * 60000));
      
      return adjustedDate.toISOString();
    }
    
    // Para otros formatos, intentar parsear y devolver como está
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    return dateString;
    
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return dateString;
  }
};

/**
 * Configuración de Multer para subida de archivos de fotos
 * Limita el tamaño y tipos de archivo permitidos
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Obtiene todas las consultas para un paciente específico
 * Verifica que el paciente pertenezca al doctor autenticado
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConsultationsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    // Verificar permisos de acceso
    if (patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    // Obtener todas las consultas del paciente
    const consultationsRef = db.collection('consultations');
    const snapshot = await consultationsRef
      .where('patientId', '==', patientId)
      .get();
    
    const consultations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      consultations.push({
        id: doc.id,
        ...data,
        // Asegurar que photos siempre sea un array
        photos: data.photos || []
      });
    });
    
    // Ordenar por fecha de consulta (más reciente primero)
    consultations.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      data: consultations
    });
    
  } catch (error) {
    console.error('Error obteniendo consultas:', error);
    
    // Información más detallada del error en desarrollo
    let errorMessage = 'Failed to get consultations';
    if (error.code) {
      errorMessage += ` (Firebase code: ${error.code})`;
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtiene una consulta específica por su ID
 * Verifica permisos de acceso del doctor
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const consultationRef = db.collection('consultations').doc(id);
    const consultationDoc = await consultationRef.get();
    
    if (!consultationDoc.exists) {
      return res.status(404).json({
        error: 'Consultation not found',
        message: 'Consultation does not exist'
      });
    }
    
    const consultationData = consultationDoc.data();
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(consultationData.patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists || patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this consultation'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: consultationDoc.id,
        ...consultationData,
        // Asegurar que photos siempre sea un array
        photos: consultationData.photos || []
      }
    });
    
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get consultation'
    });
  }
};

/**
 * Crea una nueva consulta para un paciente
 * Función simplificada sin lógica de seguimiento
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createConsultation = async (req, res) => {
  try {
    const { patientId, date, disease, diagnosis } = req.body;
    
    // Validación de campos requeridos
    if (!patientId || !date || !diagnosis) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Patient ID, date, and diagnosis are required'
      });
    }
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    if (patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    // Formatear la fecha recibida del frontend
    const formattedDate = formatDateFromFrontend(date);
    
    // Preparar datos de la consulta
    const consultationData = {
      patientId,
      date: date,
      disease: disease?.trim() || '',
      diagnosis: diagnosis.trim(),
      photos: [], // Inicializar como array vacío
      doctorId: req.user.uid,
      isFollowUp: false,
      originalConsultationId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Crear la consulta en Firestore
    const consultationRef = await db.collection('consultations').add(consultationData);
    
    // Actualizar el paciente con la enfermedad de esta consulta (si se proporciona)
    if (disease && disease.trim()) {
      await patientRef.update({
        disease: disease.trim(),
        updatedAt: new Date().toISOString()
      });
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: consultationRef.id,
        ...consultationData
      }
    });
    
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create consultation'
    });
  }
};

/**
 * Crea una consulta de seguimiento para una consulta existente
 * Actualiza la consulta original con el nuevo seguimiento
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createFollowUpConsultation = async (req, res) => {
  try {
    const { patientId, date, diagnosis, originalConsultationId, photos } = req.body;
    
    // Validación de campos requeridos
    if (!patientId || !date || !diagnosis || !originalConsultationId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Patient ID, date, diagnosis, and original consultation ID are required'
      });
    }
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient does not exist'
      });
    }
    
    if (patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this patient'
      });
    }
    
    // Obtener la consulta original para actualizarla
    const originalConsultationRef = db.collection('consultations').doc(originalConsultationId);
    const originalConsultationDoc = await originalConsultationRef.get();
    
    if (!originalConsultationDoc.exists) {
      return res.status(404).json({
        error: 'Original consultation not found',
        message: 'Original consultation does not exist'
      });
    }
    
    const originalConsultationData = originalConsultationDoc.data();
    
    // Obtener seguimientos existentes
    const existingFollowUps = originalConsultationData.followUps || [];
    
    // Verificar si ya existe un seguimiento para esta fecha
    const existingFollowUp = existingFollowUps.find(followUp => followUp.date === date);
    if (existingFollowUp) {
      return res.status(400).json({
        error: 'Duplicate follow-up',
        message: 'Ya existe un seguimiento para esta fecha'
      });
    }
    
    // Formatear la fecha para mostrar
    let formattedDate;
    try {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Si viene en formato YYYY-MM-DD, parsear directamente
        const [year, month, day] = date.split('-');
        formattedDate = `${day}/${month}/${year}`;
      } else {
        // Para otros formatos, usar la función de formateo existente
        const parsedDate = new Date(date + 'T12:00:00.000Z');
        formattedDate = parsedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC'
        });
      }
    } catch (error) {
      console.error('Error formateando fecha para mostrar:', error);
      formattedDate = date; // Fallback al valor original
    }
    
    // Crear nuevo seguimiento
    const formattedFollowUpDate = formatDateFromFrontend(date);
    const newFollowUp = {
      date: formattedFollowUpDate,
      formattedDate: formattedDate,
      diagnosis: diagnosis.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Agregar el nuevo seguimiento al array
    const updatedFollowUps = [...existingFollowUps, newFollowUp];
    
    // Actualizar el diagnóstico original agregando la información del seguimiento
    const updatedDiagnosis = `${originalConsultationData.diagnosis}\n\n--- SEGUIMIENTO ${formattedDate} ---\n\n${diagnosis.trim()}`;
    
    // Preparar datos para actualizar la consulta original
    const updateData = {
      diagnosis: updatedDiagnosis,
      // Mantener el nombre original de la enfermedad
      disease: originalConsultationData.disease,
      // Almacenar seguimientos por separado
      followUps: updatedFollowUps,
      hasFollowUp: true,
      lastFollowUpDate: formattedFollowUpDate,
      updatedAt: new Date().toISOString()
    };
    
    // Si hay fotos del seguimiento, agregarlas
    if (photos && photos.length > 0) {
      const currentPhotos = originalConsultationData.photos || [];
      updateData.photos = [...currentPhotos, ...photos];
    }
    
    // Actualizar la consulta original (NO crear una nueva)
    await originalConsultationRef.update(updateData);
    
    // Obtener la consulta actualizada
    const updatedConsultationDoc = await originalConsultationRef.get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedConsultationDoc.id,
        ...updatedConsultationDoc.data()
      }
    });
    
  } catch (error) {
    console.error('Create follow-up consultation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create follow-up consultation'
    });
  }
};

/**
 * Actualiza una consulta existente
 * Permite modificar fecha, enfermedad y diagnóstico
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, disease, diagnosis } = req.body;
    
    const consultationRef = db.collection('consultations').doc(id);
    const consultationDoc = await consultationRef.get();
    
    if (!consultationDoc.exists) {
      return res.status(404).json({
        error: 'Consultation not found',
        message: 'Consultation does not exist'
      });
    }
    
    const consultationData = consultationDoc.data();
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(consultationData.patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists || patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this consultation'
      });
    }
    
    // Preparar datos de actualización
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (date) updateData.date = date;
    if (disease !== undefined) updateData.disease = disease.trim();
    if (diagnosis) updateData.diagnosis = diagnosis.trim();
    
    await consultationRef.update(updateData);
    
    const updatedDoc = await consultationRef.get();
    
    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        photos: updatedDoc.data().photos || []
      }
    });
    
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update consultation'
    });
  }
};

/**
 * Sube fotos a una consulta específica
 * Almacena archivos en Firebase Storage y actualiza la consulta
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const uploadConsultationPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files uploaded'
      });
    }
    
    const consultationRef = db.collection('consultations').doc(id);
    const consultationDoc = await consultationRef.get();
    
    if (!consultationDoc.exists) {
      return res.status(404).json({
        error: 'Consultation not found',
        message: 'Consultation does not exist'
      });
    }
    
    const consultationData = consultationDoc.data();
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(consultationData.patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists || patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this consultation'
      });
    }
    
    const uploadedPhotos = [];
    
    // Subir cada archivo a Firebase Storage
    for (const file of files) {
      const fileName = `consultations/${id}/${Date.now()}_${file.originalname}`;
      const fileUpload = bucket.file(fileName);
      
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });
      
      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(file.buffer);
      });
      
      // Hacer el archivo públicamente accesible
      await fileUpload.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      uploadedPhotos.push({
        id: Date.now() + Math.random(),
        url: publicUrl,
        fileName: fileName,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    }
    
    // Actualizar consulta con nuevas fotos
    const currentPhotos = consultationData.photos || [];
    const updatedPhotos = [...currentPhotos, ...uploadedPhotos];
    
    await consultationRef.update({
      photos: updatedPhotos,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        uploaded: uploadedPhotos,
        totalPhotos: updatedPhotos.length
      }
    });
    
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload photos'
    });
  }
};

/**
 * Elimina una consulta y todas sus fotos asociadas
 * También elimina archivos de Firebase Storage
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const consultationRef = db.collection('consultations').doc(id);
    const consultationDoc = await consultationRef.get();
    
    if (!consultationDoc.exists) {
      return res.status(404).json({
        error: 'Consultation not found',
        message: 'Consultation does not exist'
      });
    }
    
    const consultationData = consultationDoc.data();
    
    // Verificar que el paciente pertenece al doctor actual
    const patientRef = db.collection('patients').doc(consultationData.patientId);
    const patientDoc = await patientRef.get();
    
    if (!patientDoc.exists || patientDoc.data().doctorId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this consultation'
      });
    }
    
    // Eliminar fotos del storage
    if (consultationData.photos && consultationData.photos.length > 0) {
      for (const photo of consultationData.photos) {
        try {
          await bucket.file(photo.fileName).delete();
        } catch (error) {
          console.error('Error deleting photo:', error);
          // Continuar con la eliminación aunque falle el borrado de fotos
        }
      }
    }
    
    await consultationRef.delete();
    
    res.json({
      success: true,
      message: 'Consultation deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete consultation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete consultation'
    });
  }
};

/**
 * Exportación de controladores y middleware para uso en rutas
 */
module.exports = {
  getConsultationsByPatientId,
  getConsultationById,
  createConsultation,
  createFollowUpConsultation,
  updateConsultation,
  uploadConsultationPhotos,
  deleteConsultation,
  uploadMiddleware: upload.array('photos', 10) // Middleware para subida de hasta 10 fotos
};