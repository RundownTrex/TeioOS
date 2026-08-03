import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem } from '../utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if available in sessionStorage
axiosClient.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const elevatedToken = getItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage);
      const baseToken = getItem(STORAGE_KEYS.BASE_TOKEN, sessionStorage);
      const token = elevatedToken || baseToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global HTTP errors (401 Unauthorized, 403 Forbidden)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Dispatch global session expired event for AuthContext & Router
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    } else if (status === 403) {
      // Dispatch global unauthorized event for AuthContext & Router
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const body = error.response?.data;
    const firstDetail =
      Array.isArray(body?.errors) && body.errors.length > 0
        ? body.errors[0]
        : typeof body?.detail === 'string'
          ? body.detail
          : null;

    const formattedError = {
      message: firstDetail || body?.message || error.message || 'An unexpected error occurred',
      status: status || 500,
      details: body?.errors || body?.detail || null,
      code:
        status === 409
          ? 'SESSION_SUBMITTED'
          : status === 410
            ? 'SESSION_EXPIRED'
            : status === 423
              ? 'SESSION_PAUSED'
              : undefined,
    };

    return Promise.reject(formattedError);
  }
);

export default axiosClient;
