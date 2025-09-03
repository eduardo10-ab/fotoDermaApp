import axios from 'axios';

// CONFIGURACIÓN CORREGIDA - Base URL ya incluye /api
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://foto-derma-app-backend.vercel.app/api';

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📊 Environment:', process.env.NODE_ENV);

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token actual
const getAuthToken = () => {
  const token = localStorage.getItem('firebaseToken');
  if (!token) {
    console.warn('⚠️ No se encontró token en localStorage');
  }
  return token;
};

// Interceptor para agregar el token de Firebase a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token agregado a request');
    } else {
      console.warn('⚠️ Request sin token de autorización');
    }
    
    // Log detallado de la request
    const fullURL = `${config.baseURL}${config.url}`;
    console.log(`📤 ${config.method?.toUpperCase()} ${fullURL}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    const fullURL = `${response.config.baseURL}${response.config.url}`;
    console.log(`📥 ${response.status} ${fullURL}`);
    return response;
  },
  async (error) => {
    const fullURL = error.config ? `${error.config.baseURL}${error.config.url}` : 'URL desconocida';
    
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: fullURL,
    });

    // Manejar errores 401 - Token inválido
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido o expirado');
      
      // Intentar refrescar el token si es posible
      try {
        const { auth } = await import('../services/firebase');
        if (auth.currentUser) {
          console.log('🔄 Intentando refrescar token...');
          const newToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('firebaseToken', newToken);
          console.log('✅ Token refrescado, reintentando request...');
          
          // Reintentar la petición original con el nuevo token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Error refrescando token:', refreshError);
      }
      
      // Si no se puede refrescar, limpiar y redirigir
      console.log('🚪 Redirigiendo al login...');
      localStorage.removeItem('firebaseToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Funciones específicas para diferentes endpoints
export const apiService = {
  // Test de conectividad - Usando ruta completa para health check
  testConnection: () => {
    const healthURL = API_BASE_URL.replace('/api', '/health');
    console.log('🔍 Testing connection to:', healthURL);
    return axios.get(healthURL, {
      timeout: 10000
    });
  },

  // Pacientes (requieren auth) - SIN /api adicional
  getPatients: () => {
    console.log('🏥 Obteniendo pacientes...');
    return api.get('/patients'); // ✅ Correcto: /api/patients
  },
  getPatient: (id) => {
    console.log('🏥 Obteniendo paciente:', id);
    return api.get(`/patients/${id}`); // ✅ Correcto
  },
  createPatient: (data) => {
    console.log('🏥 Creando paciente...');
    return api.post('/patients', data); // ✅ Correcto
  },
  updatePatient: (id, data) => {
    console.log('🏥 Actualizando paciente:', id);
    return api.put(`/patients/${id}`, data); // ✅ Correcto
  },
  deletePatient: (id) => {
    console.log('🏥 Eliminando paciente:', id);
    return api.delete(`/patients/${id}`); // ✅ Correcto
  },
  searchPatients: (query) => {
    console.log('🔍 Buscando pacientes:', query);
    return api.get(`/patients/search?q=${encodeURIComponent(query)}`); // ✅ Correcto
  },

  // Consultas (requieren auth) - SIN /api adicional
  getConsultationsByPatient: (patientId) => {
    console.log('📋 Obteniendo consultas del paciente:', patientId);
    return api.get(`/consultations/patient/${patientId}`); // ✅ Correcto
  },
  getConsultation: (id) => {
    console.log('📋 Obteniendo consulta:', id);
    return api.get(`/consultations/${id}`); // ✅ Correcto
  },
  createConsultation: (data) => {
    console.log('📋 Creando consulta...');
    return api.post('/consultations', data); // ✅ Correcto
  },
  createFollowUpConsultation: (data) => {
    console.log('📋 Creando consulta de seguimiento...');
    return api.post('/consultations/followup', data); // ✅ Correcto
  },
  updateConsultation: (id, data) => {
    console.log('📋 Actualizando consulta:', id);
    return api.put(`/consultations/${id}`, data); // ✅ Correcto
  },
  deleteConsultation: (id) => {
    console.log('📋 Eliminando consulta:', id);
    return api.delete(`/consultations/${id}`); // ✅ Correcto
  },
  uploadConsultationPhotos: (id, formData) => {
    console.log('📸 Subiendo fotos a consulta:', id);
    return api.post(`/consultations/${id}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }); // ✅ Correcto
  },

  // Auth endpoints - SIN /api adicional
  verifyToken: () => {
    console.log('🔍 Verificando token...');
    return api.post('/auth/verify'); // ✅ Correcto: /api/auth/verify
  },
  getCurrentUser: () => {
    console.log('👤 Obteniendo usuario actual...');
    return api.get('/auth/me'); // ✅ Correcto: /api/auth/me
  },
  updateUserProfile: (data) => {
    console.log('👤 Actualizando perfil...');
    return api.put('/auth/profile', data); // ✅ Correcto: /api/auth/profile
  },
};

// Función para probar la conectividad del backend
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Probando conexión con el backend...');
    const response = await apiService.testConnection();
    console.log('✅ Backend conectado correctamente:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error conectando con el backend:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Función para probar la autenticación
export const testAuthentication = async () => {
  try {
    console.log('🔍 Probando autenticación...');
    const token = getAuthToken();
    
    if (!token) {
      return { 
        success: false, 
        error: 'No hay token disponible' 
      };
    }

    const response = await apiService.verifyToken();
    console.log('✅ Token válido:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error de autenticación:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// ============================================
// EXPORTACIONES COMPATIBLES PARA EL FRONTEND
// ============================================

// API específica para consultas
export const consultationsAPI = {
  getConsultationsByPatient: apiService.getConsultationsByPatient,
  getConsultation: apiService.getConsultation,
  createConsultation: apiService.createConsultation,
  createFollowUpConsultation: apiService.createFollowUpConsultation,
  updateConsultation: apiService.updateConsultation,
  deleteConsultation: apiService.deleteConsultation,
  uploadConsultationPhotos: apiService.uploadConsultationPhotos,
};

// API específica para pacientes
export const patientsAPI = {
  getPatients: apiService.getPatients,
  getPatient: apiService.getPatient,
  createPatient: apiService.createPatient,
  updatePatient: apiService.updatePatient,
  deletePatient: apiService.deletePatient,
  searchPatients: apiService.searchPatients,
};

// API específica para autenticación
export const authAPI = {
  verifyToken: apiService.verifyToken,
  getCurrentUser: apiService.getCurrentUser,
  updateUserProfile: apiService.updateUserProfile,
};

export default api;