import React, { useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration, formatSpokenDuration } from '../../utils/formatters';
import { useTTS } from '../../hooks/useTTS';
import { useAccessibility } from '../../hooks/useAccessibility';

export const Timer = ({
  secondsRemaining = 0,
  label = 'Time Remaining',
  className = '',
}) => {
  const isCritical = secondsRemaining > 0 && secondsRemaining <= 300; // < 5 minutes
  const formatted = formatDuration(secondsRemaining);
  const spoken = formatSpokenDuration(secondsRemaining);
  const announcedBucketsRef = useRef(new Set());
  const { speakText } = useTTS();
  const { timerAnnouncementInterval = 'milestones', announceToScreenReader } = useAccessibility();

  // On-demand announcement when candidate clicks or hits Enter / Space on the timer
  const announceCurrentTime = useCallback(() => {
    const timeMessage = `Time remaining: ${spoken}.`;
    speakText(timeMessage, 'Timer Check', { force: true });
    if (announceToScreenReader) {
      announceToScreenReader(timeMessage, 'assertive');
    }
  }, [spoken, speakText, announceToScreenReader]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      announceCurrentTime();
    }
  };

  // Periodic and milestone announcements based on candidate's accessibility settings
  useEffect(() => {
    if (secondsRemaining <= 0 || timerAnnouncementInterval === 'off') return;

    // Reset buckets if time was increased or reset (e.g. session recovery/clock offset adjustment)
    for (const bucket of announcedBucketsRef.current) {
      if (bucket < secondsRemaining) {
        announcedBucketsRef.current.delete(bucket);
      }
    }

    // Determine target milestone / interval points
    const criticalMilestones = [300, 120, 60, 30, 10]; // 5m, 2m, 1m, 30s, 10s
    let targetSeconds = [];

    if (timerAnnouncementInterval === '5min') {
      const maxBucket = Math.ceil(secondsRemaining / 300) * 300;
      for (let s = 300; s <= maxBucket; s += 300) {
        targetSeconds.push(s);
      }
      targetSeconds = Array.from(new Set([...targetSeconds, ...criticalMilestones]));
    } else if (timerAnnouncementInterval === '10min') {
      const maxBucket = Math.ceil(secondsRemaining / 600) * 600;
      for (let s = 600; s <= maxBucket; s += 600) {
        targetSeconds.push(s);
      }
      targetSeconds = Array.from(new Set([...targetSeconds, ...criticalMilestones]));
    } else {
      // 'milestones' default: standard major milestones
      targetSeconds = [7200, 5400, 3600, 2700, 1800, 900, 600, 300, 120, 60, 30, 10];
    }

    for (const sec of targetSeconds) {
      if (
        secondsRemaining <= sec &&
        secondsRemaining > sec - 3 &&
        !announcedBucketsRef.current.has(sec)
      ) {
        announcedBucketsRef.current.add(sec);
        const naturalTime = formatSpokenDuration(sec);
        let alertMessage = '';
        let priority = 'polite';

        if (sec <= 60) {
          alertMessage = `Attention: ${naturalTime} remaining. Prepare to finalize your paper.`;
          priority = 'assertive';
        } else if (sec <= 300) {
          alertMessage = `Attention: ${naturalTime} remaining in examination session.`;
          priority = 'assertive';
        } else {
          alertMessage = `${naturalTime} remaining in examination session.`;
          priority = 'polite';
        }

        speakText(alertMessage, 'Timer Alert');
        if (announceToScreenReader) {
          announceToScreenReader(alertMessage, priority);
        }
        break; // Announce only one milestone per second
      }
    }
  }, [secondsRemaining, timerAnnouncementInterval, speakText, announceToScreenReader]);

  return (
    <div
      id="timer-display"
      tabIndex={0}
      role="timer"
      aria-label={`${label}: ${spoken}. Press Enter or Space to announce time.`}
      title="Click or press Enter to hear remaining time aloud"
      aria-live="off"
      onClick={announceCurrentTime}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded border font-mono font-bold select-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 ${
        isCritical
          ? 'bg-status-danger-bg text-status-danger border-status-danger animate-pulse'
          : 'bg-surface text-text-main border-border-strong hover:border-navy-primary'
      } ${className}`}
    >
      <Clock className={`w-4 h-4 ${isCritical ? 'text-status-danger' : 'text-navy-primary'}`} aria-hidden="true" />
      <span className="text-xs font-sans font-semibold text-text-muted">{label}:</span>
      <span className="text-base">{formatted}</span>
    </div>
  );
};

export default Timer;
