import React from 'react';

/**
 * Persistent footer status bar.
 * Props: leftText, rightText, className.
 */
export const Footer = ({
  leftText = 'TeioOS Administration',
  rightText = 'TeioOS Exam Server',
  className = '',
}) => (
  <footer
    className={`h-footer shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 bg-canvas border-t border-border-main text-xs text-text-muted ${className}`}
  >
    <span>{leftText}</span>
    <span>{rightText}</span>
  </footer>
);

export default Footer;
