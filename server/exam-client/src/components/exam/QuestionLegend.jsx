import React from 'react';
import { Check, Bookmark, AlertCircle, HelpCircle } from 'lucide-react';

export const QuestionLegend = ({
  counts = {},
  activeFilter = 'ALL',
  onFilterChange,
  className = '',
}) => {
  const legendItems = [
    {
      key: 'ANSWERED',
      label: 'Answered',
      icon: <Check className="w-3 h-3 stroke-[3]" style={{ color: 'var(--color-status-answered)' }} />,
    },
    {
      key: 'UNANSWERED',
      label: 'Unanswered',
      icon: <AlertCircle className="w-3 h-3 stroke-[3]" style={{ color: 'var(--color-status-unanswered)' }} />,
    },
    {
      key: 'REVIEW',
      label: 'Review',
      icon: <Bookmark className="w-3 h-3" style={{ color: 'var(--color-status-review)', fill: 'var(--color-status-review)' }} />,
    },
    {
      key: 'UNVISITED',
      label: 'Unvisited',
      icon: <HelpCircle className="w-3 h-3" style={{ color: 'var(--color-status-unvisited)' }} />,
    },
  ];

  return (
    <div
      role="region"
      aria-label="Question palette status legend"
      className={`text-xs select-none ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-text-main uppercase tracking-wider text-xs">
          Legend
        </span>
        {activeFilter !== 'ALL' && onFilterChange && (
          <button
            type="button"
            onClick={() => onFilterChange('ALL')}
            className="text-xs font-semibold text-navy-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy-primary rounded px-1"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {legendItems.map((item) => {
          const count = counts[item.key] ?? 0;
          const isSelected = activeFilter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilterChange && onFilterChange(isSelected ? 'ALL' : item.key)}
              title={`Filter: ${item.label} (${count})`}
              aria-label={`Filter by ${item.label}: ${count} questions`}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md text-left transition-colors duration-fast cursor-pointer text-xs ${
                isSelected
                  ? 'bg-navy-primary/10 text-navy-primary font-bold'
                  : 'hover:bg-subtle text-text-muted'
              }`}
            >
              <span className="shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <span className="font-medium truncate flex-1">{item.label}</span>
              <span className="ml-auto font-mono font-bold shrink-0">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionLegend;
