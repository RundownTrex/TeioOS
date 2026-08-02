import React from 'react';

/**
 * Status pill badge with optional leading dot.
 * Props: variant ('neutral'|'success'|'warning'|'danger'|'info'|'purple'),
 *        size ('sm'|'md'), dot (boolean), className.
 */
export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    success: 'bg-status-success-bg text-status-success border-status-success-border',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    purple:  'bg-status-review-bg text-status-review border-status-review-border',
    info:    'bg-status-info-bg text-status-info border-status-info-border',
    neutral: 'bg-status-neutral-bg text-status-neutral border-status-neutral-border',
    danger:  'bg-status-danger-bg text-status-danger border-status-danger-border',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-bold uppercase tracking-wider select-none leading-none ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
