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
  DASHBOARD: '/dashboard',

  // Academic Structure
  DEPARTMENTS: '/departments',
  DEPARTMENTS_NEW: '/departments/new',
  DEPARTMENT_EDIT_PATTERN: '/departments/:id/edit',
  departmentEdit: (id) => `/departments/${id}/edit`,

  CLASSES: '/classes',
  CLASSES_NEW: '/classes/new',
  CLASS_EDIT_PATTERN: '/classes/:id/edit',
  classEdit: (id) => `/classes/${id}/edit`,

  SUBJECTS: '/subjects',
  SUBJECTS_NEW: '/subjects/new',
  SUBJECT_EDIT_PATTERN: '/subjects/:id/edit',
  subjectEdit: (id) => `/subjects/${id}/edit`,

  // People
  STUDENTS: '/students',
  STUDENTS_NEW: '/students/new',
  STUDENT_DETAIL_PATTERN: '/students/:id',
  STUDENT_EDIT_PATTERN: '/students/:id/edit',
  studentDetail: (id) => `/students/${id}`,
  studentEdit: (id) => `/students/${id}/edit`,

  ADMINISTRATORS: '/administrators',
  ADMINISTRATORS_NEW: '/administrators/new',
  ADMINISTRATOR_DETAIL_PATTERN: '/administrators/:id',
  ADMINISTRATOR_EDIT_PATTERN: '/administrators/:id/edit',
  administratorDetail: (id) => `/administrators/${id}`,
  administratorEdit: (id) => `/administrators/${id}/edit`,

  // Examinations
  EXAMS: '/exams',
  EXAMS_NEW: '/exams/new',
  EXAM_DETAIL_PATTERN: '/exams/:id',
  EXAM_EDIT_PATTERN: '/exams/:id/edit',
  QUESTION_NEW_PATTERN: '/exams/:id/questions/new',
  QUESTION_EDIT_PATTERN: '/exams/:id/questions/:questionId/edit',
  examDetail: (id) => `/exams/${id}`,
  examEdit: (id) => `/exams/${id}/edit`,
  questionNew: (examId) => `/exams/${examId}/questions/new`,
  questionEdit: (examId, questionId) => `/exams/${examId}/questions/${questionId}/edit`,

  SCHEDULES: '/schedules',
  SCHEDULES_NEW: '/schedules/new',
  SCHEDULE_EDIT_PATTERN: '/schedules/:id/edit',
  SCHEDULE_ASSIGN_PATTERN: '/schedules/:id/assign',
  scheduleEdit: (id) => `/schedules/${id}/edit`,
  scheduleAssign: (id) => `/schedules/${id}/assign`,

  // Assessment
  EVALUATION: '/evaluation',
  EVALUATION_WORKBENCH_PATTERN: '/evaluation/:studentExamId',
  evaluationWorkbench: (studentExamId) => `/evaluation/${studentExamId}`,

  RESULTS: '/results',
  RESULT_DETAIL_PATTERN: '/results/:id',
  resultDetail: (id) => `/results/${id}`,

  // Analytics & Reports
  ANALYTICS: '/analytics',
  ANALYTICS_STUDENTS: '/analytics/students',
  ANALYTICS_EXAMS: '/analytics/exams',
  REPORTS: '/reports',
  REPORT_STUDENT: '/reports/student',
  REPORT_EXAM: '/reports/exam',
  REPORT_EVALUATION: '/reports/evaluation',

  // System (future-ready)
  ACCESSIBILITY_PROFILES: '/accessibility-profiles',
  SETTINGS: '/settings',
};

export default PATHS;
