import React from 'react';

export const Divider = ({
  orientation = 'horizontal',
  label,
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`h-full w-px bg-border-main self-stretch ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`flex items-center gap-4 my-4 w-full ${className}`}
      >
        <div className="flex-1 h-px bg-border-main" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-px bg-border-main" />
      </div>
    );
  }

  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={`my-4 border-0 h-px bg-border-main w-full ${className}`}
    />
  );
};

export default Divider;
