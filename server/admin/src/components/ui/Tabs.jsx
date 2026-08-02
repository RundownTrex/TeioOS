import React, { useId, useRef } from 'react';

/**
 * Accessible tabs (APG pattern, automatic activation).
 * Props: tabs ([{ id, label, content? }]), value, onChange, ariaLabel, className.
 * Note: renders the active tab panel only.
 */
export const Tabs = ({
  tabs = [],
  value,
  onChange,
  ariaLabel = 'Tabs',
  className = '',
}) => {
  const baseId = useId();
  const tablistRef = useRef(null);

  if (!tabs.length) return null;

  const activeTab = tabs.find((tab) => tab.id === value) || tabs[0];

  const selectTab = (tabId) => {
    if (onChange) onChange(tabId);
  };

  const onKeyDown = (event) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === value);
    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectTab(nextTab.id);
    const nextButton = tablistRef.current?.querySelector(`[data-tab-id="${nextTab.id}"]`);
    nextButton?.focus();
  };

  return (
    <div className={className}>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-border-main"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId}
              data-tab-id={tab.id}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={`px-4 h-10 text-sm font-medium transition-colors border-b-2 -mb-px focus-visible:outline-none ${
                isActive
                  ? 'border-navy-primary text-navy-primary'
                  : 'border-transparent text-text-muted hover:text-text-main hover:border-border-strong'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        key={activeTab.id}
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        tabIndex={0}
        className="pt-5 focus-visible:outline-none"
      >
        {activeTab.content}
      </div>
    </div>
  );
};

export default Tabs;
