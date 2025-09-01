import axios from 'axios';
import { auth } from './firebase';

// Configuración dinámica de la URL base para React
const getApiBaseUrl = () => {
  // Prioridad: Variable de entorno > URL de producción > Desarrollo local
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    // URL de tu backend en Vercel
    return 'https://foto-derma-app-backend.vercel.app/api';
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL); // Para debug
console.log('Environment:', process.env.NODE_ENV); // Para debug

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log de errores para debugging
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    // Manejo específico de errores de red
    if (!error.response) {
      console.error('Network Error - El backend puede no estar disponible');
    }

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