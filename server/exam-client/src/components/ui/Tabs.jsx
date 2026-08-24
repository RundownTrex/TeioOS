import React, { useState, createContext, useContext, useRef, useId } from 'react';

const TabsContext = createContext(null);

export const Tabs = ({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;
  const baseId = useId();

  const handleSelectTab = (tabValue) => {
    if (controlledValue === undefined) {
      setInternalValue(tabValue);
    }
    if (onChange) {
      onChange(tabValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, handleSelectTab, baseId }}>
      <div className={`flex flex-col ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList = ({ children, ariaLabel = 'Navigation tabs', className = '' }) => {
  const { activeTab, handleSelectTab } = useContext(TabsContext);
  const listRef = useRef(null);

  const handleKeyDown = (e) => {
    if (!listRef.current) return;
    const tabs = Array.from(listRef.current.querySelectorAll('[role="tab"]:not([disabled])'));
    if (!tabs.length) return;

    const currentIndex = tabs.findIndex((tab) => tab.getAttribute('data-value') === activeTab);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex && tabs[nextIndex]) {
      const nextValue = tabs[nextIndex].getAttribute('data-value');
      if (nextValue) {
        handleSelectTab(nextValue);
        tabs[nextIndex].focus();
      }
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-1.5 p-1 bg-subtle/70 rounded-xl border border-border-main ${className}`}
    >
      {children}
    </div>
  );
};

export const Tab = ({
  value,
  icon: Icon,
  children,
  disabled = false,
  className = '',
}) => {
  const { activeTab, handleSelectTab, baseId } = useContext(TabsContext);
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      data-value={value}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => handleSelectTab(value)}
      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-fast select-none cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary ${
        isSelected
          ? 'bg-surface text-navy-primary border-border-main shadow-xs font-extrabold'
          : 'bg-transparent text-text-muted border-transparent hover:text-text-main hover:bg-surface/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
};

export const TabPanel = ({ value, children, className = '' }) => {
  const { activeTab, baseId } = useContext(TabsContext);
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={`focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy-primary/40 rounded-lg pt-4 ${className}`}
    >
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
