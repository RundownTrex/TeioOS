import React from 'react';

export const LoadingSkeleton = ({ count = 3, className = 'h-12 w-full mb-3' }) => {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className="w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 dark:bg-slate-700 rounded-lg ${className}`}
        />
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};
