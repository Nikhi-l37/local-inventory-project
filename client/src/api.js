import axios from 'axios';

// 1. Create a new axios instance
const api = axios.create({
  baseURL: 'http://localhost:3001', // Our backend URL
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