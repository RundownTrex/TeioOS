import { useState, useEffect, useRef, useCallback } from 'react';
import { announceToScreenReader } from '../utils/ariaAnnounce';

/**
 * Server-authoritative countdown timer.
 *
 * Derives remaining time from an absolute server `expiresAt` timestamp plus a
 * clock offset (`clockOffsetMs = server_now - client_now`). This makes the timer
 * survive refresh, browser restart, and clock skew: it never stores a plain
 * decrementing value.
 *
 * @param {object} params
 * @param {string|null} params.expiresAt - Absolute server expiry (ISO 8601).
 * @param {number} params.clockOffsetMs - Server-to-client clock offset in ms.
 * @param {boolean} params.enabled - Whether the countdown should run.
 * @param {() => void} params.onExpire - Called exactly once when time reaches zero.
 * @returns {{ secondsRemaining: number, hasExpired: boolean }}
 */
export const useAuthoritativeTimer = ({
  expiresAt,
  clockOffsetMs = 0,
  enabled = true,
  onExpire,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const remainingMs = new Date(expiresAt).getTime() - (Date.now() + clockOffsetMs);
    return Math.max(0, Math.floor(remainingMs / 1000));
  }, [expiresAt, clockOffsetMs]);

  useEffect(() => {
    if (!enabled || !expiresAt) return;

    const initial = calculateRemaining();
    setSecondsRemaining(initial);
    if (initial === 0 && !firedRef.current) {
      firedRef.current = true;
      setHasExpired(true);
      if (onExpireRef.current) onExpireRef.current();
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining === 300) {
        announceToScreenReader('Attention: 5 minutes remaining in your examination.', 'assertive');
      } else if (remaining === 60) {
        announceToScreenReader('Attention: 1 minute remaining. Your exam will submit automatically.', 'assertive');
      } else if (remaining === 0) {
        clearInterval(interval);
        announceToScreenReader('Time expired. Submitting your examination automatically.', 'assertive');
        if (!firedRef.current) {
          firedRef.current = true;
          setHasExpired(true);
          if (onExpireRef.current) onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, expiresAt, clockOffsetMs, calculateRemaining]);

  return { secondsRemaining, hasExpired };
};

export default useAuthoritativeTimer;
