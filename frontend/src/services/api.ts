import axios from 'axios';

// Get API URL with fallbacks
const getApiUrl = () => {
  // Check if we're in production
  if (window.location.hostname === 'seguranca-trabalho.vercel.app') {
    return 'https://seguranca-trabalho.onrender.com/api';
  }
  
  // Use environment variable or localhost
  return (import.meta.env.VITE_API_URL || 'http://localhost:3333') + '/api';
};

const baseURL = getApiUrl();

// Debug log for production
console.log('API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  baseURL: baseURL,
  environment: import.meta.env.MODE
});

export const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SST:token');
  
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@SST:token');
      localStorage.removeItem('@SST:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);