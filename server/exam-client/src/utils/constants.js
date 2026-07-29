/**
 * Application Constants and Enums for TeioOS Student Examination Client
 */

export const STORAGE_KEYS = {
  BASE_TOKEN: 'teioos_student_token',
  ELEVATED_TOKEN: 'teioos_exam_token',
  ACCESSIBILITY_SETTINGS: 'teioos_accessibility_settings',
  SHORTCUT_SETTINGS: 'teioos_shortcut_settings',
  ACTIVE_EXAM_ID: 'teioos_active_exam_id',
  OFFLINE_QUEUE: 'teioos_offline_queue',
  SUBMISSION_QUEUE: 'teioos_submission_queue',
  EXAM_ANSWERS_CACHE: 'teioos_exam_answers_cache_',
};

export const EXAM_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
};

export const SYNC_STATUS = {
  IDLE: 'IDLE',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  RETRYING: 'RETRYING',
  LOCAL: 'LOCAL',
  OFFLINE: 'OFFLINE',
  RECOVERY: 'RECOVERY',
  ERROR: 'ERROR',
};

export const THEMES = {
  DEFAULT: 'default',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
};

export const FONT_SCALES = [100, 125, 150, 175, 200];
