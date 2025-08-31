import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Patients API
export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (patientData) => api.post('/patients', patientData),
  update: (id, patientData) => api.put(`/patients/${id}`, patientData),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get(`/patients/search?q=${query}`),
};

// Consultations API
export const consultationsAPI = {
  getAll: () => api.get('/consultations'),
  getById: (id) => api.get(`/consultations/${id}`),
  getByPatientId: (patientId) => api.get(`/consultations/patient/${patientId}`),
  create: (consultationData) => api.post('/consultations', consultationData),
  
  // FUNCIÓN ACTUALIZADA: createFollowUp ahora usa el endpoint correcto
  createFollowUp: (followUpData) => api.post('/consultations/followup', followUpData),
  
  update: (id, consultationData) => api.put(`/consultations/${id}`, consultationData),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadPhoto: (consultationId, formData) => 
    api.post(`/consultations/${consultationId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getConsultationsWithFollowUps: (patientId) => api.get(`/consultations/patient/${patientId}/with-followups`),
};

// Auth API
export const authAPI = {
  verifyToken: (token) => api.post('/auth/verify', { token }),
};

export default api;