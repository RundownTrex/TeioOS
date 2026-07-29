import React from 'react';
import { SYNC_STATUS } from '../../utils/constants';
import { CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

export const AutoSaveStatus = ({ status = SYNC_STATUS.SAVED }) => {
  const statusConfig = {
    [SYNC_STATUS.SAVING]: {
      text: 'Saving answer...',
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300',
      icon: RefreshCw,
      animate: true,
    },
    [SYNC_STATUS.SAVED]: {
      text: 'All changes saved',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300',
      icon: CheckCircle2,
      animate: false,
    },
    [SYNC_STATUS.RETRYING]: {
      text: 'Retrying sync...',
      color: 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200',
      icon: RefreshCw,
      animate: true,
    },
    [SYNC_STATUS.ERROR]: {
      text: 'Save failed (Offline)',
      color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/50 dark:text-red-300',
      icon: AlertTriangle,
      animate: false,
    },
  };

  const current = statusConfig[status] || statusConfig[SYNC_STATUS.SAVED];
  const IconComponent = current.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.color}`}
    >
      <IconComponent className={`h-3.5 w-3.5 ${current.animate ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span>{current.text}</span>
    </div>
  );
};
