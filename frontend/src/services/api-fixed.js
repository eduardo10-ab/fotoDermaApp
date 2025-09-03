import axios from 'axios';

const API_BASE_URL = 'https://foto-derma-app-backend.vercel.app';

console.log('NUEVO API ARCHIVO CARGADO - URL BASE:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthToken = () => {
  return localStorage.getItem('firebaseToken');
};

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('REQUEST:', config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('RESPONSE:', response.status, `${response.config.baseURL}${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export const patientsAPI = {
  getPatients: () => {
    console.log('Llamando a getPatients - URL: /api/patients');
    return api.get('/api/patients');
  },
  getPatient: (id) => api.get(`/api/patients/${id}`),
  createPatient: (data) => api.post('/api/patients', data),
  updatePatient: (id, data) => api.put(`/api/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/api/patients/${id}`),
  searchPatients: (query) => api.get(`/api/patients/search?q=${encodeURIComponent(query)}`),
};

export const consultationsAPI = {
  getConsultationsByPatient: (patientId) => {
    console.log('Llamando a getConsultationsByPatient - URL:', `/api/consultations/patient/${patientId}`);
    return api.get(`/api/consultations/patient/${patientId}`);
  },
  getConsultation: (id) => api.get(`/api/consultations/${id}`),
  createConsultation: (data) => api.post('/api/consultations', data),
  createFollowUpConsultation: (data) => api.post('/api/consultations/followup', data),
  updateConsultation: (id, data) => api.put(`/api/consultations/${id}`, data),
  deleteConsultation: (id) => api.delete(`/api/consultations/${id}`),
  uploadConsultationPhotos: (id, formData) => api.post(`/api/consultations/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const authAPI = {
  verifyToken: () => api.post('/api/auth/verify'),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateUserProfile: (data) => api.put('/api/auth/profile', data),
};

export default api;