import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  PlayCircle,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';

import { analyticsApi } from '../api/analyticsApi';
import { dashboardApi } from '../../dashboard/api/dashboardApi';
import { schedulesApi } from '../../schedules/api/schedulesApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/formatters';

const POLLING_INTERVAL_MS = 5000; // 5-second automatic refresh via React Query polling

/**
 * Live Remaining Time Cell
 * Updates every second for a smooth countdown.
 * Highlights urgent sessions (< 5 mins remaining) in red.
 */
const RemainingTimeCell = ({ expiresAt }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!expiresAt) return <span className="text-text-muted">—</span>;

  const diffMs = new Date(expiresAt).getTime() - now;
  if (diffMs <= 0) {
    return <Badge variant="danger">Expired</Badge>;
  }

  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const isUrgent = totalSec < 300; // less than 5 mins

  const pad = (n) => String(n).padStart(2, '0');
  const formatted =
    hours > 0
      ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${minutes}m ${pad(seconds)}s`;

  return (
    <span
      className={`font-mono text-sm tabular-nums font-semibold ${
        isUrgent ? 'text-status-danger animate-pulse' : 'text-text-main'
      }`}
    >
      {formatted}
    </span>
  );
};

/**
 * Live Examination Monitoring Module
 * Provides administrators with real-time overview of examination progress.
 * Polled automatically via React Query without WebSockets.
 *
 * Displays:
 * 1. Active Exams
  * 2. Active Students (In Progress)
 * 3. Students Yet To Start (Pending)
 * 4. Submitted Students
 * 5. Expired Sessions (Expired / Terminated)
 *
 * Live Active Candidate Table:
 * - Student Name
 * - Roll Number
 * - Exam
 * - Started At
 * - Remaining Time
 * - Status
 */
export const StudentMonitoringPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Overview Query (Aggregates)
  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.studentOverview,
    queryFn: ({ signal }) => analyticsApi.getStudentOverview({ signal }),
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  // Current Active Sessions Query (Candidates in_progress)
  const sessionsQuery = useQuery({
    queryKey: queryKeys.analytics.currentSessions,
    queryFn: ({ signal }) => analyticsApi.getCurrentSessions({ signal }),
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev,
  });

  // Dashboard Stats Query (Active Exams Count)
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => dashboardApi.getStats({ signal }),
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  // Submission Status Distribution Query
  const statusQuery = useQuery({
    queryKey: queryKeys.analytics.submissionStatus,
    queryFn: ({ signal }) => analyticsApi.getSubmissionStatus({ signal }),
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  // Schedules Reference Query
  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      schedulesApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const overview = overviewQuery.data;
  const activeExamsCount =
    statsQuery.data?.active_exams ??
    (schedulesQuery.data?.items ?? []).filter((s) => s.status === 'active').length;

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
  };

  // Filter active sessions by student name, roll number, or exam title
  const activeSessions = useMemo(() => {
    const list = sessionsQuery.data ?? [];
    if (!searchQuery.trim()) return list;
    const term = searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.studentName?.toLowerCase().includes(term) ||
        s.rollNumber?.toLowerCase().includes(term) ||
        s.examName?.toLowerCase().includes(term) ||
        s.subjectName?.toLowerCase().includes(term)
    );
  }, [sessionsQuery.data, searchQuery]);

  const candidateColumns = [
    {
      key: 'student',
      header: 'Candidate Name',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-text-main">{row.studentName}</p>
          <p className="text-xs font-mono text-text-muted">{row.rollNumber}</p>
        </div>
      ),
    },
    {
      key: 'rollNumber',
      header: 'Roll Number',
      render: (row) => <span className="font-mono text-xs text-text-main">{row.rollNumber}</span>,
    },
    {
      key: 'exam',
      header: 'Examination',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-main">{row.examName}</p>
          {row.subjectName && row.subjectName !== row.examName && (
            <p className="text-xs text-text-muted">{row.subjectName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started At',
      render: (row) => formatDateTime(row.startedAt),
    },
    {
      key: 'remainingTime',
      header: 'Remaining Time',
      align: 'right',
      render: (row) => <RemainingTimeCell expiresAt={row.expiresAt} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: () => <Badge variant="success" dot>In Progress</Badge>,
    },
  ];

  const statusColumns = [
    {
      key: 'status',
      header: 'Session Lifecycle Status',
      render: (row) => <StatusBadge type="assignment" status={row.status} />,
    },
    {
      key: 'count',
      header: 'Candidates Count',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums text-text-main">{row.count}</span>,
    },
  ];

  const isRefreshing =
    sessionsQuery.isFetching || overviewQuery.isFetching || statsQuery.isFetching;

  return (
    <>
      <PageHeader
        title="Live Examination Monitoring"
        description="Real-time overview of active examinations, candidate progress, and session timers."
        actions={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-success-bg border border-status-success-border text-xs font-medium text-status-success">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span>Live Auto-Refresh (5s)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              isLoading={isRefreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh Now
            </Button>
          </div>
        }
      />

      {/* Real-time Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 print-no-break">
        <StatCard
          label="Active Exams"
          value={statsQuery.isLoading ? '—' : activeExamsCount}
          icon={<Activity className="w-5 h-5 text-navy-primary" aria-hidden="true" />}
        />
        <StatCard
          label="Active Students"
          value={overviewQuery.isLoading ? '—' : overview?.in_progress}
          icon={<PlayCircle className="w-5 h-5 text-status-success" aria-hidden="true" />}
        />
        <StatCard
          label="Students Yet To Start"
          value={overviewQuery.isLoading ? '—' : overview?.not_started}
          icon={<Clock className="w-5 h-5 text-status-warning" aria-hidden="true" />}
        />
        <StatCard
          label="Submitted Students"
          value={overviewQuery.isLoading ? '—' : overview?.submitted}
          icon={<Send className="w-5 h-5 text-status-info" aria-hidden="true" />}
        />
        <StatCard
          label="Expired Sessions"
          value={
            overviewQuery.isLoading
              ? '—'
              : (overview?.expired || 0) + (overview?.terminated || 0)
          }
          icon={<AlertCircle className="w-5 h-5 text-status-danger" aria-hidden="true" />}
        />
      </div>

      {/* Live Active Candidates Card */}
      <Card className="mt-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border-main">
          <div>
            <h3 className="text-base font-semibold text-text-main">
              Active Candidate Sessions ({activeSessions.length})
            </h3>
            <p className="text-xs text-text-muted">
              Live monitoring of candidates currently writing examinations.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              id="live_search"
              name="search"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search active candidate sessions"
            />
          </div>
        </CardHeader>

        {sessionsQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Active candidate sessions could not be retrieved from the server.</Alert>
          </div>
        ) : (
          <Table
            columns={candidateColumns}
            data={activeSessions}
            rowKey="id"
            caption="Active candidate sessions table"
            loading={sessionsQuery.isLoading}
            empty={
              <div className="p-8 text-center text-text-muted">
                <Users className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-50" aria-hidden="true" />
                <p className="text-sm font-medium">No active candidate sessions right now</p>
                <p className="text-xs text-text-muted mt-1">
                  When students start an examination from the TeioOS client kiosk, their session will appear here in real time.
                </p>
              </div>
            }
          />
        )}
      </Card>

      {/* Submission Status Distribution Table */}
      <Card className="mt-6">
        <CardHeader className="px-5 py-4 border-b border-border-main">
          <h3 className="text-base font-semibold text-text-main">Session Lifecycle Distribution</h3>
          <p className="text-xs text-text-muted">
            Overall breakdown of student assignment statuses across all examination schedules.
          </p>
        </CardHeader>
        {statusQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Submission status distribution could not be loaded.</Alert>
          </div>
        ) : (
          <Table
            columns={statusColumns}
            data={statusQuery.data ?? []}
            rowKey="status"
            caption="Submission status distribution table"
            loading={statusQuery.isLoading}
            empty={
              <div className="p-6 text-center text-sm text-text-muted">
                No session status data available.
              </div>
            }
          />
        )}
      </Card>
    </>
  );
};

export default StudentMonitoringPage;
