import axios from 'axios';

// Configurar base URL de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://foto-derma-app-backend.vercel.app';

console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📋 Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentado a 30 segundos para Vercel
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación automáticamente
api.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage (o donde lo guardes)
    const token = localStorage.getItem('firebaseToken') || localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (token) {
      console.log('🔑 Token included in request');
    } else {
      console.log('⚠️ No token found for request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);
    
    // Si es 401, limpiar token y redirigir a login
    if (error.response?.status === 401) {
      console.log('🚫 Unauthorized - clearing token');
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('authToken');
      // Opcional: redirigir a login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Test de conectividad
export const testConnection = async () => {
  try {
    const response = await api.get('/api/health'); // Agregado /api/
    console.log('Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    return false;
  }
};

// Patients API - TODAS las rutas con prefijo /api/
export const patientsAPI = {
  getAll: () => api.get('/api/patients'),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (patientData) => api.post('/api/patients', patientData),
  update: (id, patientData) => api.put(`/api/patients/${id}`, patientData),
  delete: (id) => api.delete(`/api/patients/${id}`),
  search: (query) => api.get(`/api/patients/search?q=${encodeURIComponent(query)}`),
};

// Consultations API - TODAS las rutas con prefijo /api/
export const consultationsAPI = {
  getAll: () => api.get('/api/consultations'),
  getById: (id) => api.get(`/api/consultations/${id}`),
  getByPatientId: (patientId) => api.get(`/api/consultations/patient/${patientId}`),
  create: (consultationData) => api.post('/api/consultations', consultationData),  
  createFollowUp: (followUpData) => api.post('/api/consultations/followup', followUpData),
  update: (id, consultationData) => api.put(`/api/consultations/${id}`, consultationData),
  delete: (id) => api.delete(`/api/consultations/${id}`),
  uploadPhoto: (consultationId, formData) => 
    api.post(`/api/consultations/${consultationId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 segundos para uploads
    }),
    
  getConsultationsWithFollowUps: (patientId) => 
    api.get(`/api/consultations/patient/${patientId}/with-followups`),
};

// Auth API - TODAS las rutas con prefijo /api/
export const authAPI = {
  verifyToken: (token) => api.post('/api/auth/verify', { token }),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
};

// Health check del backend
export const healthAPI = {
  check: () => api.get('/api/health')
};

export default api;