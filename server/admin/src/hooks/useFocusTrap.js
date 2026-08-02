import { useEffect } from 'react';

/**
 * Traps keyboard focus inside the given container while `isActive`.
 * Restores focus to the previously focused element on cleanup.
 * @param {React.RefObject<HTMLElement>} containerRef - the modal/drawer panel.
 * @param {boolean} isActive - trap while true.
 */
export function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return undefined;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = () =>
      Array.from(container.querySelectorAll(focusableSelector)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );

    const focusFirst = () => {
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    focusFirst();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [containerRef, isActive]);
}

export default useFocusTrap;
