
import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const message =
        (error.response.data as { message?: string; error?: { message?: string } })?.message ??
        (error.response.data as { error?: { message?: string } })?.error?.message ??
        error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default api;
