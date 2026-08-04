import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Send, EyeOff, FileText, Pencil, Trash2 } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';
import { Menu } from '../../../components/ui/Menu';

import { examsApi } from '../api/examsApi';
import { questionsApi } from '../api/questionsApi';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { QUERY_DEFAULTS } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const displayTitle = (exam, subjectName) => (exam?.title || subjectName || 'Untitled Exam');

/**
 * Exams list page with title search, subject/status filters, pagination,
 * preview, status toggling, and deletion.
 */
export const ExamsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'subject_id', 'status'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [previewExam, setPreviewExam] = useState(null);

  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  // List Query
  const listQuery = useQuery({
    queryKey: queryKeys.exams.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      subjectId: filters.subject_id || undefined,
      status: filters.status || undefined,
    }),
    queryFn: ({ signal }) =>
      examsApi.list({
        page,
        pageSize,
        q: filters.q,
        subjectId: filters.subject_id,
        status: filters.status,
        signal,
      }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
    placeholderData: (prev) => prev,
  });

  // Questions query for preview modal
  const previewQuestionsQuery = useQuery({
    queryKey: queryKeys.questions.list.by({ examId: previewExam?.id, pageSize: 100 }),
    queryFn: ({ signal }) => questionsApi.list({ examId: previewExam?.id, pageSize: 100, signal }),
    enabled: Boolean(previewExam?.id),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => examsApi.remove(id),
    onSuccess: () => {
      toast('Exam deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
    },
    onError: (error) => {
      if (error?.status === 400) {
        setDeleteError(error?.message || 'The exam cannot be deleted because it has schedules.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
      toast(error?.message || 'The exam could not be deleted.', { type: 'error' });
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => examsApi.toggleStatus(id, status),
    onSuccess: (_, variables) => {
      const statusText = variables.status === 'published' ? 'published' : 'reverted to draft';
      toast(`Exam status ${statusText}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update exam status.', { type: 'error' });
    },
  });

  const data = listQuery.data;

  const columns = [
    {
      key: 'title',
      header: 'Exam',
      render: (row) => {
        const subjectName = subjectNames.get(row.subject_id)?.name;
        return (
          <div>
            <p className="text-sm font-medium text-text-main">{displayTitle(row, subjectName)}</p>
            <p className="text-xs text-text-muted">
              {subjectName || 'Subject'} · Created {formatDateTime(row.created_at)}
            </p>
          </div>
        );
      },
    },
    {
      key: 'subject_id',
      header: 'Subject',
      render: (row) => subjectNames.get(row.subject_id)?.name ?? '—',
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (row) => `${row.duration_minutes} min`,
    },
    {
      key: 'total_marks',
      header: 'Total Marks',
      render: (row) => formatNumber(row.total_marks),
    },
    {
      key: 'question_count',
      header: 'Questions',
      render: (row) => formatNumber(row.question_count ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.status === 'published' ? (
          <Badge variant="success" dot>Published</Badge>
        ) : (
          <Badge variant="info" dot>Draft</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label={`Actions for ${displayTitle(row, subjectNames.get(row.subject_id)?.name)}`}
          items={[
            {
              key: 'view',
              label: 'View Questions & Content',
              icon: <FileText className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => navigate(PATHS.examDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit Exam',
              icon: <Pencil className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => navigate(PATHS.examEdit(row.id)),
            },
            {
              key: 'preview',
              label: 'Preview Exam',
              icon: <Eye className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => setPreviewExam(row),
            },
            {
              key: 'toggle-status',
              label: row.status === 'published' ? 'Revert to Draft' : 'Publish Exam',
              icon: row.status === 'published' ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              ),
              onSelect: () =>
                toggleStatusMutation.mutate({
                  id: row.id,
                  status: row.status === 'published' ? 'draft' : 'published',
                }),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-4 h-4" aria-hidden="true" />,
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete({
                  id: row.id,
                  title: displayTitle(row, subjectNames.get(row.subject_id)?.name),
                });
              },
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(filters.q || filters.subject_id || filters.status);

  return (
    <>
      <PageHeader
        title="Exams"
        description="Manage examination definitions, duration, instructions, and marks."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.EXAMS_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Exam
          </Button>
        }
      />

      <Card>
        <Filters
          fields={[
            {
              name: 'q',
              label: 'Search exams',
              placeholder: 'Search by title…',
            },
            {
              name: 'subject_id',
              label: 'Subject',
              type: 'select',
              placeholder: 'All subjects',
              options: (subjectsQuery.data?.items ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              })),
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              placeholder: 'All statuses',
              options: STATUS_OPTIONS,
            },
          ]}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="List of exams"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Exams could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            hasFilters ? (
              <p className="text-sm text-text-muted">
                No exams match the current filters. Clear filters to see all exams.
              </p>
            ) : undefined
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

      {/* Exam Preview Modal */}
      <Modal
        open={Boolean(previewExam)}
        onClose={() => setPreviewExam(null)}
        title={`Exam Preview: ${displayTitle(previewExam, subjectNames.get(previewExam?.subject_id)?.name)}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPreviewExam(null)}>
              Close Preview
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const targetId = previewExam.id;
                setPreviewExam(null);
                navigate(PATHS.examDetail(targetId));
              }}
            >
              Manage Questions
            </Button>
          </div>
        }
      >
        {previewExam && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-subtle border border-border-main text-sm">
              <div>
                <span className="text-text-muted block text-xs">Subject</span>
                <span className="font-semibold text-text-main">
                  {subjectNames.get(previewExam.subject_id)?.name ?? '—'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">Duration</span>
                <span className="font-semibold text-text-main">{previewExam.duration_minutes} minutes</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">Total Marks</span>
                <span className="font-semibold text-text-main">{previewExam.total_marks} pts</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">Status</span>
                {previewExam.status === 'published' ? (
                  <Badge variant="success" dot>Published</Badge>
                ) : (
                  <Badge variant="info" dot>Draft</Badge>
                )}
              </div>
            </div>

            {previewExam.instructions ? (
              <Card>
                <CardHeader>Examination Instructions</CardHeader>
                <CardBody>
                  <p className="text-sm text-text-main whitespace-pre-line leading-relaxed">
                    {previewExam.instructions}
                  </p>
                </CardBody>
              </Card>
            ) : (
              <p className="text-xs text-text-muted italic">No specific instructions set for this exam.</p>
            )}

            <Card>
              <CardHeader>Questions Preview ({previewQuestionsQuery.data?.items?.length ?? 0})</CardHeader>
              <CardBody className="space-y-4 max-h-96 overflow-y-auto">
                {previewQuestionsQuery.isLoading ? (
                  <p className="text-sm text-text-muted">Loading questions…</p>
                ) : previewQuestionsQuery.data?.items?.length ? (
                  previewQuestionsQuery.data.items.map((q, idx) => (
                    <div key={q.id} className="p-3 border border-border-main rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-navy-primary">
                          Question {idx + 1} ({q.question_type})
                        </span>
                        <span className="text-xs font-semibold text-text-main">{q.marks} pts</span>
                      </div>
                      <p className="text-sm text-text-main whitespace-pre-line">{q.question_text}</p>
                      {q.question_type === 'MCQ' && q.options?.length > 0 && (
                        <div className="pl-4 space-y-1 text-xs text-text-muted">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 ${opt.is_correct ? 'font-semibold text-status-success' : ''}`}
                            >
                              <span>{opt.is_correct ? '✓' : '•'}</span>
                              <span>{opt.option_text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted italic">No questions added to this exam yet.</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete exam?"
        message={`Delete “${pendingDelete?.title ?? ''}”? This permanently removes the exam definition and its questions. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      >
        {deleteError && <Alert variant="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmationDialog>
    </>
  );
};

export default ExamsListPage;
