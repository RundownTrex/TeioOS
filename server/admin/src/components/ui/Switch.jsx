import React from 'react';

/**
 * Accessible switch toggle (role="switch", Space/Enter toggles natively).
 * Props: id, label, checked, onChange, isDisabled, size ('sm'|'md'), className.
 */
export const Switch = ({
  id,
  label,
  checked = false,
  onChange,
  isDisabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', on: 'translate-x-[18px]', off: 'translate-x-0.5' },
    md: { track: 'h-6 w-11', thumb: 'h-5 w-5', on: 'translate-x-[22px]', off: 'translate-x-0.5' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={isDisabled}
        onClick={onChange}
        className={`relative inline-flex shrink-0 items-center rounded-full border border-border-strong transition-colors duration-normal ease-in-out focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
          s.track
        } ${
          checked ? 'bg-navy-primary border-navy-primary' : 'bg-subtle'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block transform rounded-full bg-surface shadow-sm transition-transform duration-normal ease-in-out ${
            s.thumb
          } ${checked ? s.on : s.off}`}
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-main select-none cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
