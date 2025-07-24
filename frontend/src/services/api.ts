import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
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