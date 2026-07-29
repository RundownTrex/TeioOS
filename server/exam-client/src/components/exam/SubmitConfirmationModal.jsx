import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';

export const SubmitConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions = 0,
  answeredCount = 0,
  flaggedCount = 0,
  isSubmitting = false,
}) => {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Exam Submission"
      ariaDescribedBy="submit-modal-description"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" aria-hidden="true" />
          <p id="submit-modal-description" className="text-sm">
            Are you sure you want to finalize and submit your examination? Once submitted, you will not be able to change your answers.
          </p>
        </div>

        {/* Summary Table */}
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between text-gray-700 dark:text-slate-300">
            <span>Total Questions:</span>
            <span className="font-bold">{totalQuestions}</span>
          </div>
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
            <span>Answered Questions:</span>
            <span>{answeredCount}</span>
          </div>
          <div className="flex justify-between text-red-600 dark:text-red-400">
            <span>Unanswered Questions:</span>
            <span className="font-bold">{unansweredCount}</span>
          </div>
          <div className="flex justify-between text-amber-600 dark:text-amber-400">
            <span>Flagged for Review:</span>
            <span>{flaggedCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Return to Exam
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isSubmitting}>
            Submit Final Answers
          </Button>
        </div>
      </div>
    </Modal>
  );
};
