import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  id,
  name,
  label,
  options = [],
  value,
  onChange,
  error,
  helperText,
  isRequired = false,
  isDisabled = false,
  className = '',
  ...props
}) => {
  const selectId = id || (name ? `select-${name}` : undefined);
  const errorId = selectId ? `${selectId}-error` : undefined;
  const helperId = selectId ? `${selectId}-helper` : undefined;

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-main flex items-center justify-between"
        >
          <span>
            {label}
            {isRequired && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full appearance-none px-3.5 py-2 text-sm bg-surface text-text-main border rounded-md transition-colors pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 disabled:bg-subtle disabled:cursor-not-allowed ${
            error
              ? 'border-red-600 focus:border-red-600'
              : 'border-border-main hover:border-border-strong'
          }`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 text-text-muted pointer-events-none flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;
