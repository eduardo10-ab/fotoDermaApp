const { auth, db } = require('../config/firebase');

/**
 * Verifica el token de autenticación del usuario
 * 
 * Este endpoint recibe un token de Firebase Auth y:
 * 1. Valida que el token sea válido
 * 2. Extrae la información del usuario
 * 3. Crea o actualiza el perfil del usuario en Firestore
 * 4. Retorna los datos del usuario autenticado
 * 
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Validación del token en el body de la petición
    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required'
      });
    }

    // Verificación del token con Firebase Auth
    const decodedToken = await auth.verifyIdToken(token);
    
    // Referencia al documento del usuario en Firestore
    const userRef = db.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();
    
    /**
     * Preparación de los datos básicos del usuario
     * Se asegura de que no haya valores undefined que puedan causar problemas
     */
    let userData = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.displayName || '',
      picture: decodedToken.picture || '',
      lastLogin: new Date().toISOString()
    };
    
    if (!userDoc.exists) {
      /**
       * Usuario nuevo - Crear perfil en Firestore
       * Limpia cualquier campo undefined antes de guardarlo
       */
      Object.keys(userData).forEach(key => {
        if (userData[key] === undefined) userData[key] = '';
      });
      
      await userRef.set({
        ...userData,
        createdAt: new Date().toISOString(),
        role: 'doctor', // Rol por defecto
        preferences: {
          language: 'es',    // Idioma por defecto
          zoomLevel: 100     // Nivel de zoom por defecto
        }
      });
    } else {
      /**
       * Usuario existente - Actualizar última conexión
       * Combina los datos del token con los datos existentes en Firestore
       */
      await userRef.update({
        lastLogin: new Date().toISOString()
      });
      userData = { ...userData, ...userDoc.data() };
    }
    
    // Respuesta exitosa con los datos del usuario
    res.json({
      success: true,
      user: userData
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Respuesta de error para token inválido
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

/**
 * Obtiene el perfil actual del usuario autenticado
 * 
 * Este endpoint requiere que el usuario esté autenticado (middleware de auth)
 * y retorna toda la información del perfil almacenada en Firestore
 * 
 * @param {Object} req - Objeto de petición HTTP (contiene req.user del middleware)
 * @param {Object} res - Objeto de respuesta HTTP
 */
const getCurrentUser = async (req, res) => {
  try {
    // Busca el documento del usuario en Firestore
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    // Validación de que el usuario existe en la base de datos
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile does not exist'
      });
    }
    
    // Respuesta exitosa con los datos del usuario
    res.json({
      success: true,
      user: userDoc.data()
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 * 
 * Permite actualizar campos específicos del perfil del usuario
 * como el nombre y las preferencias. Solo actualiza los campos
 * que se envían en el body de la petición.
 * 
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const userRef = db.collection('users').doc(req.user.uid);
    
    /**
     * Construcción dinámica del objeto de actualización
     * Solo incluye los campos que se enviaron en la petición
     */
    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = preferences;
    
    // Siempre actualiza la fecha de modificación
    updateData.updatedAt = new Date().toISOString();
    
    // Actualiza el documento en Firestore
    await userRef.update(updateData);
    
    // Obtiene el documento actualizado para retornarlo
    const updatedDoc = await userRef.get();
    
    // Respuesta exitosa con los datos actualizados
    res.json({
      success: true,
      user: updatedDoc.data()
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user profile'
    });
  }
};

/**
 * Exportación de los controladores para uso en las rutas
 */
module.exports = {
  verifyToken,        // POST /api/auth/verify-token
  getCurrentUser,     // GET /api/auth/user
  updateUserProfile   // PUT /api/auth/user
};