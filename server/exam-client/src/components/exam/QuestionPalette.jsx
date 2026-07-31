import React, { useRef } from 'react';
import { QuestionTile } from './QuestionTile';
import { QuestionLegend } from './QuestionLegend';
import { SubmitButton } from './SubmitButton';

export const QuestionPalette = ({
  totalQuestions = 1,
  currentIndex = 0,
  answersMap = {},
  flaggedSet = new Set(),
  visitedSet = new Set(),
  onSelectQuestion,
  onSubmitExam,
  isDisabled = false,
  isSubmitting = false,
  className = '',
}) => {
  const gridRef = useRef(null);

  const getQuestionStatus = (idx) => {
    const isFlagged = flaggedSet.has(idx);
    const hasAnswer = Boolean(answersMap[idx]);
    const isVisited = visitedSet.has(idx);

    if (isFlagged) return 'REVIEW';
    if (hasAnswer) return 'ANSWERED';
    if (isVisited) return 'UNANSWERED';
    return 'UNVISITED';
  };

  // Keyboard Arrow Grid Navigation Handler (5-column layout)
  const handleGridKeyDown = (e, idx) => {
    const COLS = 5;
    let nextIdx = idx;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = Math.min(totalQuestions - 1, idx + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = Math.max(0, idx - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = Math.min(totalQuestions - 1, idx + COLS);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = Math.max(0, idx - COLS);
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = totalQuestions - 1;
    }

    if (nextIdx !== idx) {
      if (onSelectQuestion) onSelectQuestion(nextIdx);
      const targetBtn = gridRef.current?.querySelectorAll('button')[nextIdx];
      if (targetBtn) targetBtn.focus();
    }
  };

  const tiles = Array.from({ length: totalQuestions });

  return (
    <div className={`flex flex-col h-full justify-between select-none ${className}`}>
      {/* Palette Title Header */}
      <div>
        <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-3 pb-2 border-b border-border-main">
          QUESTION PALETTE
        </h3>

        {/* 5-Column Grid Tiles Container */}
        <div
          id="palette-grid-container"
          ref={gridRef}
          role="grid"
          aria-label="Question palette grid"
          className="grid grid-cols-5 gap-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1 py-1 focus-visible:outline-none"
        >
          {tiles.map((_, idx) => (
            <QuestionTile
              key={idx}
              index={idx}
              status={getQuestionStatus(idx)}
              isActive={currentIndex === idx}
              onClick={() => onSelectQuestion && onSelectQuestion(idx)}
              onKeyDown={(e) => handleGridKeyDown(e, idx)}
              isDisabled={isDisabled}
            />
          ))}
        </div>
      </div>

      {/* Palette Footer: Legend & Fixed Submit CTA */}
      <div className="mt-4 flex flex-col gap-3">
        <QuestionLegend />

        <SubmitButton
          onSubmit={onSubmitExam}
          isDisabled={isDisabled}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default QuestionPalette;
