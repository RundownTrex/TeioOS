import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const departmentsApi = {
  /**
   * Retrieve departments with server-side pagination and optional name search.
   * GET /api/v1/admin/departments/?page=&page_size=&q=
   */
  list: async ({ page, pageSize, q, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.DEPARTMENTS.LIST, {
      params: { page, page_size: pageSize, q: q || undefined },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single department by ID.
   * GET /api/v1/admin/departments/{department_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.DEPARTMENTS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new department.
   * POST /api/v1/admin/departments/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.DEPARTMENTS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing department.
   * PUT /api/v1/admin/departments/{department_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.DEPARTMENTS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a department by ID.
   * DELETE /api/v1/admin/departments/{department_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.DEPARTMENTS.DETAIL(id));
    return unwrap(response);
  },
};

export default departmentsApi;
