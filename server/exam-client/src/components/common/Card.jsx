import React from 'react';

export const Card = ({ children, className = '', role, ariaLabel, ...props }) => {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
