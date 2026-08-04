import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const schedulesApi = {
  /**
   * Retrieve schedules with server-side pagination, search, and status filters.
   * GET /api/v1/admin/exam-schedules/?page=&page_size=&exam_id=&search=&status=
   */
  list: async ({ page, pageSize, examId, q, status, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.EXAM_SCHEDULES.LIST, {
      params: {
        page,
        page_size: pageSize,
        exam_id: examId || undefined,
        search: q || undefined,
        status: status || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single schedule by ID.
   * GET /api/v1/admin/exam-schedules/{schedule_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.EXAM_SCHEDULES.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new exam schedule.
   * POST /api/v1/admin/exam-schedules/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.EXAM_SCHEDULES.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing schedule (supports activation/deactivation via status).
   * PUT /api/v1/admin/exam-schedules/{schedule_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.EXAM_SCHEDULES.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a schedule by ID.
   * DELETE /api/v1/admin/exam-schedules/{schedule_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.EXAM_SCHEDULES.DETAIL(id));
    return unwrap(response);
  },
};

export default schedulesApi;
