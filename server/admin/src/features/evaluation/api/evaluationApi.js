import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

/**
 * Manual Evaluation API client.
 * Interacts with /admin/analytics/pending-evaluations, /admin/results/{studentExamId}/answers,
 * and /admin/student-answers/{answerId}/evaluate.
 */
export const evaluationApi = {
  /**
   * Retrieve list of student submissions awaiting manual evaluation.
   * GET /api/v1/admin/analytics/pending-evaluations?limit=50
   */
  getPendingList: async ({ limit = 50, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.EVALUATION.PENDING_LIST, {
      params: { limit },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve all student answers for a specific student exam session (both MCQ and Descriptive).
   * GET /api/v1/admin/results/{studentExamId}/answers
   */
  getSessionAnswers: async (studentExamId, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.RESULTS.SESSION_ANSWERS(studentExamId), {
      signal,
    });
    return unwrap(response);
  },

  /**
   * Evaluate a specific descriptive answer with awarded marks and feedback.
   * PATCH /api/v1/admin/student-answers/{answerId}/evaluate
   */
  evaluateAnswer: async (answerId, { awarded_marks, evaluator_feedback }) => {
    const response = await axiosClient.patch(API_ENDPOINTS.EVALUATION.EVALUATE_ANSWER(answerId), {
      awarded_marks,
      evaluator_feedback,
    });
    return unwrap(response);
  },

  /**
   * Publish the final evaluation result for a student exam session.
   * POST /api/v1/admin/results/{studentExamId}/publish
   */
  publishResult: async (studentExamId) => {
    const response = await axiosClient.post(API_ENDPOINTS.RESULTS.PUBLISH(studentExamId));
    return unwrap(response);
  },
};

export default evaluationApi;
