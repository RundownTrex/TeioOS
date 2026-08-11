import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  FileText,
  HelpCircle,
  User,
  BookOpen,
} from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { evaluationApi } from '../api/evaluationApi';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-3';

/**
 * Manual Evaluation Workbench Page
 * Provides evaluators with a distraction-free, high-readability environment
 * to evaluate descriptive student submissions.
 *
 * Features:
 * - Pending student candidate navigation (Previous / Next Student)
 * - Question navigator sidebar (MCQ read-only vs Descriptive)
 * - Display Question text and Maximum Marks
 * - Display Student Answer text
 * - Award Marks input (0 <= awarded_marks <= max_marks)
 * - Evaluator Remarks textarea
 * - Save Evaluation per question & Publish Final Result
 */
export const EvaluationWorkbenchPage = () => {
  const navigate = useNavigate();
  const { studentExamId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [awardedMarksInput, setAwardedMarksInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [formError, setFormError] = useState(null);

  // Pending queue query (for Previous / Next student navigation)
  const pendingQuery = useQuery({
    queryKey: queryKeys.evaluation.pendingList,
    queryFn: ({ signal }) => evaluationApi.getPendingList({ limit: 50, signal }),
  });

  // Session answers query (for student_exam_id)
  const answersQuery = useQuery({
    queryKey: queryKeys.evaluation.sessionAnswers(studentExamId),
    queryFn: ({ signal }) => evaluationApi.getSessionAnswers(studentExamId, { signal }),
  });

  const pendingList = useMemo(() => {
    const raw = pendingQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [pendingQuery.data]);

  const currentPendingIndex = pendingList.findIndex((item) => item.id === studentExamId);
  const currentStudentMeta = currentPendingIndex >= 0 ? pendingList[currentPendingIndex] : null;

  const prevStudent = currentPendingIndex > 0 ? pendingList[currentPendingIndex - 1] : null;
  const nextStudent =
    currentPendingIndex >= 0 && currentPendingIndex < pendingList.length - 1
      ? pendingList[currentPendingIndex + 1]
      : null;

  const answers = answersQuery.data ?? [];

  // Sort answers by question.display_order or question created order
  const sortedAnswers = useMemo(() => {
    return answers.slice().sort((a, b) => {
      const orderA = a.question?.display_order ?? 0;
      const orderB = b.question?.display_order ?? 0;
      return orderA - orderB;
    });
  }, [answers]);

  const activeAnswer = sortedAnswers[activeQuestionIndex] ?? null;
  const activeQuestion = activeAnswer?.question ?? null;
  const isDescriptive = activeQuestion?.question_type === 'DESCRIPTIVE';

  // Load existing awarded marks & remarks when switching active question
  useEffect(() => {
    if (activeAnswer && isDescriptive) {
      setAwardedMarksInput(
        activeAnswer.awarded_marks !== null && activeAnswer.awarded_marks !== undefined
          ? String(activeAnswer.awarded_marks)
          : ''
      );
      setRemarksInput(activeAnswer.evaluator_feedback ?? '');
      setFormError(null);
    }
  }, [activeQuestionIndex, activeAnswer, isDescriptive]);

  // Mutations
  const evaluateMutation = useMutation({
    mutationFn: ({ answerId, data }) => evaluationApi.evaluateAnswer(answerId, data),
    onSuccess: () => {
      toast('Evaluation saved successfully', { type: 'success' });
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluation.sessionAnswers(studentExamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluation.pendingList });
    },
    onError: (error) => {
      setFormError(error?.message || 'Failed to save evaluation.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => evaluationApi.publishResult(studentExamId),
    onSuccess: () => {
      toast('Final evaluation published successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluation.pendingList });
      if (nextStudent) {
        navigate(PATHS.evaluationWorkbench(nextStudent.id));
      } else {
        navigate(PATHS.EVALUATION);
      }
    },
    onError: (error) => {
      toast(error?.message || 'Failed to publish final result.', { type: 'error' });
    },
  });

  if (answersQuery.isLoading || pendingQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (answersQuery.isError || !activeAnswer) {
    return (
      <ErrorState
        title="Session not found"
        message="The examination submission could not be loaded or contains no answers."
        retryLabel="Back to Evaluation Queue"
        onRetry={() => navigate(PATHS.EVALUATION)}
      />
    );
  }

  const allDescriptiveEvaluated = sortedAnswers
    .filter((a) => a.question?.question_type === 'DESCRIPTIVE')
    .every((a) => a.awarded_marks !== null && a.awarded_marks !== undefined);

  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!activeAnswer || !isDescriptive) return;

    if (awardedMarksInput.trim() === '') {
      setFormError('Please enter awarded marks.');
      return;
    }

    const marks = Number(awardedMarksInput);
    const maxMarks = activeQuestion?.marks ?? 0;

    if (Number.isNaN(marks) || marks < 0 || marks > maxMarks) {
      setFormError(`Awarded marks must be a valid number between 0 and ${maxMarks}.`);
      return;
    }

    evaluateMutation.mutate({
      answerId: activeAnswer.id,
      data: {
        awarded_marks: marks,
        evaluator_feedback: remarksInput.trim() || null,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Header & Navigation Bar */}
      <div>
        <Link to={PATHS.EVALUATION} className={BACK_LINK}>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to Evaluation Queue
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-main shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-primary/10 flex items-center justify-center text-navy-primary font-bold">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-main">
                {currentStudentMeta?.studentName ?? 'Student Candidate'}
              </h2>
              <p className="text-xs text-text-muted">
                Roll No: <span className="font-mono font-medium">{currentStudentMeta?.rollNumber ?? '—'}</span> · Subject:{' '}
                <span className="font-medium text-navy-primary">{currentStudentMeta?.subjectName ?? '—'}</span>
              </p>
            </div>
          </div>

          {/* Candidate Navigation (Previous / Next Student) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              isDisabled={!prevStudent}
              onClick={() => prevStudent && navigate(PATHS.evaluationWorkbench(prevStudent.id))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              Previous Student
            </Button>

            {currentPendingIndex >= 0 && (
              <span className="text-xs font-semibold text-text-muted px-2">
                Candidate {currentPendingIndex + 1} of {pendingList.length}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              isDisabled={!nextStudent}
              onClick={() => nextStudent && navigate(PATHS.evaluationWorkbench(nextStudent.id))}
            >
              Next Student
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>

            {allDescriptiveEvaluated && (
              <Button
                variant="primary"
                size="sm"
                isLoading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                <Send className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Publish Result
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Focus Mode Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        {/* Sidebar: Questions Navigator */}
        <Card className="md:col-span-1">
          <CardHeader className="px-4 py-3 border-b border-border-main">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-primary">
              Questions ({sortedAnswers.length})
            </h3>
          </CardHeader>
          <CardBody className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
            {sortedAnswers.map((answer, index) => {
              const q = answer.question;
              const isSelected = index === activeQuestionIndex;
              const isMcq = q?.question_type === 'MCQ';
              const isEvaluated =
                isMcq || (answer.awarded_marks !== null && answer.awarded_marks !== undefined);

              return (
                <button
                  key={answer.id}
                  type="button"
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary ${
                    isSelected
                      ? 'bg-navy-primary text-white font-bold shadow-xs'
                      : 'hover:bg-subtle text-text-main border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-subtle flex items-center justify-center font-mono text-[11px] shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate">Q{index + 1} ({q?.question_type ?? 'Q'})</span>
                  </div>
                  {isEvaluated ? (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-status-success'}`}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Pending evaluation" />
                  )}
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Main Canvas: Question, Student Answer, and Evaluator Panel */}
        <div className="md:col-span-3 space-y-5">
          {/* Question Card */}
          <Card>
            <CardHeader className="flex items-center justify-between px-5 py-4 border-b border-border-main bg-subtle/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-navy-primary uppercase tracking-wider">
                  Question {activeQuestionIndex + 1} of {sortedAnswers.length}
                </span>
                <Badge variant={isDescriptive ? 'amber' : 'purple'}>
                  {activeQuestion?.question_type ?? 'QUESTION'}
                </Badge>
              </div>
              <Badge variant="info" className="text-xs font-bold">
                Max Marks: {activeQuestion?.marks} pts
              </Badge>
            </CardHeader>
            <CardBody className="p-5">
              <p className="text-base font-medium text-text-main leading-relaxed">
                {activeQuestion?.question_text || 'No question text available.'}
              </p>
            </CardBody>
          </Card>

          {/* Student Answer Display Card */}
          <Card>
            <CardHeader className="px-5 py-3 border-b border-border-main bg-subtle/30 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Student Candidate Response
              </span>
              <span className="text-xs text-text-muted">
                Submitted: {activeAnswer.answered_at ? new Date(activeAnswer.answered_at).toLocaleTimeString() : '—'}
              </span>
            </CardHeader>
            <CardBody className="p-5">
              {!isDescriptive ? (
                /* Read-Only MCQ Score Card */
                <div className="p-4 rounded-lg bg-subtle border border-border-main space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-main">
                      Automated MCQ Evaluation (Read-Only)
                    </span>
                    <Badge variant="success">
                      Score: {activeAnswer.awarded_marks ?? 0.0} / {activeQuestion?.marks} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    MCQ answers are graded automatically by the examination engine and do not require manual scoring.
                  </p>
                </div>
              ) : (
                /* High-Readability Descriptive Student Answer Text Box */
                <div className="space-y-2">
                  <div className="p-5 rounded-xl bg-subtle/60 border border-border-main font-sans text-base leading-relaxed text-text-main whitespace-pre-wrap min-h-[160px] select-text">
                    {activeAnswer.answer_text ? (
                      activeAnswer.answer_text
                    ) : (
                      <em className="text-text-muted font-sans text-sm">No text response provided by student.</em>
                    )}
                  </div>
                  {activeAnswer.answer_text && (
                    <p className="text-xs text-text-muted text-right">
                      Character count: {activeAnswer.answer_text.length} characters
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Descriptive Answer Evaluation Card */}
          {isDescriptive && (
            <Card className="border-2 border-navy-primary/20">
              <form onSubmit={handleSaveEvaluation}>
                <CardHeader className="px-5 py-4 border-b border-border-main bg-navy-primary/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-primary uppercase tracking-wider">
                    Manual Evaluation & Scoring
                  </h3>
                  {activeAnswer.awarded_marks !== null && activeAnswer.awarded_marks !== undefined && (
                    <Badge variant="success" dot>
                      Evaluated ({activeAnswer.awarded_marks} / {activeQuestion?.marks} pts)
                    </Badge>
                  )}
                </CardHeader>

                <CardBody className="p-5 space-y-4">
                  {formError && <Alert variant="error">{formError}</Alert>}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="awarded_marks"
                      name="awarded_marks"
                      label={`Award Marks (Out of ${activeQuestion?.marks ?? 0} pts)`}
                      type="number"
                      min="0"
                      max={activeQuestion?.marks}
                      step="0.5"
                      value={awardedMarksInput}
                      onChange={(e) => setAwardedMarksInput(e.target.value)}
                      placeholder={`0.0 to ${activeQuestion?.marks ?? 0}`}
                      error={formError ? true : false}
                      isRequired
                      autoFocus
                    />

                    <div className="p-3 rounded-lg bg-subtle border border-border-main space-y-1 text-xs text-text-muted flex flex-col justify-center">
                      <span className="font-semibold text-text-main">Scoring Guidelines:</span>
                      <p>
                        Award between <strong>0.0</strong> and <strong>{activeQuestion?.marks}</strong> marks based on accuracy, completeness, and clarity.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    id="evaluator_remarks"
                    name="evaluator_remarks"
                    label="Evaluator Remarks & Feedback"
                    rows={3}
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    placeholder="Provide constructive feedback or justification for the awarded score…"
                    helperText="Optional feedback recorded alongside candidate results."
                  />
                </CardBody>

                <CardFooter className="flex items-center justify-between px-5 py-3 bg-subtle/40 border-t border-border-main">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isDisabled={activeQuestionIndex === 0}
                      onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                      Prev Question
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isDisabled={activeQuestionIndex === sortedAnswers.length - 1}
                      onClick={() => setActiveQuestionIndex((prev) => Math.min(sortedAnswers.length - 1, prev + 1))}
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                    </Button>
                  </div>

                  <Button type="submit" variant="primary" isLoading={evaluateMutation.isPending}>
                    <Save className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Save Evaluation
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationWorkbenchPage;
