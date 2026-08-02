import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const studentsApi = {
  /**
   * Retrieve students with server-side pagination, search and filters.
   * GET /api/v1/admin/students/?page=&page_size=&q=&class_id=&is_active=
   */
  list: async ({ page, pageSize, q, classId, isActive, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.STUDENTS.LIST, {
      params: {
        page,
        page_size: pageSize,
        q: q || undefined,
        class_id: classId || undefined,
        is_active: isActive,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single student by ID.
   * GET /api/v1/admin/students/{student_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.STUDENTS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new student.
   * POST /api/v1/admin/students/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.STUDENTS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing student.
   * PUT /api/v1/admin/students/{student_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.STUDENTS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a student by ID.
   * DELETE /api/v1/admin/students/{student_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.STUDENTS.DETAIL(id));
    return unwrap(response);
  },
};

export default studentsApi;
