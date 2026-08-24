import React, { useRef } from 'react';

export const RadioGroup = ({
  name,
  label,
  options = [],
  value,
  onChange,
  isDisabled = false,
  error,
  orientation = 'vertical',
  className = '',
}) => {
  const groupId = `radiogroup-${name}`;
  const errorId = `${groupId}-error`;
  const containerRef = useRef(null);

  const handleKeyDown = (e, index) => {
    if (!options.length) return;
    let nextIndex = index;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex !== index && options[nextIndex]) {
      const nextOption = options[nextIndex];
      if (onChange) onChange(nextOption.value);

      const targetInput = containerRef.current?.querySelectorAll('input[type="radio"]')[nextIndex];
      if (targetInput) targetInput.focus();
    }
  };

  return (
    <fieldset
      ref={containerRef}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      className={`border-0 p-0 m-0 flex flex-col gap-2 ${className}`}
    >
      {label && (
        <legend className="text-sm font-semibold text-text-main mb-1.5 p-0">
          {label}
        </legend>
      )}

      <div
        className={`flex ${
          orientation === 'horizontal' ? 'flex-row flex-wrap gap-3' : 'flex-col gap-2.5'
        }`}
      >
        {options.map((option, idx) => {
          const radioId = `${name}-opt-${option.value}`;
          const isChecked = String(value) === String(option.value);

          return (
            <label
              key={option.value}
              htmlFor={radioId}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors duration-normal ease-in-out select-none ${
                isChecked
                  ? 'border-navy-primary bg-navy-primary/5 text-text-main font-medium ring-1 ring-navy-primary'
                  : 'border-border-main hover:border-border-strong bg-surface text-text-main'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  id={radioId}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onChange && onChange(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="peer sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-normal bg-surface peer-focus-visible:ring-2 peer-focus-visible:ring-navy-primary peer-focus-visible:ring-offset-2 ${
                    isChecked ? 'border-navy-primary' : 'border-border-strong'
                  }`}
                >
                  {isChecked && <div className="w-2 h-2 rounded-full bg-navy-primary" />}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm leading-snug">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-text-muted mt-0.5">{option.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-medium mt-1">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default RadioGroup;
