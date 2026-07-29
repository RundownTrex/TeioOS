import React from 'react';

export const MarksBadge = ({
  marks = 1,
  negativeMarks = 0,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-navy-primary text-text-inverse">
        [{marks} {marks === 1 ? 'Mark' : 'Marks'}]
      </span>
      {negativeMarks > 0 ? (
        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
          [Neg: -{negativeMarks}]
        </span>
      ) : (
        <span className="px-2 py-1 text-xs font-medium rounded bg-subtle text-text-muted border border-border-main">
          [No Neg]
        </span>
      )}
    </div>
  );
};

export default MarksBadge;
