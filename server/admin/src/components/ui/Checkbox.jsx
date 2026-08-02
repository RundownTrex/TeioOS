import React, { forwardRef, useId } from 'react';

/**
 * Accessible checkbox with label, optional description and indeterminate state.
 * Props: id, name, label, checked, onChange, indeterminate, isDisabled,
 *        description, className.
 */
export const Checkbox = forwardRef(
  (
    {
      id,
      name,
      label,
      checked = false,
      onChange,
      indeterminate = false,
      isDisabled = false,
      description,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;
    const descriptionId = description ? `${checkboxId}-description` : undefined;

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <span className="inline-flex mt-2">
          <input
            ref={ref}
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={isDisabled}
            aria-checked={indeterminate ? 'mixed' : checked}
            aria-describedby={descriptionId}
            className="h-4 w-4 rounded accent-navy-primary disabled:opacity-60 disabled:cursor-not-allowed"
            {...props}
          />
        </span>

        {(label || description) && (
          <span className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm text-text-main font-medium select-none cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <span id={descriptionId} className="text-xs text-text-muted mt-0.5">
                {description}
              </span>
            )}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
