import React from 'react';

export const QuestionTile = ({
  index = 0,
  status = 'UNVISITED',
  isActive = false,
  onClick,
  onKeyDown,
  isDisabled = false,
  className = '',
}) => {
  const displayNum = String(index + 1).padStart(2, '0');

  const statusStyles = {
    ANSWERED:
      'bg-green-50 text-green-900 border-green-500 font-bold hover:bg-green-100',
    UNANSWERED:
      'bg-amber-50 text-amber-900 border-amber-500 font-bold hover:bg-amber-100',
    REVIEW:
      'bg-purple-50 text-purple-900 border-purple-500 font-bold hover:bg-purple-100',
    UNVISITED:
      'bg-subtle text-text-muted border-border-main hover:border-border-strong hover:bg-surface',
  };

  const statusIcons = {
    ANSWERED: '✓',
    UNANSWERED: '!',
    REVIEW: '*',
    UNVISITED: '',
  };

  const ariaStatusLabels = {
    ANSWERED: 'Answered',
    UNANSWERED: 'Unanswered',
    REVIEW: 'Marked for review',
    UNVISITED: 'Unvisited',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={isDisabled}
      aria-label={`Question ${index + 1}: ${ariaStatusLabels[status] || 'Unvisited'}${isActive ? ', Currently selected' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center font-mono text-xs transition-all duration-normal ease-in-out active:scale-95 select-none relative ${
        statusStyles[status] || statusStyles.UNVISITED
      } ${
        isActive
          ? 'ring-2 ring-navy-primary ring-offset-1 border-navy-primary font-extrabold shadow-xs'
          : ''
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="leading-none">{displayNum}</span>
      {statusIcons[status] && (
        <span className="text-[9px] font-black leading-none mt-0.5" aria-hidden="true">
          {statusIcons[status]}
        </span>
      )}
    </button>
  );
};

export default QuestionTile;
