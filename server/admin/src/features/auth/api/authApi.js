import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const authApi = {
  /**
   * Authenticate an administrator using username and password.
   * POST /api/v1/admin/auth/login (OAuth2 form-encoded).
   * Returns the bare Token { access_token, token_type }.
   */
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return unwrap(response);
  },

  /**
   * Fetch the currently authenticated administrator's profile.
   * GET /api/v1/admin/auth/me
   */
  getProfile: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await axiosClient.get(API_ENDPOINTS.AUTH.ME, { headers });
    return unwrap(response);
  },
};

export default authApi;
