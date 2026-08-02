/**
 * Query key factories for TanStack Query.
 *
 * Every entity exposes:
 *   - all:     prefix used to invalidate everything under the entity
 *   - list:    { all, by(params) } — each filter/pagination variant is a
 *              distinct key; list.all invalidates every variant at once
 *   - detail(id)
 */

export const queryKeys = {
  dashboard: {
    all: ['dashboard'],
    stats: ['dashboard', 'stats'],
  },

  analytics: {
    all: ['analytics'],
    overview: ['analytics', 'overview'],
    studentOverview: ['analytics', 'student', 'overview'],
    currentSessions: ['analytics', 'student', 'sessions'],
    submissionStatus: ['analytics', 'student', 'submission-status'],
    examPerformance: ['analytics', 'exams', 'performance'],
    pendingEvaluations: ['analytics', 'pending-evaluations'],
  },

  departments: {
    all: ['departments'],
    list: {
      all: ['departments', 'list'],
      by: (params) => ['departments', 'list', params],
    },
    detail: (id) => ['departments', 'detail', id],
  },

  classes: {
    all: ['classes'],
    list: {
      all: ['classes', 'list'],
      by: (params) => ['classes', 'list', params],
    },
    detail: (id) => ['classes', 'detail', id],
  },

  subjects: {
    all: ['subjects'],
    list: {
      all: ['subjects', 'list'],
      by: (params) => ['subjects', 'list', params],
    },
    detail: (id) => ['subjects', 'detail', id],
  },

  students: {
    all: ['students'],
    list: {
      all: ['students', 'list'],
      by: (params) => ['students', 'list', params],
    },
    detail: (id) => ['students', 'detail', id],
  },

  exams: {
    all: ['exams'],
    list: {
      all: ['exams', 'list'],
      by: (params) => ['exams', 'list', params],
    },
    detail: (id) => ['exams', 'detail', id],
  },

  questions: {
    all: ['questions'],
    list: {
      all: ['questions', 'list'],
      by: (params) => ['questions', 'list', params],
    },
    detail: (id) => ['questions', 'detail', id],
  },

  schedules: {
    all: ['schedules'],
    list: {
      all: ['schedules', 'list'],
      by: (params) => ['schedules', 'list', params],
    },
    detail: (id) => ['schedules', 'detail', id],
  },

  results: {
    all: ['results'],
    list: {
      all: ['results', 'list'],
      by: (params) => ['results', 'list', params],
    },
    detail: (id) => ['results', 'detail', id],
  },

};

export default queryKeys;
