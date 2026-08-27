import React from 'react';
import { MarksBadge } from './MarksBadge';
import { ReviewBadge } from './ReviewBadge';
import { TTSSpeaker } from '../accessibility/TTSSpeaker';

export const QuestionHeader = ({
  currentIndex = 0,
  totalQuestions = 1,
  questionType = 'MCQ',
  marks = 1,
  negativeMarks = 0,
  isMarkedForReview = false,
  questionText = '',
  headingRef = null,
  className = '',
}) => {
  const displayIndex = String(currentIndex + 1).padStart(2, '0');
  const displayTotal = String(totalQuestions).padStart(2, '0');
  const isMcq = questionType === 'MCQ' || questionType === 'OBJECTIVE' || questionType === 'SINGLE_SELECT';
  const typeLabel = isMcq ? 'Multiple Choice' : 'Descriptive Essay';

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-main select-none ${className}`}>
      <div className="flex items-center gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-bold text-text-main uppercase tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
        >
          QUESTION {displayIndex} OF {displayTotal}
        </h2>
        <span className="text-xs font-semibold text-text-muted px-2.5 py-1 rounded bg-subtle border border-border-main">
          {typeLabel}
        </span>
        <ReviewBadge isReview={isMarkedForReview} />
      </div>

      <div className="flex items-center gap-3">
        <TTSSpeaker textToRead={questionText} />
        <MarksBadge marks={marks} negativeMarks={negativeMarks} />
      </div>
    </div>
  );
};

export default QuestionHeader;
