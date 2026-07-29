import React from 'react';

export const Progress = ({
  value = 0,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-text-muted">
          {label && <span>{label}</span>}
          {showValue && <span>{percentage}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress bar'}
        className={`w-full bg-subtle rounded-full overflow-hidden border border-border-main ${
          sizes[size] || sizes.md
        }`}
      >
        <div
          style={{ width: `${percentage}%` }}
          className="h-full bg-navy-primary transition-all duration-300 ease-out rounded-full"
        />
      </div>
    </div>
  );
};

export default Progress;
