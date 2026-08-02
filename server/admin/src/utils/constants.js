/**
 * Application Constants and Enums for the TeioOS Administration Dashboard.
 * Mirrors the backend domain enums exactly.
 */

export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'teioos_admin_token',
  THEME: 'teioos_admin_theme',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
};

export const QUESTION_TYPES = {
  MCQ: 'MCQ',
  DESCRIPTIVE: 'DESCRIPTIVE',
};

export const SCHEDULE_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
};

export const EVALUATION_STATUS = {
  PENDING: 'PENDING',
  PARTIALLY_EVALUATED: 'PARTIALLY_EVALUATED',
  COMPLETED: 'COMPLETED',
};

export const ACCESSIBILITY_PROFILES = {
  STANDARD: 'standard',
  SCREEN_READER: 'screen_reader',
  HIGH_CONTRAST: 'high_contrast',
  LARGE_TEXT: 'large_text',
  REDUCED_MOTION: 'reduced_motion',
};

export const ACCESSIBILITY_PROFILE_OPTIONS = [
  { value: ACCESSIBILITY_PROFILES.STANDARD, label: 'Standard' },
  { value: ACCESSIBILITY_PROFILES.SCREEN_READER, label: 'Screen Reader' },
  { value: ACCESSIBILITY_PROFILES.HIGH_CONTRAST, label: 'High Contrast' },
  { value: ACCESSIBILITY_PROFILES.LARGE_TEXT, label: 'Large Text' },
  { value: ACCESSIBILITY_PROFILES.REDUCED_MOTION, label: 'Reduced Motion' },
];

export const ACCESSIBILITY_PROFILE_DESCRIPTIONS = {
  [ACCESSIBILITY_PROFILES.STANDARD]: 'No special accommodation. Used by default.',
  [ACCESSIBILITY_PROFILES.SCREEN_READER]: 'Screen reader (Orca) enabled in the examination client.',
  [ACCESSIBILITY_PROFILES.HIGH_CONTRAST]: 'High contrast theme applied during examinations.',
  [ACCESSIBILITY_PROFILES.LARGE_TEXT]: 'Enlarged fonts and controls during examinations.',
  [ACCESSIBILITY_PROFILES.REDUCED_MOTION]: 'Animations and transitions reduced during examinations.',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
};

export const THEME_CYCLE = [THEMES.LIGHT, THEMES.DARK, THEMES.HIGH_CONTRAST];

export const AUTH_EVENTS = {
  SESSION_EXPIRED: 'auth:session-expired',
  UNAUTHORIZED: 'auth:unauthorized',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

/**
 * Pass threshold for reports and analytics. Mirrors the backend constant
 * (app/core/config.py PASS_PERCENTAGE) — keep both in sync.
 */
export const PASS_PERCENTAGE = 40;

export const QUERY_DEFAULTS = {
  RETRY: 1,
  GC_TIME_MS: 5 * 60 * 1000,
  STALE_TIME_REFERENCE_MS: 5 * 60 * 1000,
  STALE_TIME_LIST_MS: 30 * 1000,
  STALE_TIME_DETAIL_MS: 30 * 1000,
  STALE_TIME_LIVE_MS: 15 * 1000,
  TOAST_DEDUPE_WINDOW_MS: 3000,
};
