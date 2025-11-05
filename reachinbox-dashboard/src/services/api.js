import axios from 'axios';

// Get API URL - force HTTP for localhost
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Always use HTTP for localhost (even if frontend is HTTPS)
if (API_URL.includes('localhost') || API_URL.includes('127.0.0.1')) {
  API_URL = API_URL.replace('https://', 'http://');
}

console.log('🔗 API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email, password, tenantId) =>
    api.post('/api/auth/register', { email, password, tenantId }),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password })
};

export const emailApi = {
  getAll: (page = 1, limit = 20, category = null) =>
    api.get('/api/emails', { params: { page, limit, category } }),
  getStats: () => api.get('/api/emails/categories/stats'),
  search: (query, filters = {}) =>
    api.post('/api/emails/search', { query, filters })
};
