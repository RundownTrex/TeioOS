import React from 'react';

export const Input = ({
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
  className = '',
  ...props
}) => {
  const inputId = id || (name ? `input-${name}` : undefined);
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
          className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center justify-between"
        >
          <span>
            {label}
            {isRequired && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          required={isRequired}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full h-10 px-3.5 text-sm bg-surface text-text-main border rounded-lg transition-all duration-normal ease-in-out focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed ${
            error
              ? 'border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
              : 'border-border-main hover:border-border-strong focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20'
          } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-text-muted flex items-center">
            {rightIcon}
          </div>
        )}
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

export default Input;
