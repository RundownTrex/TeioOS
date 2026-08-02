import React from 'react';
import { Badge } from './Badge';
import {
  SCHEDULE_STATUS,
  ASSIGNMENT_STATUS,
  EVALUATION_STATUS,
  QUESTION_TYPES,
  USER_ROLES,
} from '../../utils/constants';

/**
 * Accessible status badge mapping backend enums to Badge variants.
 * Each map entry: { label, variant }.
 */
export const STATUS_META = {
  schedule: {
    [SCHEDULE_STATUS.SCHEDULED]: { label: 'Scheduled', variant: 'neutral' },
    [SCHEDULE_STATUS.ACTIVE]: { label: 'Active', variant: 'success' },
    [SCHEDULE_STATUS.COMPLETED]: { label: 'Completed', variant: 'info' },
    [SCHEDULE_STATUS.CANCELLED]: { label: 'Cancelled', variant: 'danger' },
  },
  assignment: {
    [ASSIGNMENT_STATUS.PENDING]: { label: 'Pending', variant: 'warning' },
    [ASSIGNMENT_STATUS.IN_PROGRESS]: { label: 'In Progress', variant: 'info' },
    [ASSIGNMENT_STATUS.SUBMITTED]: { label: 'Submitted', variant: 'success' },
    [ASSIGNMENT_STATUS.AUTO_SUBMITTED]: { label: 'Auto Submitted', variant: 'purple' },
    [ASSIGNMENT_STATUS.EXPIRED]: { label: 'Expired', variant: 'danger' },
    [ASSIGNMENT_STATUS.TERMINATED]: { label: 'Terminated', variant: 'danger' },
  },
  evaluation: {
    [EVALUATION_STATUS.PENDING]: { label: 'Pending Evaluation', variant: 'warning' },
    [EVALUATION_STATUS.PARTIALLY_EVALUATED]: { label: 'Partially Evaluated', variant: 'info' },
    [EVALUATION_STATUS.COMPLETED]: { label: 'Evaluated', variant: 'success' },
  },
  question: {
    [QUESTION_TYPES.MCQ]: { label: 'MCQ', variant: 'info' },
    [QUESTION_TYPES.DESCRIPTIVE]: { label: 'Descriptive', variant: 'purple' },
  },
  role: {
    [USER_ROLES.ADMIN]: { label: 'Admin', variant: 'purple' },
    [USER_ROLES.TEACHER]: { label: 'Teacher', variant: 'neutral' },
  },
};

export const StatusBadge = ({ type, status, fallbackLabel, className = '' }) => {
  const mapping = STATUS_META[type];
  const meta = mapping?.[status] || {
    label: fallbackLabel || String(status || 'Unknown'),
    variant: 'neutral',
  };

  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
};

export default StatusBadge;
