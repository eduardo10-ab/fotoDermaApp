import axios from 'axios';
import { auth } from './firebase';

// Configurar base URL de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://foto-derma-app-backend.vercel.app';

console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📋 Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging (útil para debug)
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    return Promise.reject(error);
  }
);

// Test de conectividad
export const testConnection = async () => {
  try {
    const response = await api.get('/');
    console.log('Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    return false;
  }
};

// Patients API
export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (patientData) => api.post('/patients', patientData),
  update: (id, patientData) => api.put(`/patients/${id}`, patientData),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get(`/patients/search?q=${encodeURIComponent(query)}`),
};

// Consultations API
export const consultationsAPI = {
  getAll: () => api.get('/consultations'),
  getById: (id) => api.get(`/consultations/${id}`),
  getByPatientId: (patientId) => api.get(`/consultations/patient/${patientId}`),
  create: (consultationData) => api.post('/consultations', consultationData),  
  // Función actualizada: createFollowUp ahora usa el endpoint correcto
  createFollowUp: (followUpData) => api.post('/consultations/followup', followUpData),
  update: (id, consultationData) => api.put(`/consultations/${id}`, consultationData),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadPhoto: (consultationId, formData) => 
    api.post(`/consultations/${consultationId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 segundos para uploads
    }),
    
  getConsultationsWithFollowUps: (patientId) => 
    api.get(`/consultations/patient/${patientId}/with-followups`),
};

// Auth API
export const authAPI = {
  verifyToken: (token) => api.post('/auth/verify', { token }),
};

// Health check del backend
export const healthAPI = {
  check: () => api.get('/health')
};

export default api;