
import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Response interceptor for centralized error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const data = error.response.data as any;

      // Extract error message from response
      let message =
        data?.message ??
        data?.error?.message ??
        error.message;

      // Add status code context for better debugging
      const errorWithContext = new Error(message || `HTTP ${statusCode} Error`);
      errorWithContext.name = `HTTP_${statusCode}`;

      console.error(`[API Error ${statusCode}]`, {
        url: error.config?.url,
        message,
        data
      });

      return Promise.reject(errorWithContext);
    } else if (error.request) {
      // Request made but no response received
      const networkError = new Error('Ağ bağlantı hatası - sunucuya ulaşılamıyor');
      networkError.name = 'NETWORK_ERROR';

      console.error('[Network Error]', {
        url: error.config?.url,
        message: networkError.message
      });

      return Promise.reject(networkError);
    } else {
      // Error setting up the request
      const setupError = new Error(error.message || 'İstek hazırlanırken hata oluştu');
      setupError.name = 'REQUEST_SETUP_ERROR';

      console.error('[Request Setup Error]', error.message);

      return Promise.reject(setupError);
    }
  }
);

export default api;
