import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Users, Calendar, AlertCircle, Pencil, Play, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { StatusBadge } from '../../../components/ui/StatusBadge';
import { schedulesApi } from '../api/schedulesApi';
import { useExamsReference, buildExamMap, buildExamOptions } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { QUERY_DEFAULTS } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const calculateWindowDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '—';
  const diffMs = new Date(endIso) - new Date(startIso);
  if (diffMs <= 0) return 'Invalid window';
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours === 0) return `${remMinutes}m window`;
  if (remMinutes === 0) return `${hours}h window`;
  return `${hours}h ${remMinutes}m window`;
};

/**
 * Exam Schedule Management List Page
 * Displays availability window vs candidate duration distinction,
 * filterable by exam and status, with search and pagination.
 */
export const SchedulesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'exam_id', 'status'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();

  const examMap = buildExamMap(examsQuery.data);
  const subjectMap = buildSubjectNameMap(subjectsQuery.data);

  // List Query
  const listQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      examId: filters.exam_id || undefined,
      status: filters.status || undefined,
    }),
    queryFn: ({ signal }) =>
      schedulesApi.list({
        page,
        pageSize,
        q: filters.q,
        examId: filters.exam_id,
        status: filters.status,
        signal,
      }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
    placeholderData: (prev) => prev,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => schedulesApi.remove(id),
    onSuccess: () => {
      toast('Schedule deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.list.all });
    },
    onError: (error) => {
      setDeleteError(error?.message || 'The schedule could not be deleted.');
      toast(error?.message || 'Failed to delete schedule.', { type: 'error' });
    },
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => schedulesApi.update(id, { status }),
    onSuccess: (_, variables) => {
      toast(`Schedule status updated to ${variables.status}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update schedule status.', { type: 'error' });
    },
  });

  const data = listQuery.data;

  const columns = [
    {
      key: 'exam',
      header: 'Examination',
      render: (row) => {
        const exam = examMap.get(row.exam_id);
        const subjectName = exam ? subjectMap.get(exam.subject_id)?.name : null;
        const title = exam?.title || subjectName || 'Untitled Exam';
        return (
          <div>
            <p className="text-sm font-medium text-text-main">{title}</p>
            <p className="text-xs text-text-muted">
              {subjectName ? `${subjectName} · ` : ''}{exam ? `${exam.total_marks} total marks` : ''}
            </p>
          </div>
        );
      },
    },
    {
      key: 'availability_window',
      header: 'Availability Window',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-text-main font-medium">
            <Calendar className="w-3.5 h-3.5 text-navy-primary shrink-0" aria-hidden="true" />
            <span>{formatDateTime(row.start_time)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3.5 shrink-0 text-center">to</span>
            <span>{formatDateTime(row.end_time)}</span>
          </div>
          <span className="inline-block text-[11px] font-semibold text-text-muted bg-subtle px-1.5 py-0.5 rounded border border-border-main">
            {calculateWindowDuration(row.start_time, row.end_time)}
          </span>
        </div>
      ),
    },
    {
      key: 'candidate_duration',
      header: 'Candidate Duration',
      render: (row) => {
        const exam = examMap.get(row.exam_id);
        return (
          <div>
            <div className="flex items-center gap-1 text-sm font-semibold text-text-main">
              <Clock className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
              <span>{exam ? `${exam.duration_minutes} mins` : '—'}</span>
            </div>
            <p className="text-[11px] text-text-muted">Tracked per student upon start</p>
          </div>
        );
      },
    },
    {
      key: 'assigned_count',
      header: 'Candidates',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-text-main">
          <Users className="w-4 h-4 text-text-muted" aria-hidden="true" />
          <span>{formatNumber(row.assigned_count ?? 0)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="schedule" status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label="Schedule actions"
          items={[
            {
              key: 'assign',
              label: 'Assign Candidates',
              icon: <Users className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => navigate(PATHS.scheduleAssign(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit Schedule',
              icon: <Pencil className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => navigate(PATHS.scheduleEdit(row.id)),
            },
            {
              key: 'set-active',
              label: 'Set Status to Active',
              icon: <Play className="w-4 h-4" aria-hidden="true" />,
              disabled: row.status === 'active',
              onSelect: () => statusMutation.mutate({ id: row.id, status: 'active' }),
            },
            {
              key: 'set-completed',
              label: 'Set Status to Completed',
              icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
              disabled: row.status === 'completed',
              onSelect: () => statusMutation.mutate({ id: row.id, status: 'completed' }),
            },
            {
              key: 'set-cancelled',
              label: 'Cancel Schedule',
              icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
              disabled: row.status === 'cancelled',
              onSelect: () => statusMutation.mutate({ id: row.id, status: 'cancelled' }),
            },
            {
              key: 'delete',
              label: 'Delete Schedule',
              icon: <Trash2 className="w-4 h-4" aria-hidden="true" />,
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(filters.q || filters.exam_id || filters.status);

  return (
    <>
      <PageHeader
        title="Exam Schedules"
        description="Configure examination availability windows and schedule student exam sessions."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.SCHEDULES_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Schedule
          </Button>
        }
      />

      {/* Concept Callout Banner */}
      <Alert variant="info" className="mb-5">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 text-navy-primary shrink-0" aria-hidden="true" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-text-main">Timing System Architecture:</p>
            <p>
              • <strong>Availability Window:</strong> The overall start and end timeframe during which candidates may access the examination.
            </p>
            <p>
              • <strong>Candidate Duration:</strong> The independent per-student timer (set on the Exam definition) that begins the moment a candidate starts their session.
            </p>
          </div>
        </div>
      </Alert>

      <Card>
        <Filters
          fields={[
            {
              name: 'q',
              label: 'Search schedules',
              placeholder: 'Search by exam title…',
            },
            {
              name: 'exam_id',
              label: 'Exam',
              type: 'select',
              placeholder: 'All examinations',
              options: buildExamOptions(examsQuery.data, subjectMap),
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
          caption="List of examination schedules"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Exam schedules could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            hasFilters ? (
              <p className="text-sm text-text-muted">
                No schedules match your search or filter options.
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete schedule?"
        message="Delete this schedule? This action cannot be undone."
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

export default SchedulesListPage;
