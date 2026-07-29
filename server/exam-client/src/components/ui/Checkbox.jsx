import React from 'react';
import { Check } from 'lucide-react';

export const Checkbox = ({
  id,
  name,
  label,
  checked = false,
  onChange,
  isDisabled = false,
  isRequired = false,
  error,
  className = '',
  ...props
}) => {
  const checkboxId = id || (name ? `checkbox-${name}` : undefined);
  const errorId = checkboxId ? `${checkboxId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-start gap-3 select-none text-sm text-text-main ${
          isDisabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
          {/* Native checkbox — visible custom indicator handled via CSS peer */}
          <input
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={isDisabled}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="peer sr-only"
            {...props}
          />
          {/* Custom visual indicator — clicks bubble to native input via label */}
          <div
            aria-hidden="true"
            className={`w-5 h-5 border rounded transition-all duration-normal ease-in-out flex items-center justify-center
              peer-focus-visible:ring-2 peer-focus-visible:ring-navy-primary peer-focus-visible:ring-offset-2
              ${checked
                ? 'bg-navy-primary border-navy-primary text-text-inverse'
                : 'bg-surface border-border-strong hover:border-text-main'
              }
              ${error ? 'border-red-600' : ''}
              ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {checked && (
              <Check className="w-3.5 h-3.5 stroke-[3] text-white shrink-0" aria-hidden="true" />
            )}
          </div>
        </div>

        {label && (
          <label
            htmlFor={checkboxId}
            className={`leading-snug font-medium ${
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {label}
            {isRequired && (
              <span className="text-red-600 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-medium pl-8">
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
