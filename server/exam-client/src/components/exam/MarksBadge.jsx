import React from 'react';

export const MarksBadge = ({
  marks = 1,
  negativeMarks = 0,
  className = '',
}) => {
  const label = `${marks} ${marks === 1 ? 'mark' : 'marks'}${
    negativeMarks > 0 ? `, negative ${negativeMarks} marks penalty` : ', no negative marking'
  }`;

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center gap-2 select-none ${className}`}
    >
      <span aria-hidden="true" className="px-2.5 py-1 text-xs font-semibold rounded bg-navy-primary text-text-inverse">
        [{marks} {marks === 1 ? 'Mark' : 'Marks'}]
      </span>
      {negativeMarks > 0 ? (
        <span aria-hidden="true" className="px-2 py-1 text-xs font-medium rounded bg-status-danger-bg text-status-danger border border-status-danger">
          [Neg: -{negativeMarks}]
        </span>
      ) : (
        <span aria-hidden="true" className="px-2 py-1 text-xs font-medium rounded bg-subtle text-text-muted border border-border-main">
          [No Neg]
        </span>
      )}
    </div>
  );
};

export default MarksBadge;
