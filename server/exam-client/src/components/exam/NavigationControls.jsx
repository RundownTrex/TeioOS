import React from 'react';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Bookmark, RotateCcw } from 'lucide-react';

export const NavigationControls = ({
  onPrevious,
  onSaveNext,
  onClear,
  onClearResponse,
  onToggleReview,
  onToggleMarkReview,
  hasPrevious = true,
  hasNext = true,
  isReview = false,
  isMarkedForReview = false,
  isSaving = false,
  isDisabled = false,
  className = '',
}) => {
  const handleClear = onClear || onClearResponse;
  const handleToggle = onToggleReview || onToggleMarkReview;
  const isFlagged = isReview || isMarkedForReview;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-main select-none ${className}`}>
      {/* Left Navigation: Previous */}
      <Button
        variant="outline"
        onClick={onPrevious}
        isDisabled={!hasPrevious || isDisabled}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
        ariaLabel="Previous Question (Keyboard shortcut Alt+P)"
      >
        Previous
        <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono text-text-muted">Alt+P</kbd>
      </Button>

      {/* Center Actions: Clear & Mark for Review */}
      <div className="flex items-center gap-2">
        {handleClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            isDisabled={isDisabled}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            ariaLabel="Clear Choice (Keyboard shortcut Alt+C)"
          >
            Clear Choice
            <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono text-text-muted">Alt+C</kbd>
          </Button>
        )}

        {handleToggle && (
          <Button
            variant={isFlagged ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleToggle}
            isDisabled={isDisabled}
            leftIcon={<Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-purple-700' : ''}`} />}
            ariaLabel="Mark for Review (Keyboard shortcut Alt+M)"
          >
            {isFlagged ? 'Marked' : 'Mark for Review'}
            <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono text-text-muted">Alt+M</kbd>
          </Button>
        )}
      </div>

      {/* Right Navigation: Save & Next */}
      <Button
        variant="primary"
        onClick={onSaveNext}
        isLoading={isSaving}
        isDisabled={!hasNext || isDisabled}
        rightIcon={<ChevronRight className="w-4 h-4" />}
        ariaLabel="Save response and proceed to Next Question (Keyboard shortcut Alt+N)"
      >
        Save & Next
        <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono text-text-inverse/70">Alt+N</kbd>
      </Button>
    </div>
  );
};

export default NavigationControls;
