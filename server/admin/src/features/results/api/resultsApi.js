import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const resultsApi = {
  /**
   * Retrieve read-only results, optionally filtered by student_id, exam_id,
   * or class_id, with server-side pagination.
   * GET /api/v1/admin/results/?page=&page_size=&student_id=&exam_id=&class_id=
   */
  list: async ({ page, pageSize, studentId, examId, classId, q, evaluationStatus, isPublished, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.RESULTS.LIST, {
      params: {
        page,
        page_size: pageSize,
        student_id: studentId || undefined,
        exam_id: examId || undefined,
        class_id: classId || undefined,
        q: q || undefined,
        evaluation_status: evaluationStatus || undefined,
        is_published: isPublished !== undefined && isPublished !== '' ? isPublished : undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single result by its ID.
   * GET /api/v1/admin/results/{result_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.RESULTS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Retrieve all student answers (MCQ and Descriptive) for an exam assignment.
   * GET /api/v1/admin/results/{student_exam_id}/answers
   */
  sessionAnswers: async (studentExamId, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.RESULTS.SESSION_ANSWERS(studentExamId), {
      signal,
    });
    return unwrap(response);
  },

  /**
   * Publish the final result for an exam assignment after all descriptive
   * answers are evaluated.
   * POST /api/v1/admin/results/{student_exam_id}/publish
   */
  publish: async (studentExamId) => {
    const response = await axiosClient.post(API_ENDPOINTS.RESULTS.PUBLISH(studentExamId));
    return unwrap(response);
  },

  /**
   * Delete a result by ID.
   * DELETE /api/v1/admin/results/{result_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.RESULTS.DETAIL(id));
    return unwrap(response);
  },
};

export default resultsApi;
