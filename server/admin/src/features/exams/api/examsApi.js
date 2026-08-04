import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const examsApi = {
  /**
   * Retrieve exams with server-side pagination, search, and filters.
   * GET /api/v1/admin/exams/?page=&page_size=&subject_id=&search=&status=
   */
  list: async ({ page, pageSize, subjectId, q, status, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.EXAMS.LIST, {
      params: {
        page,
        page_size: pageSize,
        subject_id: subjectId || undefined,
        search: q || undefined,
        status: status || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single exam by ID.
   * GET /api/v1/admin/exams/{exam_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.EXAMS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new exam.
   * POST /api/v1/admin/exams/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.EXAMS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing exam.
   * PUT /api/v1/admin/exams/{exam_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.EXAMS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Toggle status between draft and published.
   * PUT /api/v1/admin/exams/{exam_id}
   */
  toggleStatus: async (id, status) => {
    const response = await axiosClient.put(API_ENDPOINTS.EXAMS.DETAIL(id), { status });
    return unwrap(response);
  },

  /**
   * Delete an exam by ID.
   * DELETE /api/v1/admin/exams/{exam_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.EXAMS.DETAIL(id));
    return unwrap(response);
  },
};

export default examsApi;
