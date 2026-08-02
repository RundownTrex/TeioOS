import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const classesApi = {
  /**
   * Retrieve classes with server-side pagination, optional name search and department filter.
   * GET /api/v1/admin/classes/?page=&page_size=&q=&department_id=
   */
  list: async ({ page, pageSize, q, departmentId, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.CLASSES.LIST, {
      params: {
        page,
        page_size: pageSize,
        q: q || undefined,
        department_id: departmentId || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single class by ID.
   * GET /api/v1/admin/classes/{class_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.CLASSES.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new class.
   * POST /api/v1/admin/classes/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.CLASSES.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing class.
   * PUT /api/v1/admin/classes/{class_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.CLASSES.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a class by ID.
   * DELETE /api/v1/admin/classes/{class_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CLASSES.DETAIL(id));
    return unwrap(response);
  },
};

export default classesApi;
