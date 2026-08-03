/**
 * Central route path constants (single source of truth).
 *
 * Static paths are plain strings; dynamic routes expose both a pattern
 * (used by the route table) and a builder (used by navigation code).
 */

export const PATHS = {
  // Public / System
  LOGIN: '/login',
  UNAUTHORIZED: '/403',
  OFFLINE: '/offline',
  SYSTEM_ERROR: '/error',
  NOT_FOUND: '/404',

  // Overview
  DASHBOARD: '/admin/dashboard',

  // Academic Structure
  DEPARTMENTS: '/admin/departments',
  DEPARTMENTS_NEW: '/admin/departments/new',
  DEPARTMENT_EDIT_PATTERN: '/admin/departments/:id/edit',
  departmentEdit: (id) => `/admin/departments/${id}/edit`,

  CLASSES: '/admin/classes',
  CLASSES_NEW: '/admin/classes/new',
  CLASS_EDIT_PATTERN: '/admin/classes/:id/edit',
  classEdit: (id) => `/admin/classes/${id}/edit`,

  SUBJECTS: '/admin/subjects',
  SUBJECTS_NEW: '/admin/subjects/new',
  SUBJECT_EDIT_PATTERN: '/admin/subjects/:id/edit',
  subjectEdit: (id) => `/admin/subjects/${id}/edit`,

  // People
  STUDENTS: '/admin/students',
  STUDENTS_NEW: '/admin/students/new',
  STUDENT_DETAIL_PATTERN: '/admin/students/:id',
  STUDENT_EDIT_PATTERN: '/admin/students/:id/edit',
  studentDetail: (id) => `/admin/students/${id}`,
  studentEdit: (id) => `/admin/students/${id}/edit`,

  ADMINISTRATORS: '/admin/administrators',
  ADMINISTRATORS_NEW: '/admin/administrators/new',
  ADMINISTRATOR_DETAIL_PATTERN: '/admin/administrators/:id',
  ADMINISTRATOR_EDIT_PATTERN: '/admin/administrators/:id/edit',
  administratorDetail: (id) => `/admin/administrators/${id}`,
  administratorEdit: (id) => `/admin/administrators/${id}/edit`,

  // Examinations
  EXAMS: '/admin/exams',
  EXAMS_NEW: '/admin/exams/new',
  EXAM_DETAIL_PATTERN: '/admin/exams/:id',
  EXAM_EDIT_PATTERN: '/admin/exams/:id/edit',
  QUESTION_NEW_PATTERN: '/admin/exams/:id/questions/new',
  QUESTION_EDIT_PATTERN: '/admin/exams/:id/questions/:questionId/edit',
  examDetail: (id) => `/admin/exams/${id}`,
  examEdit: (id) => `/admin/exams/${id}/edit`,
  questionNew: (examId) => `/admin/exams/${examId}/questions/new`,
  questionEdit: (examId, questionId) => `/admin/exams/${examId}/questions/${questionId}/edit`,

  SCHEDULES: '/admin/schedules',
  SCHEDULES_NEW: '/admin/schedules/new',
  SCHEDULE_EDIT_PATTERN: '/admin/schedules/:id/edit',
  SCHEDULE_ASSIGN_PATTERN: '/admin/schedules/:id/assign',
  scheduleEdit: (id) => `/admin/schedules/${id}/edit`,
  scheduleAssign: (id) => `/admin/schedules/${id}/assign`,

  // Assessment
  EVALUATION: '/admin/evaluation',
  EVALUATION_WORKBENCH_PATTERN: '/admin/evaluation/:studentExamId',
  evaluationWorkbench: (studentExamId) => `/admin/evaluation/${studentExamId}`,

  RESULTS: '/admin/results',
  RESULT_DETAIL_PATTERN: '/admin/results/:id',
  resultDetail: (id) => `/admin/results/${id}`,

  // Analytics & Reports
  ANALYTICS: '/admin/analytics',
  ANALYTICS_STUDENTS: '/admin/analytics/students',
  ANALYTICS_EXAMS: '/admin/analytics/exams',
  REPORTS: '/admin/reports',
  REPORT_STUDENT: '/admin/reports/student',
  REPORT_EXAM: '/admin/reports/exam',
  REPORT_EVALUATION: '/admin/reports/evaluation',

  // System (future-ready)
  ACCESSIBILITY_PROFILES: '/admin/accessibility-profiles',
  SETTINGS: '/admin/settings',
};

export default PATHS;
