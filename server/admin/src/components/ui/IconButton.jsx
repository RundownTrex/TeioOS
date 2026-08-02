import React, { forwardRef } from 'react';

/**
 * Square icon-only action button.
 * Props: label (required aria-label), icon (React node), size ('sm'|'md'|'lg'),
 *        variant ('ghost'|'outline'|'solid'), type, isDisabled, onClick, className.
 */
export const IconButton = forwardRef(
  (
    {
      label,
      icon,
      size = 'md',
      variant = 'ghost',
      type = 'button',
      isDisabled = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    if (!label) {
      if (import.meta.env.DEV) {
        console.warn('IconButton: a `label` prop (aria-label) is required.');
      }
      return null;
    }

    const variants = {
      ghost: 'text-text-muted hover:text-text-main hover:bg-subtle',
      outline: 'border border-border-strong text-text-main hover:bg-subtle',
      solid: 'bg-navy-primary hover:bg-navy-hover active:bg-navy-active text-text-inverse shadow-xs',
    };

    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        disabled={isDisabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-lg transition-all duration-normal ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none shrink-0 ${variants[variant] || variants.ghost} ${sizes[size] || sizes.md} ${className}`}
        {...props}
      >
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
