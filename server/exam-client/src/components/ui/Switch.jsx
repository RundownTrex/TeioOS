import React, { useId } from 'react';

/**
 * Accessible toggle Switch component.
 * Uses role="switch" on the interactive button with aria-labelledby pointing to
 * a sibling label span — avoids the <label htmlFor="button"> anti-pattern.
 */
export const Switch = ({
  id,
  label,
  checked = false,
  onChange,
  isDisabled = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const switchId = id || `switch-${generatedId}`;
  const labelId = `${switchId}-label`;

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!isDisabled && onChange) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        disabled={isDisabled}
        onClick={() => !isDisabled && onChange && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 ${
          checked ? 'bg-navy-primary' : 'bg-border-strong'
        } ${isDisabled ? 'cursor-not-allowed' : ''}`}
        {...props}
      >
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      {label && (
        <span
          id={labelId}
          className={`text-sm font-medium text-text-main ${
            isDisabled ? 'cursor-not-allowed' : 'cursor-default'
          }`}
          onClick={() => !isDisabled && onChange && onChange(!checked)}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Switch;
