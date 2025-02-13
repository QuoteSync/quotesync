// src/api.js
import axios from 'axios';
import * as jwtDecode from 'jwt-decode';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Redirects to http://localhost:8000/api
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper: Check if a token is expired
function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // current time in seconds
    return decoded.exp < currentTime;
  } catch (e) {
    return true;
  }
}

// Add a request interceptor to refresh the token if needed
apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // If an access token exists and is expired, attempt to refresh it.
    if (accessToken && isTokenExpired(accessToken)) {
      if (refreshToken) {
        try {
          const response = await axios.post(
            'http://localhost:8000/api/token/refresh/',
            { refresh: refreshToken }
          );
          accessToken = response.data.access;
          localStorage.setItem('accessToken', accessToken);
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Optionally, remove tokens or force logout here.
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          accessToken = null;
        }
      } else {
        accessToken = null;
      }
    }

    // If we have a valid access token, set the Authorization header.
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Initially, if a token is already stored, set it
const storedAccessToken = localStorage.getItem('accessToken');
if (storedAccessToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
}

export default apiClient;
