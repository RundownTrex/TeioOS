import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, PlayCircle, Send, Timer, Clock } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

import { analyticsApi } from '../api/analyticsApi';
import { schedulesApi } from '../../schedules/api/schedulesApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/formatters';

const formatRemaining = (expiresAt) => {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const minutes = Math.max(1, Math.ceil(diffMs / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Student Monitoring (docs/frontend/admin-analytics-monitoring.md §4.4):
 * current sessions, submission status, attendance status. Session and
 * submission aggregates come from the real /admin/analytics/* endpoints;
 * attendance uses the real schedules API.
 */
export const StudentMonitoringPage = () => {
  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.studentOverview,
    queryFn: () => analyticsApi.getStudentOverview(),
  });

  const sessionsQuery = useQuery({
    queryKey: queryKeys.analytics.currentSessions,
    queryFn: () => analyticsApi.getCurrentSessions(),
    refetchInterval: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.analytics.submissionStatus,
    queryFn: () => analyticsApi.getSubmissionStatus(),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      schedulesApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const displayTitle = (examId) => {
    const exam = examMap.get(examId);
    return exam?.title || (exam && subjectNames.get(exam.subject_id)?.name) || 'Untitled exam';
  };

  const overview = overviewQuery.data;

  const sessionColumns = [
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
    { key: 'examName', header: 'Exam' },
    { key: 'subjectName', header: 'Subject' },
    { key: 'startedAt', header: 'Started', render: (row) => formatDateTime(row.startedAt) },
    { key: 'expiresAt', header: 'Expires', render: (row) => formatDateTime(row.expiresAt) },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium text-text-main tabular-nums">
          {formatRemaining(row.expiresAt)}
        </span>
      ),
    },
  ];

  const statusColumns = [
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="assignment" status={row.status} />,
    },
    {
      key: 'count',
      header: 'Students',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.count}</span>,
    },
  ];

  const attendanceColumns = [
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
          {formatDateTime(row.start_time)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="schedule" status={row.status} />,
    },
    {
      key: 'assigned_count',
      header: 'Assigned',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.assigned_count ?? 0}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Student Monitoring"
        description="Track attendance, live sessions, and submission progress."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5 print-no-break">
        <StatCard
          label="Assigned"
          value={overviewQuery.isLoading ? '—' : overview?.total_assigned}
          icon={<Users className="w-5 h-5" aria-hidden="true" />}
        />
        <StatCard
          label="Started"
          value={overviewQuery.isLoading ? '—' : overview?.started}
          icon={<PlayCircle className="w-5 h-5" aria-hidden="true" />}
        />
        <StatCard
          label="Submitted"
          value={overviewQuery.isLoading ? '—' : overview?.submitted}
          icon={<Send className="w-5 h-5" aria-hidden="true" />}
        />
        <StatCard
          label="In Progress"
          value={overviewQuery.isLoading ? '—' : overview?.in_progress}
          icon={<Timer className="w-5 h-5" aria-hidden="true" />}
        />
        <StatCard
          label="Yet to Start"
          value={overviewQuery.isLoading ? '—' : overview?.not_started}
          icon={<Clock className="w-5 h-5" aria-hidden="true" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>Current sessions</CardHeader>
        {sessionsQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Active sessions could not be loaded.</Alert>
          </div>
        ) : (
          <Table
            columns={sessionColumns}
            data={sessionsQuery.data ?? []}
            rowKey="id"
            caption="Students currently taking an examination"
            loading={sessionsQuery.isLoading}
            empty={
              <EmptyState
                title="No active sessions"
                description="No student is taking an examination right now."
              />
            }
          />
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2 mt-6">
        <Card>
          <CardHeader>Submission status</CardHeader>
          {statusQuery.isError ? (
            <div className="p-5">
              <Alert variant="error">Submission status could not be loaded.</Alert>
            </div>
          ) : (
            <Table
              columns={statusColumns}
              data={statusQuery.data ?? []}
              rowKey="status"
              caption="Submission status distribution"
              loading={statusQuery.isLoading}
              empty={<EmptyState title="No data" description="No assignment data recorded." />}
            />
          )}
        </Card>

        <Card>
          <CardHeader>Attendance status</CardHeader>
          {schedulesQuery.isError ? (
            <div className="p-5">
              <Alert variant="error">Schedules could not be loaded.</Alert>
            </div>
          ) : schedulesQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <Table
              columns={attendanceColumns}
              data={schedulesQuery.data?.items ?? []}
              rowKey="id"
              caption="Assigned students per examination schedule"
              empty={
                <EmptyState
                  title="No schedules"
                  description="Create an exam schedule to see attendance."
                />
              }
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default StudentMonitoringPage;
