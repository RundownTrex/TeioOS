import React from 'react';

export const Spinner = ({ size = 'md', label = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div role="status" className={`inline-flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-current border-t-transparent text-navy-primary dark:text-sky-400 ${sizeClasses[size] || sizeClasses.md}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
