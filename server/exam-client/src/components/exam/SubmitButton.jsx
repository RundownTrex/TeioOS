import React from 'react';
import { Button } from '../ui/Button';
import { Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SubmitButton = ({
  onSubmit,
  isDisabled = false,
  isLoading = false,
  answeredCount = 0,
  totalQuestions = 0,
  className = '',
}) => {
  const isFullyAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Readiness indicator */}
      {totalQuestions > 0 && (
        <div className="flex items-center justify-between text-xs text-text-muted px-0.5">
          <span className="flex items-center gap-1 font-medium">
            {isFullyAnswered ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-status-answered)' }} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-status-unanswered)' }} />
            )}
            {isFullyAnswered
              ? 'All questions answered'
              : `${unansweredCount} question${unansweredCount > 1 ? 's' : ''} left`}
          </span>
          <span className="font-mono font-bold text-text-main">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onSubmit}
        isDisabled={isDisabled}
        isLoading={isLoading}
        leftIcon={<Send className="w-4 h-4" />}
        ariaLabel="Submit Examination Paper (Final Submission)"
        className="font-bold tracking-wide shadow-md"
      >
        SUBMIT EXAMINATION
      </Button>
    </div>
  );
};

export default SubmitButton;
