import React, { createContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem, removeItem } from '../utils/storage';
import { authApi } from '../features/auth/api/authApi';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getItem(STORAGE_KEYS.BASE_TOKEN, sessionStorage));
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate session on mount if token exists
  const validateSession = useCallback(async (authToken) => {
    if (!authToken) {
      setIsLoadingSession(false);
      setIsAuthenticated(false);
      setUserProfile(null);
      return;
    }

    try {
      setIsLoadingSession(true);
      const response = await authApi.getStudentSession(authToken);
      if (response?.data) {
        setUserProfile(response.data);
        setIsAuthenticated(true);
        setItem(STORAGE_KEYS.BASE_TOKEN, authToken, sessionStorage);
      }
    } catch (err) {
      console.warn('Student session validation failed:', err);
      removeItem(STORAGE_KEYS.BASE_TOKEN, sessionStorage);
      setToken(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    validateSession(token);
  }, [token, validateSession]);

  // Handle global 401 Session Expired event from Axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      sessionStorage.clear();
      announceToScreenReader('Your examination session has expired. Please log in again.', 'assertive');
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Perform Student Login
  const login = async (rollNumber, password) => {
    setAuthError(null);
    try {
      const response = await authApi.login(rollNumber, password);
      const tokenData = response?.data;
      const accessToken = tokenData?.access_token;

      if (!accessToken) {
        throw new Error('Authentication succeeded but access token was missing.');
      }

      setToken(accessToken);
      setItem(STORAGE_KEYS.BASE_TOKEN, accessToken, sessionStorage);

      const sessionResponse = await authApi.getStudentSession(accessToken);
      const profile = sessionResponse?.data;

      setUserProfile(profile || { roll_number: rollNumber });
      setIsAuthenticated(true);

      announceToScreenReader(`Login successful. Welcome student ${rollNumber}.`, 'polite');
      return { success: true, profile };
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      announceToScreenReader(`Login failed: ${message}`, 'assertive');
      throw err;
    }
  };

  // Perform Student Logout
  const logout = useCallback(() => {
    setToken(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    sessionStorage.clear();
    announceToScreenReader('You have logged out of the examination portal.', 'polite');
  }, []);

  const value = {
    token,
    baseToken: token, // Alias for feature hooks
    userProfile,
    isAuthenticated,
    isLoadingSession,
    authError,
    login,
    logout,
    validateSession,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
