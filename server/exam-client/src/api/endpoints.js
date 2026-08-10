/**
 * Centralized API Endpoints matching TeioOS FastAPI Backend routes (/api/v1/student/*)
 */
export const API_ENDPOINTS = {
  // Auth Endpoints
  LOGIN: '/student/auth/login',
  ME: '/student/auth/me',

  // Exam Endpoints
  ASSIGNED_EXAMS: '/student/exams/',
  INSTRUCTIONS: (scheduleId) => `/student/exams/${scheduleId}/instructions`,
  SESSION: (scheduleId) => `/student/exams/${scheduleId}/session`,
  START_EXAM: (scheduleId) => `/student/exams/${scheduleId}/start`,
  PAUSE_EXAM: (scheduleId) => `/student/exams/${scheduleId}/pause`,
  QUESTIONS: (scheduleId) => `/student/exams/${scheduleId}/questions`,
  SUBMIT_EXAM: (scheduleId) => `/student/exams/${scheduleId}/submit`,
  RESULT: (scheduleId) => `/student/exams/${scheduleId}/result`,
  REVIEW: (scheduleId) => `/student/exams/${scheduleId}/review`,

  // Answer & Speech Submission Endpoints
  SAVE_ANSWER: '/student/answers/',
  TRANSCRIBE_SPEECH: '/student/speech/transcribe',
};

