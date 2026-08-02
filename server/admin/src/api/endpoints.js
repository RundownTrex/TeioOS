/**
 * Centralized API Endpoints matching the TeioOS FastAPI Backend routes (/api/v1/admin/*).
 * Single source of truth — feature API modules must reference only this table.
 */
export const API_ENDPOINTS = {
  // Admin Authentication
  AUTH: {
    LOGIN: '/admin/auth/login',
    ME: '/admin/auth/me',
  },

  // Admin Dashboard
  DASHBOARD: {
    STATS: '/admin/dashboard/',
  },

  // Analytics & Reports
  ANALYTICS: {
    OVERVIEW: '/admin/analytics/overview',
    STUDENT_OVERVIEW: '/admin/analytics/students/overview',
    CURRENT_SESSIONS: '/admin/analytics/students/sessions',
    SUBMISSION_STATUS: '/admin/analytics/students/submission-status',
    EXAM_PERFORMANCE: '/admin/analytics/exams/performance',
    PENDING_EVALUATIONS: '/admin/analytics/pending-evaluations',
  },

  // Departments
  DEPARTMENTS: {
    LIST: '/admin/departments/',
    DETAIL: (id) => `/admin/departments/${id}`,
  },

  // Classes
  CLASSES: {
    LIST: '/admin/classes/',
    DETAIL: (id) => `/admin/classes/${id}`,
  },

  // Subjects
  SUBJECTS: {
    LIST: '/admin/subjects/',
    DETAIL: (id) => `/admin/subjects/${id}`,
  },

  // Students
  STUDENTS: {
    LIST: '/admin/students/',
    DETAIL: (id) => `/admin/students/${id}`,
  },

  // Users (administrators / teachers)
  USERS: {
    LIST: '/admin/users/',
    DETAIL: (id) => `/admin/users/${id}`,
  },

  // Exams
  EXAMS: {
    LIST: '/admin/exams/',
    DETAIL: (id) => `/admin/exams/${id}`,
    REORDER: (examId) => `/admin/exams/${examId}/questions/reorder`,
  },

  // Exam Schedules
  EXAM_SCHEDULES: {
    LIST: '/admin/exam-schedules/',
    DETAIL: (id) => `/admin/exam-schedules/${id}`,
  },

  // Questions
  QUESTIONS: {
    LIST: '/admin/questions/',
    DETAIL: (id) => `/admin/questions/${id}`,
  },

  // Results
  RESULTS: {
    LIST: '/admin/results/',
    DETAIL: (id) => `/admin/results/${id}`,
    SESSION_ANSWERS: (studentExamId) => `/admin/results/${studentExamId}/answers`,
    PUBLISH: (studentExamId) => `/admin/results/${studentExamId}/publish`,
  },
};

export default API_ENDPOINTS;
