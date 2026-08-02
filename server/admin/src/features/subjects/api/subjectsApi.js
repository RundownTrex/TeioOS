import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const subjectsApi = {
  /**
   * Retrieve subjects with server-side pagination, optional name/code search and department filter.
   * GET /api/v1/admin/subjects/?page=&page_size=&q=&department_id=
   */
  list: async ({ page, pageSize, q, departmentId, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.SUBJECTS.LIST, {
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
   * Retrieve a single subject by ID.
   * GET /api/v1/admin/subjects/{subject_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.SUBJECTS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new subject.
   * POST /api/v1/admin/subjects/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.SUBJECTS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing subject.
   * PUT /api/v1/admin/subjects/{subject_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.SUBJECTS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a subject by ID.
   * DELETE /api/v1/admin/subjects/{subject_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.SUBJECTS.DETAIL(id));
    return unwrap(response);
  },
};

export default subjectsApi;
