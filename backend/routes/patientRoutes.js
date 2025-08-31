const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients
} = require('../controllers/patientController');

// All routes require authentication
router.use(verifyToken);

// GET /api/patients - Get all patients or search patients
router.get('/', getAllPatients);

// GET /api/patients/search - Search patients
router.get('/search', searchPatients);

// POST /api/patients - Create new patient
router.post('/', createPatient);

// GET /api/patients/:id - Get patient by ID
router.get('/:id', getPatientById);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', deletePatient);

module.exports = router;