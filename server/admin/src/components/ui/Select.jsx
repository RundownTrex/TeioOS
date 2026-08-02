import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Native select styled with design tokens.
 * Props: id, name, label, value, onChange, options ([{ value, label }]),
 *        placeholder, error, helperText, isRequired, isDisabled, leftIcon, className.
 */
export const Select = forwardRef(
  (
    {
      id,
      name,
      label,
      value,
      onChange,
      options = [],
      placeholder,
      error,
      helperText,
      isRequired = false,
      isDisabled = false,
      leftIcon,
      ariaLabel,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy = [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-main">
            {label}
            {isRequired && <span className="text-status-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={isDisabled}
            required={isRequired}
            aria-label={ariaLabel}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full h-10 appearance-none pr-9 text-sm bg-surface text-text-main border rounded-lg transition-all duration-normal ease-in-out focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${
              error
                ? 'border-status-danger focus:border-status-danger focus:ring-2 focus:ring-status-danger'
                : 'border-border-main hover:border-border-strong focus:border-navy-primary focus:ring-2 focus:ring-navy-tint'
            }`}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 text-text-muted pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-status-danger">
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
  }
);

Select.displayName = 'Select';

export default Select;
