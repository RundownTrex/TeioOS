import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Accessible modal dialog (portal, focus trap, scroll lock, Esc/backdrop close).
 * Props: open, onClose, title, children, footer, size ('sm'|'md'|'lg'),
 *        closeOnEsc, closeOnBackdropClick, initialFocusRef, ariaLabel,
 *        ariaDescribedBy, role ('dialog'|'alertdialog'), className.
 */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  initialFocusRef,
  ariaLabel,
  ariaDescribedBy,
  role = 'dialog',
  className = '',
}) => {
  const titleId = useId();
  const panelRef = useRef(null);

  const sizes = {
    sm: 'max-w-dialog-sm',
    md: 'max-w-dialog-md',
    lg: 'max-w-dialog-lg',
  };

  useFocusTrap(panelRef, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open || !closeOnEsc) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (open && initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
  }, [open, initialFocusRef]);

  if (!open) return null;

  const labelledBy = ariaLabel ? undefined : `modal-${titleId}`;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
        className="absolute inset-0 bg-overlay animate-fade-in"
      />

      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={`relative z-modal w-full ${sizes[size] || sizes.md} max-h-[70vh] flex flex-col bg-surface border border-border-main rounded-xl shadow-lg animate-scale-in ${className}`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-main">
            <h2 id={labelledBy} className="text-xl font-semibold text-text-main">
              {title}
            </h2>
            <IconButton
              type="button"
              size="sm"
              label="Close dialog"
              icon={<X className="w-4 h-4" aria-hidden="true" />}
              onClick={onClose}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 text-text-main">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-main">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
