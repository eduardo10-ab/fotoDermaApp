import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://foto-derma-app-backend.vercel.app/api';

console.log('🌐 API Base URL:', API_BASE_URL);

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
  return token;
};

// Interceptor para agregar el token de Firebase a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
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
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Manejar errores 401
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido o expirado');
      
      // Intentar refrescar el token si es posible
      try {
        const { auth } = await import('../services/firebase');
        if (auth.currentUser) {
          console.log('🔄 Intentando refrescar token...');
          const newToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('firebaseToken', newToken);
          
          // Reintentar la petición original con el nuevo token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Error refrescando token:', refreshError);
      }
      
      // Si no se puede refrescar, limpiar y redirigir
      localStorage.removeItem('firebaseToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Funciones específicas para diferentes endpoints
export const apiService = {
  // Test de conectividad (sin auth)
  testConnection: () => {
    return axios.get('https://foto-derma-app-backend.vercel.app/health', {
      timeout: 10000
    });
  },

  // Pacientes (requieren auth)
  getPatients: () => api.get('/patients'),
  getPatient: (id) => api.get(`/patients/${id}`),
  createPatient: (data) => api.post('/patients', data),
  updatePatient: (id, data) => api.put(`/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/patients/${id}`),
  searchPatients: (query) => api.get(`/patients/search?q=${encodeURIComponent(query)}`),

  // Consultas (requieren auth)
  getConsultationsByPatient: (patientId) => api.get(`/consultations/patient/${patientId}`),
  getConsultation: (id) => api.get(`/consultations/${id}`),
  createConsultation: (data) => api.post('/consultations', data),
  createFollowUpConsultation: (data) => api.post('/consultations/followup', data),
  updateConsultation: (id, data) => api.put(`/consultations/${id}`, data),
  deleteConsultation: (id) => api.delete(`/consultations/${id}`),
  uploadConsultationPhotos: (id, formData) => api.post(`/consultations/${id}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Auth endpoints
  verifyToken: () => api.post('/auth/verify'),
  getCurrentUser: () => api.get('/auth/me'),
  updateUserProfile: (data) => api.put('/auth/profile', data),
};

// Función para probar la conectividad del backend
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Probando conexión con el backend...');
    const response = await apiService.testConnection();
    console.log('✅ Backend conectado correctamente:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error conectando con el backend:', error);
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
    console.error('❌ Error de autenticación:', error);
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

export default api;