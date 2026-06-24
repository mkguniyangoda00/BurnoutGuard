import axios from 'axios';

/**
 * Axios client instance for all backend requests.
 * Uses http://localhost:5000/api as the base URL.
 * Automatically attaches the JWT token from localStorage to every request.
 */
export const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

client.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('bg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 Unauthorized, automatically log the user out
    if (error.response?.status === 401) {
      localStorage.removeItem('bg_token');
      // Dispatch custom event to tell the store to clear state
      window.dispatchEvent(new Event('bg_unauthorized'));
    }
    return Promise.reject(error);
  }
);
