import axios from 'axios';
import { handleOfflineRequest } from './offlineFallback';

export const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pocketsmart_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle normal 401 Unauthorized
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        localStorage.removeItem('pocketsmart_token');
        localStorage.removeItem('pocketsmart_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Check if error is due to unreachable backend (Network Error, 502, 503, 504, timeout, or CORS redirect)
    const isNetworkError =
      !error.response ||
      error.message === 'Network Error' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      [502, 503, 504].includes(error.response?.status);

    if (isNetworkError && originalRequest && !originalRequest._isRetry) {
      try {
        let requestData = originalRequest.data;
        if (typeof requestData === 'string') {
          try {
            requestData = JSON.parse(requestData);
          } catch {
            // keep string
          }
        }

        const fallbackResponse = await handleOfflineRequest(
          originalRequest.url || '',
          originalRequest.method || 'GET',
          requestData,
          originalRequest.params
        );

        if (fallbackResponse) {
          return fallbackResponse;
        }
      } catch (fallbackErr) {
        console.warn('Offline fallback handler error:', fallbackErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
