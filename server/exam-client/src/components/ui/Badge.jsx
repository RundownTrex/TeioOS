import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    success: 'bg-status-answered-bg text-status-answered border-status-answered',
    warning: 'bg-status-unanswered-bg text-status-unanswered border-status-unanswered',
    purple:  'bg-status-review-bg text-status-review border-status-review',
    info:    'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    neutral: 'bg-subtle text-text-main border-border-main',
    danger:  'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center justify-center border rounded-full font-bold uppercase tracking-wider select-none leading-none ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
