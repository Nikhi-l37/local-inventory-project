import axios from 'axios';

// 1. Create a new axios instance
const api = axios.create({
  // FIXED: Using environment variable with localhost fallback for better reliability
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
});

// 2. Add an "interceptor" to automatically add the token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;