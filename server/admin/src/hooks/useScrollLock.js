import { useEffect } from 'react';

/**
 * Locks body scrolling while `isActive` (used by Modal/Drawer).
 * @param {boolean} isActive - lock while true.
 */
export function useScrollLock(isActive) {
  useEffect(() => {
    if (!isActive) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isActive]);
}

export default useScrollLock;
