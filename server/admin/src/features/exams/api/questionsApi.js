import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const questionsApi = {
  /**
   * Retrieve questions with server-side pagination, search, and type filtering.
   * GET /api/v1/admin/questions/?page=&page_size=&exam_id=&search=&question_type=
   */
  list: async ({ page, pageSize, examId, q, questionType, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.QUESTIONS.LIST, {
      params: {
        page,
        page_size: pageSize,
        exam_id: examId || undefined,
        search: q || undefined,
        question_type: questionType || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single question by ID, including its MCQ options.
   * GET /api/v1/admin/questions/{question_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.QUESTIONS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new question, optionally with embedded MCQ options.
   * POST /api/v1/admin/questions/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.QUESTIONS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing question. Providing `options` replaces them entirely.
   * PUT /api/v1/admin/questions/{question_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.QUESTIONS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Delete a question by ID.
   * DELETE /api/v1/admin/questions/{question_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.QUESTIONS.DETAIL(id));
    return unwrap(response);
  },

  /**
   * Reassign display_order for an exam's questions.
   * PUT /api/v1/admin/exams/{exam_id}/questions/reorder
   */
  reorder: async (examId, orderedIds) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.EXAMS.REORDER(examId),
      { ordered_ids: orderedIds },
    );
    return unwrap(response);
  },
};

export default questionsApi;
