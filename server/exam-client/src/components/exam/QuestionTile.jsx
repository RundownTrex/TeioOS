import React from 'react';
import { Check, Bookmark, AlertCircle } from 'lucide-react';

export const QuestionTile = ({
  index = 0,
  status = 'UNVISITED',
  isActive = false,
  onClick,
  onKeyDown,
  isDisabled = false,
  className = '',
  ...rest
}) => {
  const displayNum = String(index + 1).padStart(2, '0');

  const statusStyles = {
    ANSWERED:
      'bg-status-answered-bg text-status-answered border-status-answered font-bold hover:brightness-95 shadow-xs',
    UNANSWERED:
      'bg-status-unanswered-bg text-status-unanswered border-status-unanswered font-bold hover:brightness-95 shadow-xs',
    REVIEW:
      'bg-status-review-bg text-status-review border-status-review font-bold hover:brightness-95 shadow-xs',
    UNVISITED:
      'bg-status-unvisited-bg text-status-unvisited border-border-main hover:border-border-strong hover:bg-subtle',
  };

  const ariaStatusLabels = {
    ANSWERED: 'Answered',
    UNANSWERED: 'Unanswered',
    REVIEW: 'Marked for review',
    UNVISITED: 'Unvisited',
  };

  const renderBadgeIcon = () => {
    switch (status) {
      case 'ANSWERED':
        return <Check className="w-2.5 h-2.5 stroke-[3]" style={{ color: 'var(--color-status-answered)' }} aria-hidden="true" />;
      case 'REVIEW':
        return <Bookmark className="w-2.5 h-2.5" style={{ color: 'var(--color-status-review)', fill: 'var(--color-status-review)' }} aria-hidden="true" />;
      case 'UNANSWERED':
        return <AlertCircle className="w-2.5 h-2.5 stroke-[3]" style={{ color: 'var(--color-status-unanswered)' }} aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      role="gridcell"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={isDisabled}
      tabIndex={isActive ? 0 : -1}
      title={`Question ${index + 1} (${ariaStatusLabels[status] || 'Unvisited'})`}
      aria-label={`Question ${index + 1}: ${ariaStatusLabels[status] || 'Unvisited'}${isActive ? ', Currently selected' : ''}`}
      aria-selected={isActive ? 'true' : 'false'}
      aria-current={isActive ? 'true' : undefined}
      {...rest}
      className={`relative w-10 h-10 rounded-lg border-2 flex items-center justify-center font-mono text-xs font-bold transition-all duration-fast ease-in-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 active:scale-95 ${
        statusStyles[status] || statusStyles.UNVISITED
      } ${
        isActive
          ? 'ring-2 ring-navy-primary ring-offset-1 ring-offset-surface border-navy-primary shadow-md scale-105'
          : 'hover:shadow-sm hover:-translate-y-px'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="leading-none">{displayNum}</span>

      {/* Status badge icon — top-right corner */}
      {status !== 'UNVISITED' && (
        <span className="absolute -top-1.5 -right-1.5 bg-surface border border-border-main rounded-full w-4 h-4 shadow-xs flex items-center justify-center">
          {renderBadgeIcon()}
        </span>
      )}
    </button>
  );
};

export default QuestionTile;
