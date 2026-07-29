import React from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export const Timer = ({
  secondsRemaining = 0,
  label = 'REMAINING TIME',
  className = '',
}) => {
  const isCritical = secondsRemaining > 0 && secondsRemaining <= 300; // < 5 minutes
  const formatted = formatDuration(secondsRemaining);

  return (
    <div
      id="timer-display"
      tabIndex={0}
      role="timer"
      aria-label={`${label}: ${formatted}`}
      aria-live={isCritical ? 'assertive' : 'off'}
      className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-lg border font-mono font-bold select-none transition-colors focus-visible:outline-none ${
        isCritical
          ? 'bg-red-100 text-red-700 border-red-500 animate-pulse'
          : 'bg-surface text-text-main border-border-strong'
      } ${className}`}
    >
      <Clock className={`w-4 h-4 ${isCritical ? 'text-red-600' : 'text-navy-primary'}`} aria-hidden="true" />
      <span className="text-xs font-sans font-semibold text-text-muted">{label}:</span>
      <span className="text-base tracking-wider">{formatted}</span>
    </div>
  );
};

export default Timer;
