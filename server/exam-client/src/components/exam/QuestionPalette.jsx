import React, { useRef, useState, useMemo, useCallback } from 'react';
import { QuestionTile } from './QuestionTile';
import { QuestionLegend } from './QuestionLegend';
import { SubmitButton } from './SubmitButton';
import { Layers } from 'lucide-react';

export const QuestionPalette = ({
  totalQuestions = 1,
  currentIndex = 0,
  answersMap = {},
  flaggedSet = new Set(),
  visitedSet = new Set(),
  questions = [],
  onSelectQuestion,
  onSubmitExam,
  isDisabled = false,
  isSubmitting = false,
  className = '',
}) => {
  const gridRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Compute status for each question index
  const getQuestionStatus = useCallback((idx) => {
    if (flaggedSet.has(idx)) return 'REVIEW';
    if (Boolean(answersMap[idx])) return 'ANSWERED';
    if (visitedSet.has(idx)) return 'UNANSWERED';
    return 'UNVISITED';
  }, [answersMap, flaggedSet, visitedSet]);

  // Live statistics
  const statusCounts = useMemo(() => {
    const counts = { ANSWERED: 0, UNANSWERED: 0, REVIEW: 0, UNVISITED: 0 };
    for (let i = 0; i < totalQuestions; i++) {
      counts[getQuestionStatus(i)]++;
    }
    return counts;
  }, [totalQuestions, getQuestionStatus]);

  const answeredCount = statusCounts.ANSWERED;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Filtered question indices
  const visibleIndices = useMemo(() => {
    const indices = [];
    for (let i = 0; i < totalQuestions; i++) {
      if (activeFilter === 'ALL' || getQuestionStatus(i) === activeFilter) {
        indices.push(i);
      }
    }
    return indices;
  }, [totalQuestions, activeFilter, getQuestionStatus]);

  // Keyboard grid navigation (5 columns)
  const handleGridKeyDown = (e, currentIdx) => {
    const COLS = 5;
    const currentPos = visibleIndices.indexOf(currentIdx);
    if (currentPos === -1) return;

    let targetPos = currentPos;
    if (e.key === 'ArrowRight') { e.preventDefault(); targetPos = Math.min(visibleIndices.length - 1, currentPos + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); targetPos = Math.max(0, currentPos - 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); targetPos = Math.min(visibleIndices.length - 1, currentPos + COLS); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); targetPos = Math.max(0, currentPos - COLS); }
    else if (e.key === 'Home') { e.preventDefault(); targetPos = 0; }
    else if (e.key === 'End') { e.preventDefault(); targetPos = visibleIndices.length - 1; }

    if (targetPos !== currentPos) {
      const nextIdx = visibleIndices[targetPos];
      if (onSelectQuestion) onSelectQuestion(nextIdx);
      const buttons = gridRef.current?.querySelectorAll('button[data-question-idx]');
      if (buttons) {
        const targetBtn = Array.from(buttons).find(
          (btn) => btn.getAttribute('data-question-idx') === String(nextIdx)
        );
        if (targetBtn) targetBtn.focus();
      }
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'ANSWERED', label: 'Ans' },
    { id: 'UNANSWERED', label: 'Unans' },
    { id: 'REVIEW', label: 'Rev' },
  ];

  return (
    <div className={`flex flex-col h-full select-none ${className}`}>

      {/* ── HEADER: Title + Progress ── */}
      <div className="shrink-0 pb-2 mb-2 border-b border-border-main">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-navy-primary" aria-hidden="true" />
            Question Palette
          </h3>
          <span className="text-xs font-mono font-bold text-navy-primary">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-navy-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Exam progress: ${answeredCount} of ${totalQuestions} answered (${progressPercent}%)`}
          />
        </div>
        <p className="text-xs text-text-muted mt-1 font-mono">
          {answeredCount}/{totalQuestions} answered · {statusCounts.REVIEW} flagged
        </p>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="shrink-0 flex gap-1 mb-2">
        {filterTabs.map((tab) => {
          const count = tab.id === 'ALL' ? totalQuestions : statusCounts[tab.id] || 0;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors duration-fast text-center cursor-pointer border ${
                isActive
                  ? 'bg-navy-primary text-text-inverse border-navy-primary font-bold'
                  : 'bg-transparent text-text-muted border-transparent hover:bg-subtle hover:text-text-main'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── QUESTION TILE GRID ── */}
      <div
        id="palette-grid-container"
        ref={gridRef}
        role="grid"
        aria-label="Question palette grid"
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {visibleIndices.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 p-1">
            {visibleIndices.map((idx) => (
              <QuestionTile
                key={idx}
                index={idx}
                status={getQuestionStatus(idx)}
                isActive={currentIndex === idx}
                onClick={() => onSelectQuestion && onSelectQuestion(idx)}
                onKeyDown={(e) => handleGridKeyDown(e, idx)}
                isDisabled={isDisabled}
                data-question-idx={idx}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-text-muted bg-subtle/50 rounded-lg border border-dashed border-border-main">
            No questions match "{activeFilter}".
          </div>
        )}
      </div>

      {/* ── FOOTER: Legend + Submit ── */}
      <div className="shrink-0 mt-2 pt-2 border-t border-border-main space-y-2">
        <QuestionLegend
          counts={statusCounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <SubmitButton
          onSubmit={onSubmitExam}
          isDisabled={isDisabled}
          isLoading={isSubmitting}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
        />
      </div>
    </div>
  );
};

export default QuestionPalette;
