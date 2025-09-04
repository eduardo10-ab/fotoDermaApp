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
  if (typeof window !== 'undefined') {
    return localStorage.getItem('firebaseToken');
  }
  return null;
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
  // Métodos originales - mantenemos para compatibilidad
  getPatients: () => {
    console.log('Llamando a getPatients - URL: /api/patients');
    return api.get('/api/patients');
  },
  getPatient: (id) => api.get(`/api/patients/${id}`),
  createPatient: (data) => api.post('/api/patients', data),
  updatePatient: (id, data) => api.put(`/api/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/api/patients/${id}`),
  searchPatients: (query) => api.get(`/api/patients/search?q=${encodeURIComponent(query)}`),
  
  // Métodos con nombres estándar - para compatibilidad con componentes
  getAll: () => {
    console.log('Llamando a getAll (alias de getPatients)');
    return api.get('/api/patients');
  },
  get: (id) => {
    console.log('Llamando a get patient by id:', id);
    return api.get(`/api/patients/${id}`);
  },
  getById: (id) => {
    console.log('Llamando a getById patient:', id);
    return api.get(`/api/patients/${id}`);
  },
  create: (data) => {
    console.log('Llamando a create patient');
    return api.post('/api/patients', data);
  },
  update: (id, data) => {
    console.log('Llamando a update patient:', id);
    return api.put(`/api/patients/${id}`, data);
  },
  delete: (id) => {
    console.log('Llamando a delete patient:', id);
    return api.delete(`/api/patients/${id}`);
  },
  search: (query) => {
    console.log('Llamando a search patients:', query);
    return api.get(`/api/patients/search?q=${encodeURIComponent(query)}`);
  },
  
  // Método para obtener pacientes con paginación (si lo necesitas)
  getPaginated: (page = 1, limit = 10) => {
    return api.get(`/api/patients?page=${page}&limit=${limit}`);
  }
};

export const consultationsAPI = {
  // Métodos originales
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
  
  // Aliases estándar
  create: (data) => {
    console.log('Llamando a create consultation');
    return api.post('/api/consultations', data);
  },
  getAll: () => {
    console.log('Llamando a getAll consultations');
    return api.get('/api/consultations');
  },
  get: (id) => {
    console.log('Llamando a get consultation:', id);
    return api.get(`/api/consultations/${id}`);
  },
  getById: (id) => {
    console.log('Llamando a getById consultation:', id);
    return api.get(`/api/consultations/${id}`);
  },
  getByPatientId: (patientId) => {
    console.log('Llamando a getByPatientId:', patientId);
    return api.get(`/api/consultations/patient/${patientId}`);
  },
  update: (id, data) => {
    console.log('Llamando a update consultation:', id);
    return api.put(`/api/consultations/${id}`, data);
  },
  delete: (id) => {
    console.log('Llamando a delete consultation:', id);
    return api.delete(`/api/consultations/${id}`);
  },
  createFollowUp: (data) => {
    console.log('Llamando a createFollowUp consultation');
    return api.post('/api/consultations/followup', data);
  },
  uploadPhotos: (id, formData) => {
    console.log('Llamando a uploadPhotos for consultation:', id);
    return api.post(`/api/consultations/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

export const authAPI = {
  verifyToken: () => api.post('/api/auth/verify'),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateUserProfile: (data) => api.put('/api/auth/profile', data),
  
  // Aliases estándar
  verify: () => {
    console.log('Llamando a verify token');
    return api.post('/api/auth/verify');
  },
  me: () => {
    console.log('Llamando a get current user');
    return api.get('/api/auth/me');
  },
  updateProfile: (data) => {
    console.log('Llamando a update profile');
    return api.put('/api/auth/profile', data);
  }
};

// Export por defecto
export default api;

// Logging para debug
console.log('API exportado con métodos:', {
  patients: Object.keys(patientsAPI),
  consultations: Object.keys(consultationsAPI),
  auth: Object.keys(authAPI)
});