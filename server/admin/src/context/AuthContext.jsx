import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS, AUTH_EVENTS } from '../utils/constants';
import { PATHS } from '../routes/paths';
import { getItem, setItem, removeItem } from '../utils/storage';
import { isTokenExpired } from '../utils/jwt';
import { authApi } from '../features/auth/api/authApi';
import { announceToScreenReader } from '../utils/ariaAnnounce';

const TOKEN_STORAGE = localStorage;

export const AuthContext = createContext(null);

/**
 * Single owner of the administrator session (see docs/frontend/admin-authentication.md).
 * - Token persisted in localStorage; profile cached in memory only.
 * - Bootstraps via /me on every reload; local exp pre-check avoids doomed calls.
 * - Clears the TanStack Query cache on logout/expiry (all queries are identity-bound).
 * - Keeps multiple tabs coherent via the `storage` event.
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [token, setToken] = useState(() => getItem(STORAGE_KEYS.ADMIN_TOKEN, TOKEN_STORAGE));
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // Guards against duplicate /me calls when a single token is validated
  // concurrently (StrictMode double effects, token effect after login).
  const validatingTokenRef = useRef(null);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setSessionError(null);
    removeItem(STORAGE_KEYS.ADMIN_TOKEN, TOKEN_STORAGE);
  }, []);

  /**
   * Validates a token against /admin/auth/me and restores the session.
   * Returns { ok: true, profile } or { ok: false, message }.
   */
  const validateSession = useCallback(
    async (authToken) => {
      if (!authToken) {
        setIsBooting(false);
        setIsAuthenticated(false);
        setUser(null);
        setSessionError(null);
        return { ok: false, message: null };
      }

      // Proactive check: an expired persisted token is discarded locally so we
      // never fire a doomed /me request on a stale session.
      if (isTokenExpired(authToken)) {
        clearSession();
        setIsBooting(false);
        return { ok: false, message: 'Your session has expired.' };
      }

      if (validatingTokenRef.current === authToken) {
        return { ok: false, message: null };
      }
      validatingTokenRef.current = authToken;

      try {
        setIsBooting(true);
        setSessionError(null);
        const profile = await authApi.getProfile(authToken);
        setToken(authToken);
        setUser(profile);
        setIsAuthenticated(true);
        setItem(STORAGE_KEYS.ADMIN_TOKEN, authToken, TOKEN_STORAGE);
        return { ok: true, profile };
      } catch (err) {
        console.warn('Admin session validation failed:', err);
        // 401/403 = invalid session (expired, tampered, deleted user) -> plain login.
        // Network/5xx = retryable bootstrap failure -> sessionError keeps the token
        // so a later refresh can recover the session without re-authenticating.
        const isInvalidSession = err?.status === 401 || err?.status === 403;
        if (isInvalidSession) {
          removeItem(STORAGE_KEYS.ADMIN_TOKEN, TOKEN_STORAGE);
        }
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        const message = err?.message || 'Could not validate the administrator session.';
        setSessionError(isInvalidSession ? null : { message });
        return { ok: false, message };
      } finally {
        if (validatingTokenRef.current === authToken) {
          validatingTokenRef.current = null;
        }
        setIsBooting(false);
      }
    },
    [clearSession]
  );

  useEffect(() => {
    validateSession(token);
  }, [token, validateSession]);

  // Global auth events dispatched by the axios response interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.clear();
      clearSession();
      announceToScreenReader('Your session has expired. Please sign in again.', 'assertive');
      navigate(`${PATHS.LOGIN}?expired=1`, { replace: true });
    };

    const handleUnauthorized = () => {
      navigate(PATHS.UNAUTHORIZED, { replace: true });
    };

    window.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
      window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    };
  }, [navigate, queryClient, clearSession]);

  // Multi-tab coherence: the `storage` event fires only in OTHER tabs when
  // localStorage changes under this key.
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEYS.ADMIN_TOKEN) return;

      if (event.newValue) {
        // Signed in elsewhere -> adopt and re-validate the new token.
        setToken(event.newValue);
      } else if (event.oldValue) {
        // Signed out or expired elsewhere -> end this tab's session too.
        queryClient.clear();
        clearSession();
        announceToScreenReader('You have been signed out on another tab.', 'polite');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient, clearSession]);

  // Perform administrator login
  const login = async (username, password) => {
    setAuthError(null);
    try {
      const tokenData = await authApi.login(username, password);
      const accessToken = tokenData?.access_token;

      if (!accessToken) {
        throw new Error('Authentication succeeded but the access token was missing.');
      }

      setItem(STORAGE_KEYS.ADMIN_TOKEN, accessToken, TOKEN_STORAGE);
      const result = await validateSession(accessToken);
      if (!result.ok) {
        throw new Error(result.message || 'Login failed. Please check your credentials.');
      }

      announceToScreenReader(`Login successful. Welcome administrator ${result.profile.name}.`, 'polite');
      return { success: true, profile: result.profile };
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      announceToScreenReader(`Login failed: ${message}`, 'assertive');
      throw err;
    }
  };

  // Perform administrator logout
  const logout = useCallback(() => {
    queryClient.clear();
    clearSession();
    announceToScreenReader('You have logged out of the administration dashboard.', 'polite');
  }, [queryClient, clearSession]);

  const retryBootstrap = useCallback(() => {
    validateSession(token);
  }, [token, validateSession]);

  const value = {
    token,
    user,
    isAuthenticated,
    isBooting,
    authError,
    sessionError,
    login,
    logout,
    validateSession,
    retryBootstrap,
    setAuthError,
    from: location.state?.from,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
