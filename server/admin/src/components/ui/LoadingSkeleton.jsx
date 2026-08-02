import React from 'react';

/**
 * Placeholder skeleton block for loading states.
 * Props: variant ('text'|'rectangular'|'circular'), width, height, count, className.
 */
export const LoadingSkeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    rectangular: 'h-24 w-full rounded-xl',
    circular: 'h-10 w-10 rounded-full',
  };

  const items = Array.from({ length: count });

  return (
    <div role="status" aria-label="Loading content..." className="space-y-2.5 w-full">
      {items.map((_, index) => (
        <div
          key={index}
          style={{ width, height }}
          className={`animate-pulse bg-subtle border border-border-main ${
            variantClasses[variant] || variantClasses.text
          } ${className}`}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export default LoadingSkeleton;
