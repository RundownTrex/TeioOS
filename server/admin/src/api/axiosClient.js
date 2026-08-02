import axios from 'axios';
import { STORAGE_KEYS, AUTH_EVENTS } from '../utils/constants';
import { getItem } from '../utils/storage';
import { API_ENDPOINTS } from './endpoints';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Parallel requests (e.g. a list-query storm) failing with 401 must collapse
// into a single session-expiry transition, not one redirect per request.
const SESSION_EXPIRED_DEDUPE_MS = 1500;
let lastSessionExpiredAt = 0;

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach admin JWT token if available in localStorage
axiosClient.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const token = getItem(STORAGE_KEYS.ADMIN_TOKEN, localStorage);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor:
//  - Returns the response body (the APIResponse envelope, or the bare Token
//    on login) on success.
//  - Normalizes failures into { message, status, details, code }.
//  - Dispatches global auth events for 401/403, except for login failures,
//    which must surface as field errors instead of session expiry.
//  - A successful login resets the 401 dedupe window so a fresh session can
//    report its own expiry.
axiosClient.interceptors.response.use(
  (response) => {
    if (response.config?.url === API_ENDPOINTS.AUTH.LOGIN && response.status < 400) {
      lastSessionExpiredAt = 0;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const isLoginRequest = error.config?.url === API_ENDPOINTS.AUTH.LOGIN;

    if (status === 401 && !isLoginRequest) {
      const now = Date.now();
      if (now - lastSessionExpiredAt > SESSION_EXPIRED_DEDUPE_MS) {
        lastSessionExpiredAt = now;
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.SESSION_EXPIRED));
      }
    } else if (status === 403) {
      window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED));
    }

    const details =
      Array.isArray(body?.errors) && body.errors.length > 0
        ? body.errors
        : body?.message
          ? [body.message]
          : null;

    const formattedError = {
      message: body?.message || error.message || 'An unexpected error occurred',
      status: status || 0,
      details,
      code: undefined,
    };

    return Promise.reject(formattedError);
  }
);

export default axiosClient;
