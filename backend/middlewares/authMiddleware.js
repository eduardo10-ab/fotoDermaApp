const { auth } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked',
        message: 'Please login again'
      });
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      };
    }
    
    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth
};