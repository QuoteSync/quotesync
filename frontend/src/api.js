import axios from 'axios';
import router from './router';

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
  baseURL: 'http://localhost:8000/api',
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
    const response = await apiClient.delete("/_allauth/browser/v1/auth/session");
    router.push({ name: "login" });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      router.push({ name: "login" });
    } else {
      console.error("Logout error:", error);
    }
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
    const response = await apiClient.post("/_allauth/browser/v1/auth/signup", {
      "email": "emaiql@domain.org3",
      "username": "wizardq3",
      "password": "Alohomoraq!3"
    });
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export { apiClient, loginApi, logout, getSession, signup, getCookie};
