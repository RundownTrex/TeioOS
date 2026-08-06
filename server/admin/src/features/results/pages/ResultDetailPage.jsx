import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Send,
  Trash2,
  Award,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react';

import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

import { resultsApi } from '../api/resultsApi';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';
import {
  formatDateTime,
  formatNumber,
  formatPercentage,
} from '../../../utils/formatters';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4 no-print';

const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2.5 border-b border-border-main last:border-0">
    <dt className="text-sm text-text-muted">{label}</dt>
    <dd className="col-span-2 text-sm text-text-main font-medium">{children}</dd>
  </div>
);

/**
 * Candidate Examination Result Detail Page
 * Renders full score breakdown, candidate metadata, and question-by-question candidate response audit.
 */
export const ResultDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Result Detail Query
  const detailQuery = useQuery({
    queryKey: queryKeys.results.detail(id),
    queryFn: ({ signal }) => resultsApi.detail(id, { signal }),
    enabled: Boolean(id),
  });

  const result = detailQuery.data;
  const studentExamId = result?.student_exam_id;

  // Answers Query
  const answersQuery = useQuery({
    queryKey: queryKeys.evaluation.sessionAnswers(studentExamId),
    queryFn: ({ signal }) => resultsApi.sessionAnswers(studentExamId, { signal }),
    enabled: Boolean(studentExamId),
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: () => resultsApi.publish(studentExamId),
    onSuccess: () => {
      toast('Result published successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to publish result.', { type: 'error' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => resultsApi.remove(id),
    onSuccess: () => {
      toast('Result deleted successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
      navigate(PATHS.RESULTS);
    },
    onError: (error) => {
      setDeleteError(error?.message || 'Failed to delete result.');
      toast(error?.message || 'Failed to delete result.', { type: 'error' });
    },
  });

  if (detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (detailQuery.isError || !result) {
    return (
      <ErrorState
        title="Result not found"
        message="The requested examination result does not exist or has been deleted."
        retryLabel="Back to Results"
        onRetry={() => navigate(PATHS.RESULTS)}
      />
    );
  }

  const student = result.student_exam?.student;
  const exam = result.student_exam?.exam_schedule?.exam;
  const isPublished = Boolean(result.published_at);
  const canPublish = !isPublished && result.evaluation_status === 'COMPLETED';

  return (
    <div className="max-w-4xl">
      <Link to={PATHS.RESULTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Results
      </Link>

      <PageHeader
        title={`Result: ${student?.name ?? 'Student Candidate'}`}
        description={`Roll Number: ${student?.roll_number ?? '—'} · Candidate Exam Session: ${studentExamId ? String(studentExamId).slice(0, 8) : '—'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Print Result
            </Button>
            {!isPublished && (
              <Button
                variant="primary"
                isDisabled={!canPublish}
                isLoading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
                title={
                  !canPublish
                    ? 'All descriptive questions must be evaluated before publishing.'
                    : 'Publish candidate result'
                }
              >
                <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Publish Result
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                setDeleteError(null);
                setIsDeleting(true);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Delete Result
            </Button>
          </div>
        }
      />

      {/* Score Summary Overview Card */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-subtle border-b border-border-main">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold flex items-center gap-2 text-text-main">
              <Award className="w-5 h-5 text-navy-primary" aria-hidden="true" />
              Score Breakdown & Status
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge type="evaluation" status={result.evaluation_status} />
              {isPublished ? (
                <Badge variant="success" dot title={`Published: ${formatDateTime(result.published_at)}`}>
                  Published
                </Badge>
              ) : (
                <Badge variant="amber" dot>
                  Unpublished
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-subtle border border-border-main">
              <span className="text-xs text-text-muted font-medium block">Total Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold font-mono text-navy-primary">
                  {formatNumber(result.obtained_marks, { minFractionDigits: 1 })}
                </span>
                <span className="text-sm font-mono text-text-muted">
                  / {exam?.total_marks ?? 0} pts
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="purple">{formatPercentage(result.percentage)}</Badge>
                {result.grade && <Badge variant="info">Grade {result.grade}</Badge>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-subtle border border-border-main">
              <span className="text-xs text-text-muted font-medium block">MCQ Score</span>
              <span className="text-2xl font-extrabold font-mono text-text-main block mt-1">
                {formatNumber(result.mcq_score ?? 0.0, { minFractionDigits: 1 })} pts
              </span>
              <span className="text-xs text-text-muted block mt-2">Auto-graded objective questions</span>
            </div>

            <div className="p-4 rounded-xl bg-subtle border border-border-main">
              <span className="text-xs text-text-muted font-medium block">Descriptive Score</span>
              <span className="text-2xl font-extrabold font-mono text-text-main block mt-1">
                {formatNumber(result.descriptive_score ?? 0.0, { minFractionDigits: 1 })} pts
              </span>
              <span className="text-xs text-text-muted block mt-2">Manually evaluated answers</span>
            </div>

            <div className="p-4 rounded-xl bg-subtle border border-border-main">
              <span className="text-xs text-text-muted font-medium block">Publication Date</span>
              <span className="text-sm font-medium text-text-main block mt-1">
                {result.published_at ? formatDateTime(result.published_at) : 'Not published'}
              </span>
              <span className="text-xs text-text-muted block mt-2">
                {result.published_at ? 'Visible to candidate' : 'Pending admin release'}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Metadata Card */}
      <Card className="mb-6">
        <CardHeader>Examination & Candidate Metadata</CardHeader>
        <CardBody>
          <dl className="m-0">
            <DetailRow label="Candidate Name">{student?.name ?? '—'}</DetailRow>
            <DetailRow label="Roll Number">{student?.roll_number ?? '—'}</DetailRow>
            <DetailRow label="Examination Total Marks">{exam?.total_marks ?? 0} pts</DetailRow>
            <DetailRow label="Duration">{exam?.duration_minutes ? `${exam.duration_minutes} minutes` : '—'}</DetailRow>
            <DetailRow label="Result Record Created">{formatDateTime(result.created_at)}</DetailRow>
            <DetailRow label="Last Updated">{formatDateTime(result.updated_at)}</DetailRow>
          </dl>
        </CardBody>
      </Card>

      {/* Answer Audit Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-main">
              Candidate Question Responses & Evaluation Detail
            </h2>
            {answersQuery.data && (
              <Badge variant="neutral">{answersQuery.data.length} Questions</Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {answersQuery.isLoading ? (
            <LoadingSkeleton count={3} />
          ) : answersQuery.isError ? (
            <Alert variant="error">Failed to load candidate answer details.</Alert>
          ) : !answersQuery.data || answersQuery.data.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No recorded answers found for this examination session.
            </p>
          ) : (
            <div className="space-y-6">
              {answersQuery.data.map((ans, idx) => {
                const q = ans.question;
                const isMcq = q?.question_type === 'MCQ';
                const selectedOpt = isMcq
                  ? q?.options?.find((o) => o.id === ans.selected_option_id)
                  : null;

                return (
                  <div
                    key={ans.id}
                    className="p-4 rounded-xl border border-border-main bg-surface space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-subtle text-xs font-bold text-navy-primary shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-text-main">
                            {q?.question_text || `Question ${idx + 1}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isMcq ? 'info' : 'purple'}>
                              {isMcq ? 'MCQ' : 'Descriptive'}
                            </Badge>
                            <span className="text-xs text-text-muted font-mono">
                              Max: {q?.marks ?? 0} pts
                              {isMcq && q?.negative_marks > 0 && ` (-${q.negative_marks} wrong)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {ans.awarded_marks !== null && ans.awarded_marks !== undefined ? (
                          <span
                            className={`text-sm font-bold font-mono ${
                              ans.awarded_marks > 0
                                ? 'text-green-600 dark:text-green-400'
                                : ans.awarded_marks < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-text-muted'
                            }`}
                          >
                            {formatNumber(ans.awarded_marks, { minFractionDigits: 1 })} / {q?.marks ?? 0} pts
                          </span>
                        ) : (
                          <Badge variant="amber">Pending Evaluation</Badge>
                        )}
                      </div>
                    </div>

                    {/* MCQ Options Display */}
                    {isMcq && q?.options && (
                      <div className="mt-3 pl-8 space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = opt.id === ans.selected_option_id;
                          const isCorrect = opt.is_correct;

                          let bgStyle = 'bg-subtle border-border-main text-text-main';
                          if (isSelected && isCorrect) {
                            bgStyle =
                              'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-200 font-medium';
                          } else if (isSelected && !isCorrect) {
                            bgStyle =
                              'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200';
                          } else if (isCorrect) {
                            bgStyle =
                              'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-sm flex items-center justify-between ${bgStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                  )
                                ) : isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border-main shrink-0" />
                                )}
                                <span>{opt.option_text}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs">
                                {isSelected && <Badge variant="neutral">Selected</Badge>}
                                {isCorrect && <Badge variant="success">Correct Answer</Badge>}
                              </div>
                            </div>
                          );
                        })}
                        {!ans.selected_option_id && (
                          <p className="text-xs text-text-muted italic">No option selected (Unanswered)</p>
                        )}
                      </div>
                    )}

                    {/* Descriptive Answer Display */}
                    {!isMcq && (
                      <div className="mt-3 pl-8 space-y-3">
                        <div className="p-3 rounded-lg bg-subtle border border-border-main space-y-1">
                          <span className="text-xs text-text-muted font-medium block">
                            Candidate's Response:
                          </span>
                          <p className="text-sm text-text-main whitespace-pre-wrap font-mono leading-relaxed">
                            {ans.answer_text || '(No text submitted)'}
                          </p>
                        </div>

                        {ans.evaluator_feedback && (
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
                            <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                              Evaluator Feedback:
                            </span>
                            <p className="text-sm text-text-main italic">
                              {ans.evaluator_feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleting}
        title="Delete Examination Result?"
        message={`Are you sure you want to delete the result for candidate "${student?.name || 'this student'}"? This action cannot be undone.`}
        confirmLabel="Delete Result"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => {
          setIsDeleting(false);
          setDeleteError(null);
        }}
      >
        {deleteError && <Alert variant="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmationDialog>
    </div>
  );
};

export default ResultDetailPage;
