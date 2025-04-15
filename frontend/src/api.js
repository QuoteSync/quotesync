import axios from 'axios';
import router from './router';

// Backend base URL - centralized here for reuse
export const BACKEND_URL = 'http://localhost:8000';
export const API_BASE_URL = `${BACKEND_URL}/api`;

// Helper function to get the value of a cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Cookies are sent with every request
});

// Add CSRF token to every request
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Login function: simply call the login endpoint without checking getSession first.
const loginApi = async (username, password) => {
  try {
    await apiClient.post("/_allauth/browser/v1/auth/login", { username, password });
    // Let your Login component handle redirection after a successful login.
  } catch (error) {
    console.error("Login error:", error);
  }
};

// Logout function: redirect to login after a successful logout.
const logout = async () => {
  try {
    // Check if the session exists first
    const sessionExists = await getSession();
    if (!sessionExists) {
      // Already logged out, just redirect
      router.push({ name: "login" });
      return { success: true };
    }
    
    // Session exists, try to delete it
    const response = await apiClient.delete("/_allauth/browser/v1/auth/session");
    router.push({ name: "login" });
    return response.data;
  } catch (error) {
    // Any error (including 401) means we should redirect to login
    console.error("Logout error:", error);
    router.push({ name: "login" });
    return { success: true };
  }
};

// getSession: returns session data or null if not authenticated.
const getSession = async () => {
  try {
    const response = await apiClient.get("/_allauth/browser/v1/auth/session");
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return null;
    }
    console.error("Error fetching session:", error);
    return null;
  }
};

const signup = async (userData) => {
  try {
    const response = await apiClient.post("/_allauth/browser/v1/auth/signup", userData);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

const me = async () => {
  try {
    const response = await apiClient.get("/_allauth/browser/v1/auth/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching me:", error);
    return null;
  }
};

// Password reset request function
const passwordResetRequest = async (email) => {
  try {
    const response = await apiClient.post("/_allauth/browser/v1/auth/password/request", { email });
    return response.data;
  } catch (error) {
    console.error("Password reset request error:", error);
    throw error;
  }
};

// Password reset with key function
const passwordResetWithKey = async (key, password) => {
  try {
    const response = await apiClient.post("/_allauth/browser/v1/auth/password/reset", { 
      key, 
      password 
    });
    return response.data;
  } catch (error) {
    // For password reset, some implementations return 401 as part of the flow
    // This is still considered a "success" path for the password reset
    if (error.response && error.response.status === 401) {
      return { success: true, status: 401 };
    }
    console.error("Password reset error:", error);
    throw error;
  }
};

export { apiClient, loginApi, logout, getSession, signup, getCookie, me, passwordResetRequest, passwordResetWithKey };
