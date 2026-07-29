import React, { forwardRef } from 'react';
import { announceToScreenReader } from '../../utils/ariaAnnounce';

export const TextArea = forwardRef(({
  id,
  name,
  label,
  value = '',
  onChange,
  onPaste,
  placeholder,
  rows = 8,
  error,
  helperText,
  isRequired = false,
  isDisabled = false,
  showWordCount = true,
  maxLength = 2500,
  maxWords,
  className = '',
  ...props
}, ref) => {
  const textAreaId = id || (name ? `textarea-${name}` : undefined);
  const errorId = textAreaId ? `${textAreaId}-error` : undefined;
  const helperId = textAreaId ? `${textAreaId}-helper` : undefined;

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const isNearLimit = maxLength && charCount >= maxLength * 0.85;
  const isAtLimit = maxLength && charCount >= maxLength;

  const handlePaste = (e) => {
    if (onPaste) {
      onPaste(e);
      return;
    }

    const pastedData = e.clipboardData?.getData('text');
    if (pastedData) {
      const pastedWords = pastedData.trim().split(/\s+/).length;
      announceToScreenReader(`Pasted ${pastedWords} words into answer editor.`);
    }
  };

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-text-main uppercase tracking-wider mb-1">
          <label htmlFor={textAreaId} className="flex items-center gap-1">
            <span>{label}</span>
            {isRequired && <span className="text-red-600" aria-hidden="true">*</span>}
          </label>

          {showWordCount && (
            <div className="flex items-center gap-3 font-mono font-medium lowercase text-xs">
              <span className="text-navy-primary font-bold">{wordCount} words</span>
              {maxLength && (
                <span
                  className={`${
                    isAtLimit
                      ? 'text-red-600 font-bold'
                      : isNearLimit
                      ? 'text-amber-600 font-bold'
                      : 'text-text-muted'
                  }`}
                  aria-live="polite"
                >
                  ({charCount.toLocaleString()} / {maxLength.toLocaleString()} chars)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <textarea
        ref={ref}
        id={textAreaId}
        name={name}
        value={value}
        onChange={onChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        disabled={isDisabled}
        required={isRequired}
        aria-required={isRequired}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-label={label || 'Descriptive answer input'}
        className={`w-full px-4 py-3 text-base bg-surface text-text-main border rounded-xl font-sans leading-relaxed transition-all duration-normal ease-in-out focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed ${
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
            : isAtLimit
            ? 'border-red-500 ring-1 ring-red-500'
            : 'border-border-main hover:border-border-strong focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20'
        }`}
        {...props}
      />

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
});

TextArea.displayName = 'TextArea';

export default TextArea;
