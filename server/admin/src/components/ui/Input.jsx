import React, { forwardRef, useId } from 'react';

/**
 * Text input with label, helper text and error wiring.
 * Props: id, name, label, type, value, onChange, placeholder, error, helperText,
 *        isRequired, isDisabled, autoFocus, leftIcon, rightIcon, inputClassName,
 *        ariaLabel, className.
 */
export const Input = forwardRef(
  (
    {
      id,
      name,
      label,
      type = 'text',
      value,
      onChange,
      placeholder,
      error,
      helperText,
      isRequired = false,
      isDisabled = false,
      autoFocus = false,
      leftIcon,
      rightIcon,
      ariaLabel,
      inputClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || (name ? `input-${name}` : `input-${generatedId}`);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-main"
          >
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

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={isDisabled}
            required={isRequired}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full h-10 px-3.5 text-sm bg-surface text-text-main border rounded-lg transition-all duration-normal ease-in-out focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed ${
              error
                ? 'border-status-danger focus:border-status-danger focus:ring-2 focus:ring-status-danger'
                : 'border-border-main hover:border-border-strong focus:border-navy-primary focus:ring-2 focus:ring-navy-tint'
            } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${inputClassName}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-text-muted flex items-center">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
