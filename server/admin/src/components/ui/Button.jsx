import React from 'react';
import { Spinner } from './Spinner';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  isDisabled = false,
  leftIcon = null,
  rightIcon = null,
  ariaLabel,
  onClick,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-normal ease-in-out active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 whitespace-nowrap';

  const variants = {
    primary:
      'bg-navy-primary hover:bg-navy-hover active:bg-navy-active text-text-inverse shadow-xs border border-transparent',
    secondary:
      'bg-subtle hover:bg-border-main active:bg-border-strong text-text-main border border-border-main',
    outline:
      'border border-border-strong hover:border-navy-primary hover:bg-navy-tint text-text-main',
    danger:
      'bg-btn-danger hover:bg-btn-danger-hover active:bg-btn-danger-active text-text-inverse shadow-xs border border-transparent',
    ghost:
      'hover:bg-subtle text-text-main border border-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      aria-disabled={isDisabled || isLoading}
      aria-busy={isLoading}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="shrink-0" label="Processing..." />
          <span className="inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">{leftIcon}</span>}
          <span className="inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">{children}</span>
          {rightIcon && <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
