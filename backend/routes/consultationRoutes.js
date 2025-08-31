const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getConsultationsByPatientId,
  getConsultationById,
  createConsultation,
  createFollowUpConsultation, // NUEVA FUNCIÓN IMPORTADA
  updateConsultation,
  uploadConsultationPhotos,
  deleteConsultation,
  uploadMiddleware
} = require('../controllers/consultationController');

// All routes require authentication
router.use(verifyToken);

// POST /api/consultations - Create new consultation
router.post('/', createConsultation);

// POST /api/consultations/followup - Create follow-up consultation - NUEVA RUTA
router.post('/followup', createFollowUpConsultation);

// IMPORTANT: Specific routes MUST come before generic routes
// GET /api/consultations/patient/:patientId - Get consultations by patient ID
router.get('/patient/:patientId', getConsultationsByPatientId);

// POST /api/consultations/:id/photos - Upload photos to consultation
router.post('/:id/photos', uploadMiddleware, uploadConsultationPhotos);

// GET /api/consultations/:id - Get consultation by ID
router.get('/:id', getConsultationById);

// PUT /api/consultations/:id - Update consultation
router.put('/:id', updateConsultation);

// DELETE /api/consultations/:id - Delete consultation
router.delete('/:id', deleteConsultation);

module.exports = router;