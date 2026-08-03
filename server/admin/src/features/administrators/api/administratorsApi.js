import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const administratorsApi = {
  /**
   * Retrieve users/administrators with server-side pagination, search, and role filter.
   * GET /api/v1/admin/users/?page=&page_size=&search=&role=
   */
  list: async ({ page, pageSize, q, role, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.USERS.LIST, {
      params: {
        page,
        page_size: pageSize,
        search: q || undefined,
        role: role || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single user/administrator by ID.
   * GET /api/v1/admin/users/{user_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.USERS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new administrator/user.
   * POST /api/v1/admin/users/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.USERS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing administrator/user.
   * PUT /api/v1/admin/users/{user_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.USERS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Enable or disable an administrator account.
   * PUT /api/v1/admin/users/{user_id}
   */
  toggleStatus: async (id, is_active) => {
    const response = await axiosClient.put(API_ENDPOINTS.USERS.DETAIL(id), { is_active });
    return unwrap(response);
  },

  /**
   * Change an administrator's password.
   * PUT /api/v1/admin/users/{user_id}
   */
  changePassword: async (id, password) => {
    const response = await axiosClient.put(API_ENDPOINTS.USERS.DETAIL(id), { password });
    return unwrap(response);
  },

  /**
   * Delete an administrator by ID.
   * DELETE /api/v1/admin/users/{user_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.USERS.DETAIL(id));
    return unwrap(response);
  },
};

export default administratorsApi;
