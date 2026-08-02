import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Accessible side drawer (portal, focus trap, scroll lock, Esc/backdrop close).
 * Props: open, onClose, title, children, placement ('left'|'right'),
 *        width (Tailwind width class), ariaLabel, className.
 */
export const Drawer = ({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width = 'w-sidebar',
  ariaLabel,
  className = '',
}) => {
  const titleId = useId();
  const panelRef = useRef(null);

  const positionClasses =
    placement === 'left'
      ? 'left-0 border-r animate-[slide-in-left_200ms_var(--ease-out)]'
      : 'right-0 border-l animate-[slide-in-right_200ms_var(--ease-out)]';

  useFocusTrap(panelRef, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const labelledBy = ariaLabel ? undefined : `drawer-${titleId}`;

  return createPortal(
    <div className="fixed inset-0 z-modal">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-overlay animate-fade-in"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        className={`absolute inset-y-0 ${positionClasses} ${width} max-w-[85vw] flex flex-col bg-surface border-border-main shadow-lg ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border-main shrink-0">
            <h2 id={labelledBy} className="text-lg font-semibold text-text-main">
              {title}
            </h2>
            <IconButton
              type="button"
              size="sm"
              label="Close panel"
              icon={<X className="w-4 h-4" aria-hidden="true" />}
              onClick={onClose}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 text-text-main">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
