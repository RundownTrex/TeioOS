import React from 'react';
import { useExamTimer } from '../../hooks/useExamTimer';
import { formatDuration } from '../../utils/formatters';
import { Clock } from 'lucide-react';

export const ExamTimer = ({ endTime, onExpire }) => {
  const { secondsRemaining } = useExamTimer(endTime, onExpire);
  const isUrgent = secondsRemaining < 300; // Less than 5 mins

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Time remaining: ${formatDuration(secondsRemaining)}`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-base font-bold font-mono border transition-colors ${
        isUrgent
          ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 animate-pulse'
          : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
      }`}
    >
      <Clock className="h-5 w-5" aria-hidden="true" />
      <span>{formatDuration(secondsRemaining)}</span>
    </div>
  );
};
