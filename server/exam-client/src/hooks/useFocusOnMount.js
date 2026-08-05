import { useEffect, useRef } from 'react';

/**
 * Custom hook to programmatically focus an element (such as a page heading) on mount.
 * Ensures keyboard-only and screen reader users land predictably on the page title during route transitions.
 *
 * @returns {React.RefObject} Ref object to attach to the heading or container element (must have tabIndex={-1})
 */
export const useFocusOnMount = () => {
  const focusRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusRef.current?.focus({ preventScroll: true });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return focusRef;
};

export default useFocusOnMount;
