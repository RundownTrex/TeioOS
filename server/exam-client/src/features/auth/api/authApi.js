import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';

export const authApi = {
  /**
   * Authenticate student using Roll Number (username) and Password (DOB).
   * Endpoint: POST /api/v1/student/auth/login
   */
  login: async (rollNumber, password) => {
    const formData = new URLSearchParams();
    formData.append('username', rollNumber.trim());
    formData.append('password', password);

    return axiosClient.post(API_ENDPOINTS.LOGIN, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  /**
   * Fetch current student session profile from backend.
   * Endpoint: GET /api/v1/student/auth/me
   */
  getStudentSession: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return axiosClient.get(API_ENDPOINTS.ME, { headers });
  },
};
