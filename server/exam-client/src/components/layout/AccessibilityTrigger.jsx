import React from 'react';
import { Settings } from 'lucide-react';

export const AccessibilityTrigger = ({ onClick, className = '' }) => {
  return (
    <button
      id="skip-to-accessibility"
      type="button"
      onClick={onClick}
      aria-label="Open accessibility preferences dialog (Keyboard shortcut Alt+A)"
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border-strong bg-surface text-text-main hover:bg-subtle transition-colors focus-visible:outline-none select-none ${className}`}
    >
      <Settings className="w-4 h-4 text-navy-primary" aria-hidden="true" />
      <span>Accessibility</span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-subtle text-text-muted border border-border-main rounded">
        Alt+A
      </kbd>
    </button>
  );
};

export default AccessibilityTrigger;
