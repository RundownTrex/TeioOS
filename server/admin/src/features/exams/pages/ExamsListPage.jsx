import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { examsApi } from '../api/examsApi';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

const displayTitle = (exam, subjectName) => (exam.title || subjectName || 'Untitled exam');

/**
 * Exams list page (docs/frontend/admin-exam-management.md §5.2).
 * Subject filter and URL-synced pagination.
 */
export const ExamsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['subject_id'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const listQuery = useQuery({
    queryKey: queryKeys.exams.list.by({
      page,
      pageSize,
      subjectId: filters.subject_id || undefined,
    }),
    queryFn: ({ signal }) =>
      examsApi.list({
        page,
        pageSize,
        subjectId: filters.subject_id,
        signal,
      }),
  });

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
        setDeleteError(error?.message || 'The exam cannot be deleted.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
      toast(error?.message || 'The exam could not be deleted.', { type: 'error' });
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
            {row.title && (
              <p className="text-xs text-text-muted">
                {subjectName || 'Subject'} · {formatDateTime(row.created_at)}
              </p>
            )}
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
              label: 'View',
              onSelect: () => navigate(PATHS.examDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.examEdit(row.id)),
            },
            {
              key: 'delete',
              label: 'Delete',
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

  const hasFilters = Boolean(filters.subject_id);

  return (
    <>
      <PageHeader
        title="Exams"
        description="Create examinations, manage questions and allocate marks."
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
              name: 'subject_id',
              label: 'Subject',
              type: 'select',
              placeholder: 'All subjects',
              options: (subjectsQuery.data?.items ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              })),
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
                No exams match the current filter. Clear the filter to see all exams.
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

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete exam?"
        message={`Delete “${pendingDelete?.title ?? ''}”? This permanently removes the exam and its questions. This action cannot be undone.`}
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
