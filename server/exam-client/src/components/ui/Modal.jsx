import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog.
 *
 * @param {string} [returnFocusId] - Element id to receive focus on close when the
 *   element focused at open time is gone or was just <body> (e.g. opened by a hotkey).
 * @param {boolean} [isolateKeys] - When true, keydown events do not reach page-level
 *   shortcut listeners while the dialog is open (stops Enter/Arrows/Escape in the
 *   dialog from also driving the page behind it).
 */
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  returnFocusId,
  isolateKeys = false,
}) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const descId = useId();

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Focus management: store trigger, focus dialog container, restore on close
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus the dialog container itself so screen readers announce the dialog
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      // Restore focus only after a real close (never on initial mount)
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        requestAnimationFrame(() => {
          let target = previousFocusRef.current;
          const isUsable =
            target &&
            target !== document.body &&
            target.isConnected &&
            typeof target.focus === 'function';
          if (!isUsable && returnFocusId) {
            target = document.getElementById(returnFocusId);
          }
          if (target && typeof target.focus === 'function') {
            target.focus();
          }
        });
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard: Escape to close, Tab to trap focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Keep page-level hotkeys (registered on window, bubble phase) from also
      // reacting. React handlers inside the dialog have already run by now.
      if (isolateKeys) e.stopPropagation();

      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const dialog = dialogRef.current;
        const focusables = dialog.querySelectorAll(FOCUSABLE_SELECTOR);
        if (!focusables.length) {
          e.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // Focus is on the dialog container itself or has escaped: pull it back in
        if (!dialog.contains(active) || active === dialog) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // document sits after React's root listeners but before window-level page hotkeys
    const target = isolateKeys ? document : window;
    target.addEventListener('keydown', handleKeyDown);
    return () => target.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isolateKeys]);

  if (!isOpen) return null;

  const modalContent = (
    // The backdrop must NOT carry aria-hidden. aria-hidden propagates to all
    // descendants, which would hide the dialog content from assistive technologies.
    // The dialog element inside uses aria-modal="true" which is the correct signal
    // to screen readers that content outside the dialog should be treated as inert.
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={descId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-surface border border-border-main rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary ${
          sizes[size] || sizes.md
        } ${className}`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-main flex items-center justify-between">
          {title ? (
            <h2 id={titleId} className="text-lg font-serif font-semibold text-text-main">
              {title}
            </h2>
          ) : (
            <span />
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div id={descId} className="p-6 overflow-y-auto flex-1 text-text-main leading-relaxed">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border-main bg-subtle/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
