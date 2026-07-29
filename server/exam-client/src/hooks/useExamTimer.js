import { useState, useEffect } from 'react';
import { announceToScreenReader } from '../utils/ariaAnnounce';

/**
 * Server-authoritative timer hook computing remaining duration.
 */
export const useExamTimer = (targetEndTime, onExpire) => {
  const calculateRemaining = () => {
    if (!targetEndTime) return 0;
    const diff = Math.floor((new Date(targetEndTime).getTime() - new Date().getTime()) / 1000);
    return Math.max(0, diff);
  };

  const [secondsRemaining, setSecondsRemaining] = useState(calculateRemaining);

  useEffect(() => {
    if (!targetEndTime) return;

    // Recalculate immediately
    const initialDiff = calculateRemaining();
    setSecondsRemaining(initialDiff);

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      // Screen reader announcements at critical milestones
      if (remaining === 300) {
        announceToScreenReader('Attention: 5 minutes remaining in your examination.', 'assertive');
      } else if (remaining === 60) {
        announceToScreenReader('Attention: 1 minute remaining. Your exam will submit automatically.', 'assertive');
      } else if (remaining === 0) {
        clearInterval(interval);
        announceToScreenReader('Time expired. Submitting your examination automatically.', 'assertive');
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetEndTime]);

  return { secondsRemaining };
};
