import React from 'react';

export const QuestionLegend = ({ className = '' }) => {
  const legendItems = [
    { key: 'ANSWERED', label: 'Answered', icon: '✓', colorClass: 'bg-green-100 text-green-900 border-green-500' },
    { key: 'UNANSWERED', label: 'Unanswered', icon: '!', colorClass: 'bg-amber-100 text-amber-900 border-amber-500' },
    { key: 'REVIEW', label: 'Review', icon: '*', colorClass: 'bg-purple-100 text-purple-900 border-purple-500' },
    { key: 'UNVISITED', label: 'Unvisited', icon: '', colorClass: 'bg-subtle text-text-muted border-border-main' },
  ];

  return (
    <div
      role="region"
      aria-label="Question palette status legend"
      className={`pt-3 border-t border-border-main text-xs select-none ${className}`}
    >
      <span className="font-bold text-text-main block mb-2 uppercase tracking-wider text-[11px]">
        Status Legend:
      </span>
      <div className="grid grid-cols-2 gap-2">
        {legendItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded border text-[10px] font-bold flex items-center justify-center shrink-0 ${item.colorClass}`}
              aria-hidden="true"
            >
              {item.icon || ' '}
            </span>
            <span className="text-text-muted font-medium truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionLegend;
