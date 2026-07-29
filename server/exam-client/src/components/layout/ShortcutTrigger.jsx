import React from 'react';
import { Keyboard } from 'lucide-react';
import { useShortcuts } from '../../hooks/useShortcuts';

export const ShortcutTrigger = ({ className = '' }) => {
  const { openHelp } = useShortcuts();

  return (
    <button
      type="button"
      onClick={openHelp}
      aria-label="Open keyboard shortcuts reference dialog (Keyboard shortcut Alt+H)"
      title="Keyboard Shortcuts Reference"
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border-strong bg-surface text-text-main hover:bg-subtle transition-colors select-none ${className}`}
    >
      <Keyboard className="w-4 h-4 text-navy-primary" aria-hidden="true" />
      <span>Shortcuts</span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-subtle text-text-muted border border-border-main rounded">
        Alt+H
      </kbd>
    </button>
  );
};

export default ShortcutTrigger;
