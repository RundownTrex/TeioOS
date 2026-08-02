import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

/**
 * Analytics API module.
 *
 * All methods hit the backend `/admin/analytics/*` endpoints and return the
 * unwrapped payload (aggregate objects or plain arrays).
 */

export const analyticsApi = {
  /**
   * Dashboard analytics: pending evaluation count.
   * GET /api/v1/admin/analytics/overview
   */
  getOverview: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.OVERVIEW, { signal });
    return unwrap(response);
  },

  /**
   * Student monitoring aggregates (assigned/started/submitted/in progress).
   * GET /api/v1/admin/analytics/students/overview
   */
  getStudentOverview: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.STUDENT_OVERVIEW, { signal });
    return unwrap(response);
  },

  /**
   * Active examination sessions (status = in_progress).
   * GET /api/v1/admin/analytics/students/sessions
   */
  getCurrentSessions: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.CURRENT_SESSIONS, { signal });
    return unwrap(response);
  },

  /**
   * Submission status distribution.
   * GET /api/v1/admin/analytics/students/submission-status
   */
  getSubmissionStatus: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.SUBMISSION_STATUS, { signal });
    return unwrap(response);
  },

  /**
   * Average performance by exam (chart source).
   * GET /api/v1/admin/analytics/exams/performance
   */
  getExamPerformance: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.EXAM_PERFORMANCE, { signal });
    return unwrap(response);
  },

  /**
   * Exam sessions with descriptive answers awaiting manual evaluation.
   * GET /api/v1/admin/analytics/pending-evaluations
   */
  getPendingEvaluations: async ({ limit = 10, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.ANALYTICS.PENDING_EVALUATIONS, {
      params: { limit },
      signal,
    });
    return unwrap(response);
  },
};

export default analyticsApi;
