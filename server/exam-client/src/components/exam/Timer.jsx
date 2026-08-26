import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
import { useTTS } from '../../hooks/useTTS';

export const Timer = ({
  secondsRemaining = 0,
  label = 'REMAINING TIME',
  className = '',
}) => {
  const isCritical = secondsRemaining > 0 && secondsRemaining <= 300; // < 5 minutes
  const formatted = formatDuration(secondsRemaining);
  const announcedMilestonesRef = useRef(new Set());
  const { speakText } = useTTS();

  // Announce timer milestones (30m, 15m, 5m, 1m) aloud via Web Speech TTS and ARIA live regions
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const milestones = [
      { seconds: 1800, text: '30 minutes remaining in examination session.', priority: 'polite' },
      { seconds: 900, text: '15 minutes remaining in examination session.', priority: 'polite' },
      { seconds: 300, text: 'Attention: 5 minutes remaining in examination session.', priority: 'assertive' },
      { seconds: 60, text: 'Attention: 1 minute remaining in examination session. Prepare to finalize your paper.', priority: 'assertive' },
    ];

    milestones.forEach(({ seconds, text, priority }) => {
      if (
        secondsRemaining <= seconds &&
        secondsRemaining > seconds - 5 &&
        !announcedMilestonesRef.current.has(seconds)
      ) {
        announcedMilestonesRef.current.add(seconds);
        speakText(text, 'Timer Alert');
      }
    });
  }, [secondsRemaining, speakText]);

  return (
    <div
      id="timer-display"
      tabIndex={0}
      role="timer"
      aria-label={`${label}: ${formatted}`}
      aria-live="off"
      className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-lg border font-mono font-bold select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 ${
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
