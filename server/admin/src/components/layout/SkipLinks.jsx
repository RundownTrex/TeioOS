import React from 'react';

/**
 * Keyboard & screen reader skip links mounted at the document root.
 */
export const SkipLinks = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-skip-link bg-surface text-text-main border border-border-strong rounded-lg px-4 py-2 shadow-md"
      >
        Skip to main content
      </a>
    </div>
  );
};

export default SkipLinks;
