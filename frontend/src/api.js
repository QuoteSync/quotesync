// src/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Gracias al proxy de Vite, esto se redirige a http://localhost:8000/api
  headers: {
    'Content-Type': 'application/json'
  }
});

// Si ya existe un token almacenado en localStorage, configúralo
const accessToken = localStorage.getItem('accessToken');
if (accessToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

export default apiClient;
