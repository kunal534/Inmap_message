import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
