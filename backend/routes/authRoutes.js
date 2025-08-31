const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  verifyToken: verifyTokenController,
  getCurrentUser,
  updateUserProfile
} = require('../controllers/authController');

// POST /api/auth/verify - Verify Firebase token
router.post('/verify', verifyTokenController);

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, getCurrentUser);

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, updateUserProfile);

module.exports = router;