import React from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { formatNumber } from '../../../utils/formatters';
import { QUESTION_TYPES } from '../../../utils/constants';

/**
 * Read-only preview of a question as students will see it in the exam
 * (docs/frontend/admin-exam-management.md §5.7).
 * The correct option is annotated for the administrator; students never
 * see the annotation.
 */
export const QuestionPreviewModal = ({ question, onClose }) => {
  if (!question) return null;

  const isMCQ = question.question_type === QUESTION_TYPES.MCQ;
  const optionPrefix = (index) => String.fromCharCode(65 + index);

  return (
    <Modal
      open={Boolean(question)}
      onClose={onClose}
      title="Question preview"
      ariaLabel="Question preview"
      size="lg"
      closeOnBackdropClick
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 h-10 text-sm font-medium border border-border-strong text-text-main hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isMCQ ? (
            <Badge variant="info">MCQ</Badge>
          ) : (
            <Badge variant="purple">Descriptive</Badge>
          )}
          <Badge variant="neutral">{formatNumber(question.marks)} mark{question.marks === 1 ? '' : 's'}</Badge>
          {isMCQ && question.negative_marks > 0 && (
            <Badge variant="warning">−{formatNumber(question.negative_marks)} negative</Badge>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
            Question
          </p>
          <p className="text-base text-text-main whitespace-pre-wrap">{question.question_text}</p>
        </div>

        {isMCQ ? (
          <div className="space-y-2" role="radiogroup" aria-label="Options">
            {question.options?.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  option.is_correct
                    ? 'border-emerald-600/60 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-border-main'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border-strong"
                >
                  {option.is_correct && <span className="h-2 w-2 rounded-full bg-status-success" />}
                </span>
                <span className="text-sm text-text-main">
                  <span className="font-semibold">{optionPrefix(index)}.</span> {option.option_text}
                </span>
                {option.is_correct && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-status-success">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-muted uppercase tracking-wide">
              Your answer
            </label>
            <textarea
              aria-label="Sample descriptive answer area"
              rows={4}
              disabled
              placeholder="Students type their answer here…"
              className="w-full rounded-lg border border-border-main bg-subtle px-3 py-2 text-sm text-text-main placeholder:text-text-muted"
            />
            {question.max_characters && (
              <p className="text-xs text-text-muted">
                Maximum {formatNumber(question.max_characters)} characters.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuestionPreviewModal;
