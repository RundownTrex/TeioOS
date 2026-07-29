import { useEffect } from 'react';

/**
 * Sets the browser document.title for the current page.
 * Supports screen readers that announce title changes on navigation.
 * Automatically resets to the base title on unmount.
 *
 * @param {string} pageTitle - The current page title (e.g. "Login")
 * @param {string} [appName="TeioOS Examination Platform"]
 */
export const useDocumentTitle = (pageTitle, appName = 'TeioOS Examination Platform') => {
  useEffect(() => {
    const fullTitle = pageTitle ? `${pageTitle} | ${appName}` : appName;
    const previousTitle = document.title;
    document.title = fullTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle, appName]);
};

export default useDocumentTitle;
