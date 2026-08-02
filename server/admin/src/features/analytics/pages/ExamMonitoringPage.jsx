import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, ClipboardCheck } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

import { dashboardApi } from '../../dashboard/api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { schedulesApi } from '../../schedules/api/schedulesApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS, SCHEDULE_STATUS } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';
import { formatDateTime } from '../../../utils/formatters';

/**
 * Exam Monitoring (docs/frontend/admin-analytics-monitoring.md §4.4):
 * active exams, completed exams, pending evaluations. Schedule lists are
 * real; status grouping is client-side because the v1 backend schedules
 * endpoint has no status filter yet (admin-dashboard-page.md §2.2).
 */
export const ExamMonitoringPage = () => {
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => dashboardApi.getStats({ signal }),
  });

  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: () => analyticsApi.getOverview(),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      schedulesApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.analytics.pendingEvaluations,
    queryFn: () => analyticsApi.getPendingEvaluations(),
    refetchInterval: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const displayTitle = (examId) => {
    const exam = examMap.get(examId);
    return exam?.title || (exam && subjectNames.get(exam.subject_id)?.name) || 'Untitled exam';
  };

  const schedules = schedulesQuery.data?.items ?? [];
  const activeSchedules = schedules.filter((s) => s.status === SCHEDULE_STATUS.ACTIVE);
  const completedSchedules = schedules.filter((s) => s.status === SCHEDULE_STATUS.COMPLETED);

  const scheduleColumns = [
    {
      key: 'exam_id',
      header: 'Exam',
      render: (row) => displayTitle(row.exam_id),
    },
    {
      key: 'start_time',
      header: 'Window',
      render: (row) => (
        <span className="text-sm text-text-main tabular-nums">
          {formatDateTime(row.start_time)} – {formatDateTime(row.end_time)}
        </span>
      ),
    },
    {
      key: 'assigned_count',
      header: 'Assigned',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.assigned_count ?? 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="schedule" status={row.status} />,
    },
  ];

  const pendingColumns = [
    {
      key: 'studentName',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-main">{row.studentName}</p>
          <p className="text-xs text-text-muted">{row.rollNumber}</p>
        </div>
      ),
    },
    { key: 'subjectName', header: 'Subject' },
    { key: 'pendingAnswers', header: 'Pending Answers', align: 'right' },
    { key: 'submittedAt', header: 'Submitted', render: (row) => formatDateTime(row.submittedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Exam Monitoring"
        description="Active and completed examinations, and work awaiting evaluation."
      />

      <div className="grid gap-6 md:grid-cols-3 print-no-break">
        <StatCard
          label="Active Exams"
          value={statsQuery.isLoading ? '—' : statsQuery.data?.active_exams}
          icon={<Activity className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.SCHEDULES)}
        />
        <StatCard
          label="Completed Exams"
          value={statsQuery.isLoading ? '—' : statsQuery.data?.completed_exams}
          icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.SCHEDULES)}
        />
        <StatCard
          label="Pending Evaluations"
          value={overviewQuery.isLoading ? '—' : overviewQuery.data?.pending_evaluations}
          icon={<ClipboardCheck className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.EVALUATION)}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>Active exams</CardHeader>
        {schedulesQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Schedules could not be loaded.</Alert>
          </div>
        ) : schedulesQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <Table
            columns={scheduleColumns}
            data={activeSchedules}
            rowKey="id"
            caption="Examination schedules currently active"
            empty={
              <EmptyState
                title="No active exams"
                description="There are no active examination schedules right now."
              />
            }
          />
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>Completed exams</CardHeader>
        {schedulesQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Schedules could not be loaded.</Alert>
          </div>
        ) : schedulesQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <Table
            columns={scheduleColumns}
            data={completedSchedules}
            rowKey="id"
            caption="Examination schedules completed"
            empty={
              <EmptyState
                title="No completed exams"
                description="Completed examination schedules will appear here."
              />
            }
          />
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>Pending evaluations</CardHeader>
        {pendingQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Pending evaluations could not be loaded.</Alert>
          </div>
        ) : (
          <Table
            columns={pendingColumns}
            data={pendingQuery.data ?? []}
            rowKey="id"
            caption="Descriptive answers awaiting manual evaluation"
            loading={pendingQuery.isLoading}
            empty={
              <EmptyState
                title="No pending evaluations"
                description="All descriptive answers have been evaluated."
              />
            }
          />
        )}
      </Card>
    </>
  );
};

export default ExamMonitoringPage;
