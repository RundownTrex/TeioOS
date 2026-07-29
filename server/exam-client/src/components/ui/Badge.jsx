import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    success: 'bg-green-50 text-green-800 border-green-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    purple:  'bg-purple-50 text-purple-900 border-purple-300',
    info:    'bg-blue-50 text-blue-900 border-blue-300',
    neutral: 'bg-subtle text-text-muted border-border-main',
    danger:  'bg-red-50 text-red-900 border-red-300',
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
