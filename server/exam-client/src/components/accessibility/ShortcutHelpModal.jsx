import React from 'react';
import { useShortcuts } from '../../hooks/useShortcuts';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RotateCcw, Command } from 'lucide-react';

export const ShortcutHelpModal = () => {
  const { isHelpOpen, closeHelp, shortcuts, resetShortcuts } = useShortcuts();

  // Format shortcut object into accessible visual badge text (e.g., Alt + N)
  const formatCombo = (config) => {
    if (!config) return '';
    const parts = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.alt) parts.push('Alt');
    if (config.shift) parts.push('Shift');
    parts.push(config.key);
    return parts.join(' + ');
  };

  // Group shortcuts by category
  const categories = {
    'Exam Navigation': [],
    'Question Actions': [],
    'Text-to-Speech': [],
    'Quick Focus': [],
    'System': [],
    'Question Jump': [],
  };

  Object.entries(shortcuts).forEach(([actionName, config]) => {
    const cat = config.category || 'System';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ actionName, ...config });
  });

  const footerActions = (
    <div className="flex items-center justify-between w-full gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={resetShortcuts}
        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
      >
        Reset Defaults
      </Button>
      <Button variant="primary" size="md" onClick={closeHelp}>
        Close Help (Esc)
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isHelpOpen}
      onClose={closeHelp}
      title="KEYBOARD SHORTCUTS REFERENCE"
      footer={footerActions}
      size="lg"
    >
      <div className="space-y-6 select-none">
        <p className="text-xs text-text-muted leading-relaxed">
          TeioOS provides complete keyboard accessibility. All shortcuts are active throughout the examination session. Shortcuts automatically respect active text input fields and will not interfere with descriptive writing.
        </p>

        {Object.entries(categories).map(([catName, list]) => {
          if (!list.length) return null;
          return (
            <section key={catName} aria-labelledby={`cat-${catName.replace(/\s+/g, '-').toLowerCase()}`}>
              <h3
                id={`cat-${catName.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs font-bold text-navy-primary uppercase tracking-wider mb-2.5 pb-1 border-b border-border-main flex items-center gap-2"
              >
                <Command className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{catName}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {list.map((item) => (
                  <div
                    key={item.actionName}
                    className="flex items-center justify-between p-2.5 bg-subtle/50 border border-border-main rounded-lg"
                  >
                    <span className="font-medium text-text-main">{item.label}</span>
                    <kbd className="px-2 py-1 font-mono text-[11px] font-bold bg-surface text-navy-primary border border-border-strong rounded shadow-xs">
                      {formatCombo(item)}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
};

export default ShortcutHelpModal;
