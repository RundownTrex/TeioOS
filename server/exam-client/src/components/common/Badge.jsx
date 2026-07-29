import React from 'react';

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
};
