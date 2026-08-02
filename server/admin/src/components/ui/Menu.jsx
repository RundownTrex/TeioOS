import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import { IconButton } from './IconButton';

/**
 * Overflow actions menu (APG menu-button pattern).
 *
 * Renders a ghost icon trigger; the popover is portaled to document.body and
 * positioned under the trigger, so table overflow wrappers never clip it.
 *
 * Props:
 *   label    — aria-label for the trigger (must identify the row, e.g. "Actions for …")
 *   items    — [{ key, label, icon?, danger?, disabled?, onSelect }]
 *   align    — 'right' | 'left' popover alignment (default 'right')
 *   className
 *
 * Keyboard: trigger — Enter/Space/ArrowDown open (focus first), ArrowUp opens
 * (focus last). Popover — ArrowUp/ArrowDown move (wraps), Home/End jump,
 * Escape closes and returns focus to the trigger, Tab closes and continues
 * from the trigger.
 */
export const Menu = ({ label, items = [], align = 'right', className = '' }) => {
  const triggerId = useId();
  const menuId = `menu-${triggerId}`;
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index !== -1);

  const closeMenu = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    []
  );

  const openMenu = useCallback((focusLast = false) => {
    setOpen(true);
    setFocusedIndex(focusLast ? enabledIndexes[enabledIndexes.length - 1] ?? -1 : enabledIndexes[0] ?? -1);
  }, [enabledIndexes]);

  const moveFocus = useCallback(
    (direction) => {
      setFocusedIndex((current) => {
        const list = enabledIndexes;
        if (list.length === 0) return -1;
        const position = list.indexOf(current);
        const delta = direction === 'down' ? 1 : -1;
        const next = position === -1 ? 0 : (position + delta + list.length) % list.length;
        return list[next];
      });
    },
    [enabledIndexes]
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuWidth = popoverRef.current.offsetWidth;
    const menuHeight = popoverRef.current.offsetHeight;
    const gap = 4;
    const margin = 8;

    let left = align === 'right' ? triggerRect.right - menuWidth : triggerRect.left;
    let top = triggerRect.bottom + gap;

    if (left < margin) left = margin;
    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }
    if (top + menuHeight > window.innerHeight - margin) {
      top = Math.max(margin, triggerRect.top - menuHeight - gap);
    }

    popoverRef.current.style.left = `${left}px`;
    popoverRef.current.style.top = `${top}px`;
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;

    const enabledItems = () =>
      Array.from(popoverRef.current?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') || []);
    const focusAt = (index) => {
      const list = enabledItems();
      const element = list[index];
      if (element) element.focus();
    };

    if (focusedIndex >= 0) focusAt(focusedIndex);

    const handlePointerDown = (event) => {
      const target = event.target;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      closeMenu(false);
    };

    const handleCloseOnScrollOrResize = () => closeMenu(false);

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('scroll', handleCloseOnScrollOrResize, true);
    window.addEventListener('resize', handleCloseOnScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('scroll', handleCloseOnScrollOrResize, true);
      window.removeEventListener('resize', handleCloseOnScrollOrResize);
    };
  }, [open, focusedIndex, closeMenu]);

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu(false);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu(true);
    }
  };

  const handlePopoverKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus('down');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus('up');
    } else if (event.key === 'Home') {
      event.preventDefault();
      setFocusedIndex(enabledIndexes[0] ?? -1);
    } else if (event.key === 'End') {
      event.preventDefault();
      setFocusedIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleItemSelect = (item) => {
    closeMenu();
    item.onSelect?.();
  };

  return (
    <div className={`inline-flex ${className}`}>
      <IconButton
        ref={triggerRef}
        type="button"
        size="sm"
        label={label}
        icon={<EllipsisVertical className="w-4 h-4" aria-hidden="true" />}
        onClick={() => (open ? closeMenu() : openMenu(false))}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="data-[state=open]:bg-subtle"
        data-state={open ? 'open' : 'closed'}
      />

      {open &&
        createPortal(
          <div
            id={menuId}
            ref={popoverRef}
            role="menu"
            aria-labelledby={triggerId}
            onKeyDown={handlePopoverKeyDown}
            className="fixed z-dropdown min-w-[11rem] py-1.5 bg-surface border border-border-main rounded-lg shadow-lg"
          >
            {items.length === 0 ? (
              <div className="px-4 py-2 text-sm text-text-muted">No actions</div>
            ) : (
              items.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => !item.disabled && handleItemSelect(item)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                    item.disabled
                      ? 'text-text-muted opacity-50 cursor-not-allowed'
                      : item.danger
                        ? 'text-status-danger hover:bg-status-danger-bg'
                        : 'text-text-main hover:bg-subtle focus:bg-subtle outline-none focus-visible:bg-subtle'
                  }`}
                >
                  {item.icon && (
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Menu;
