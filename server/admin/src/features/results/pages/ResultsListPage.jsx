import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Send, Eye, CheckCircle2, AlertCircle, Award, BookOpen, User, Trash2 } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';
import { Alert } from '../../../components/ui/Alert';

import { resultsApi } from '../api/resultsApi';
import { useExamsReference, buildExamOptions, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useClassesReference, buildClassOptions, buildClassMap } from '../../classes/hooks/useClassesReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime, formatPercentage, formatNumber } from '../../../utils/formatters';
import { QUERY_DEFAULTS } from '../../../utils/constants';

const EVALUATION_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PARTIALLY_EVALUATED', label: 'Partially Evaluated' },
  { value: 'PENDING', label: 'Pending' },
];

const PUBLISHED_STATUS_OPTIONS = [
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Unpublished' },
];

/**
 * Results Management Page
 * Displays backend-calculated results for mixed examinations (MCQ + Descriptive).
 * Strictly displays only backend-provided values (no frontend mark calculations).
 */
export const ResultsListPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'exam_id', 'class_id', 'evaluation_status', 'is_published'] });

  const [selectedResult, setSelectedResult] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // References
  const examsQuery = useExamsReference();
  const classesQuery = useClassesReference();
  const subjectsQuery = useSubjectsReference();

  const examMap = buildExamMap(examsQuery.data);
  const classMap = buildClassMap(classesQuery.data);
  const subjectMap = buildSubjectNameMap(subjectsQuery.data);

  // Results Query
  const resultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      examId: filters.exam_id || undefined,
      classId: filters.class_id || undefined,
      evaluationStatus: filters.evaluation_status || undefined,
      isPublished: filters.is_published || undefined,
    }),
    queryFn: ({ signal }) =>
      resultsApi.list({
        page,
        pageSize,
        q: filters.q,
        examId: filters.exam_id,
        classId: filters.class_id,
        evaluationStatus: filters.evaluation_status,
        isPublished: filters.is_published,
        signal,
      }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
    placeholderData: (prev) => prev,
  });

  // Publish Result Mutation
  const publishMutation = useMutation({
    mutationFn: (studentExamId) => resultsApi.publish(studentExamId),
    onSuccess: () => {
      toast('Result published successfully', { type: 'success' });
      setSelectedResult(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to publish result.', { type: 'error' });
    },
  });

  // Delete Result Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => resultsApi.remove(id),
    onSuccess: () => {
      toast('Result deleted successfully', { type: 'success' });
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
    },
    onError: (error) => {
      setPendingDelete(null);
      toast(error?.message || 'Failed to delete result.', { type: 'error' });
    },
  });

  const data = resultsQuery.data;

  const columns = [
    {
      key: 'student',
      header: 'Student Candidate',
      render: (row) => {
        const student = row.student_exam?.student;
        return (
          <div>
            <p className="text-sm font-semibold text-text-main">{student?.name ?? '—'}</p>
            <p className="text-xs font-mono text-text-muted">{student?.roll_number ?? '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'exam',
      header: 'Examination',
      render: (row) => {
        const exam = row.student_exam?.exam_schedule?.exam;
        const subjectName = exam ? subjectMap.get(exam.subject_id)?.name : null;
        return (
          <div>
            <p className="text-sm font-medium text-text-main">{exam?.title || subjectName || 'Exam'}</p>
            <p className="text-xs text-text-muted">Total: {exam?.total_marks ?? 0} pts</p>
          </div>
        );
      },
    },
    {
      key: 'mcq_score',
      header: 'MCQ Score',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-text-main">
          {formatNumber(row.mcq_score ?? 0.0, { minFractionDigits: 1 })} pts
        </span>
      ),
    },
    {
      key: 'descriptive_score',
      header: 'Descriptive Score',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-text-main">
          {formatNumber(row.descriptive_score ?? 0.0, { minFractionDigits: 1 })} pts
        </span>
      ),
    },
    {
      key: 'final_score',
      header: 'Final Score & Grade',
      align: 'right',
      render: (row) => {
        const exam = row.student_exam?.exam_schedule?.exam;
        const totalMarks = exam?.total_marks ?? 0;
        return (
          <div className="text-right">
            <span className="font-mono text-sm font-bold text-navy-primary">
              {formatNumber(row.obtained_marks, { minFractionDigits: 1 })} / {totalMarks} pts
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <Badge variant="purple">{formatPercentage(row.percentage)}</Badge>
              {row.grade && <Badge variant="info">Grade {row.grade}</Badge>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'evaluation_status',
      header: 'Evaluation Status',
      render: (row) => <StatusBadge type="evaluation" status={row.evaluation_status} />,
    },
    {
      key: 'published_status',
      header: 'Published',
      render: (row) =>
        row.published_at ? (
          <Badge variant="success" dot title={`Published: ${formatDateTime(row.published_at)}`}>
            Published
          </Badge>
        ) : (
          <Badge variant="amber" dot>
            Unpublished
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label="Result actions"
          items={[
            {
              key: 'view-details',
              label: 'View Result Details',
              icon: <Eye className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => setSelectedResult(row),
            },
            {
              key: 'publish',
              label: 'Publish Result',
              icon: <Send className="w-4 h-4" aria-hidden="true" />,
              disabled: Boolean(row.published_at) || row.evaluation_status !== 'COMPLETED',
              onSelect: () => publishMutation.mutate(row.student_exam_id),
            },
            {
              key: 'delete',
              label: 'Delete Result',
              icon: <Trash2 className="w-4 h-4" aria-hidden="true" />,
              danger: true,
              onSelect: () => setPendingDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(
    filters.q || filters.exam_id || filters.class_id || filters.evaluation_status || filters.is_published
  );

  return (
    <>
      <PageHeader
        title="Results Management"
        description="View and publish backend-evaluated candidate scores for MCQ and descriptive examinations."
      />

      <Card>
        <Filters
          fields={[
            {
              name: 'q',
              label: 'Search student',
              placeholder: 'Search by student name or roll number…',
            },
            {
              name: 'exam_id',
              label: 'Examination',
              type: 'select',
              placeholder: 'All examinations',
              options: buildExamOptions(examsQuery.data, subjectMap),
            },
            {
              name: 'class_id',
              label: 'Class',
              type: 'select',
              placeholder: 'All classes',
              options: buildClassOptions(classesQuery.data),
            },
            {
              name: 'evaluation_status',
              label: 'Evaluation Status',
              type: 'select',
              placeholder: 'All evaluation statuses',
              options: EVALUATION_STATUS_OPTIONS,
            },
            {
              name: 'is_published',
              label: 'Published Status',
              type: 'select',
              placeholder: 'All publication statuses',
              options: PUBLISHED_STATUS_OPTIONS,
            },
          ]}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="Candidate Examination Results List"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={resultsQuery.isFetching}
          error={
            resultsQuery.isError ? (
              <Alert variant="error">Examination results could not be retrieved.</Alert>
            ) : undefined
          }
          empty={
            hasFilters ? (
              <p className="text-sm text-text-muted">
                No examination results match your current search or filters.
              </p>
            ) : (
              <p className="text-sm text-text-muted">
                No candidate examination results recorded yet. Completed student sessions will populate here.
              </p>
            )
          }
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Result Details Modal */}
      <Modal
        open={Boolean(selectedResult)}
        onClose={() => setSelectedResult(null)}
        title="Candidate Result Details"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setSelectedResult(null)}>
              Close
            </Button>
            {selectedResult && !selectedResult.published_at && (
              <Button
                variant="primary"
                isDisabled={selectedResult.evaluation_status !== 'COMPLETED'}
                isLoading={publishMutation.isPending}
                onClick={() => publishMutation.mutate(selectedResult.student_exam_id)}
              >
                <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Publish Result
              </Button>
            )}
          </div>
        }
      >
        {selectedResult && (
          <div className="space-y-4">
            {/* Candidate Metadata Box */}
            <div className="p-4 rounded-xl bg-subtle border border-border-main space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-primary text-base">
                  {selectedResult.student_exam?.student?.name ?? 'Student Candidate'}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  Roll: {selectedResult.student_exam?.student?.roll_number ?? '—'}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Examination:{' '}
                <span className="font-semibold text-text-main">
                  {selectedResult.student_exam?.exam_schedule?.exam?.title || 'Exam'}
                </span>
              </p>
            </div>

            {/* Backend Scores Breakdown Card */}
            <div className="p-4 rounded-xl bg-surface border border-border-main space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-primary">
                Backend-Calculated Score Breakdown
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-subtle border border-border-main">
                  <span className="text-xs text-text-muted block">MCQ Score (Auto-graded)</span>
                  <span className="text-base font-bold font-mono text-text-main">
                    {formatNumber(selectedResult.mcq_score ?? 0.0, { minFractionDigits: 1 })} pts
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-subtle border border-border-main">
                  <span className="text-xs text-text-muted block">Descriptive Score (Evaluated)</span>
                  <span className="text-base font-bold font-mono text-text-main">
                    {formatNumber(selectedResult.descriptive_score ?? 0.0, { minFractionDigits: 1 })} pts
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-subtle border border-border-main col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-muted block">Final Total Score</span>
                    <span className="text-xl font-extrabold font-mono text-navy-primary">
                      {formatNumber(selectedResult.obtained_marks, { minFractionDigits: 1 })} /{' '}
                      {selectedResult.student_exam?.exam_schedule?.exam?.total_marks ?? 0} pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-navy-primary block">
                      {formatPercentage(selectedResult.percentage)}
                    </span>
                    {selectedResult.grade && (
                      <Badge variant="purple" className="mt-1">
                        Grade {selectedResult.grade}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-subtle border border-border-main">
                <span className="text-text-muted block">Evaluation Status</span>
                <StatusBadge type="evaluation" status={selectedResult.evaluation_status} className="mt-1" />
              </div>
              <div className="p-3 rounded-lg bg-subtle border border-border-main">
                <span className="text-text-muted block">Publication Status</span>
                <span className="font-semibold text-text-main block mt-1">
                  {selectedResult.published_at
                    ? `Published on ${formatDateTime(selectedResult.published_at)}`
                    : 'Unpublished'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete Examination Result?"
        message={`Are you sure you want to delete the examination result for candidate "${pendingDelete?.student_exam?.student?.name || 'this student'}"? This action cannot be undone.`}
        confirmLabel="Delete Result"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};

export default ResultsListPage;
