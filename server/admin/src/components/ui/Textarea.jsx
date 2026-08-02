import React, { forwardRef, useId } from 'react';

/**
 * Multiline text input with label, helper text and error wiring.
 * Props: id, name, label, value, onChange, placeholder, rows, error, helperText,
 *        isRequired, isDisabled, showCount, maxLength, autoFocus, className.
 */
export const Textarea = forwardRef(
  (
    {
      id,
      name,
      label,
      value,
      onChange,
      placeholder,
      rows = 4,
      error,
      helperText,
      isRequired = false,
      isDisabled = false,
      showCount = false,
      maxLength,
      autoFocus = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `textarea-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const count = typeof value === 'string' ? value.length : 0;

    const describedBy = [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={inputId} className="text-sm font-medium text-text-main">
              {label}
              {isRequired && <span className="text-status-danger ml-1" aria-hidden="true">*</span>}
            </label>
            {showCount && maxLength && (
              <span className="text-xs text-text-muted tabular-nums">
                {count}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={isDisabled}
          required={isRequired}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full px-3.5 py-2.5 text-sm bg-surface text-text-main border rounded-lg resize-y transition-all duration-normal ease-in-out focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed ${
            error
              ? 'border-status-danger focus:border-status-danger focus:ring-2 focus:ring-status-danger'
              : 'border-border-main hover:border-border-strong focus:border-navy-primary focus:ring-2 focus:ring-navy-tint'
          }`}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

export default Textarea;
