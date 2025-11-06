import axios from 'axios';

// 1. Create a new axios instance
const api = axios.create({
  // FIXED: Using the laptop's specific network IP address to ensure mobile access.
  // REPLACE <YOUR_LAPTOP_IP> with the actual IP address (e.g., 192.168.1.100)
  baseURL: 'http://10.123.116.248:3001', 
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