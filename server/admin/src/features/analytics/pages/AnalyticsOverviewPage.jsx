import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Activity,
  CheckCircle2,
  ClipboardCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { BarList } from '../../../components/ui/BarList';
import { DownloadCsvButton } from '../../../components/ui/DownloadCsvButton';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Tabs } from '../../../components/ui/Tabs';

import { dashboardApi } from '../../dashboard/api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { resultsApi } from '../../results/api/resultsApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';
import { formatDateTime, formatPercentage, formatNumber } from '../../../utils/formatters';
import { QUERY_DEFAULTS } from '../../../utils/constants';

const STATUS_CHART_META = [
  { key: 'submitted', label: 'Submitted', tone: 'success' },
  { key: 'auto_submitted', label: 'Auto Submitted', tone: 'success' },
  { key: 'in_progress', label: 'In Progress', tone: 'info' },
  { key: 'pending', label: 'Yet to Start', tone: 'warning' },
  { key: 'expired', label: 'Expired', tone: 'danger' },
  { key: 'terminated', label: 'Terminated', tone: 'danger' },
];

/**
 * Reports and Analytics Module Page
 * Displays:
 * 1. Dashboard Statistics: Total Students, Total Exams, Active Exams, Completed Exams, Pending Evaluations
 * 2. Analytics: Average Score, Pass Percentage, Highest Score, Lowest Score
 * 3. Reusable Charts: Average Performance by Exam, Submission Status Distribution
 * 4. Recent Activity: Recent Logins / Sessions, Recent Submissions, Recent Evaluations
 */
export const AnalyticsOverviewPage = () => {
  const navigate = useNavigate();
  const [activityTab, setActivityTab] = useState('sessions');

  // Queries
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => dashboardApi.getStats({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: ({ signal }) => analyticsApi.getOverview({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

  const performanceQuery = useQuery({
    queryKey: queryKeys.analytics.examPerformance,
    queryFn: ({ signal }) => analyticsApi.getExamPerformance({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.analytics.submissionStatus,
    queryFn: ({ signal }) => analyticsApi.getSubmissionStatus({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const recentSessionsQuery = useQuery({
    queryKey: queryKeys.analytics.currentSessions,
    queryFn: ({ signal }) => analyticsApi.getCurrentSessions({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const recentResultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({ page: 1, pageSize: 5 }),
    queryFn: ({ signal }) => resultsApi.list({ page: 1, pageSize: 5, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.analytics.pendingEvaluations,
    queryFn: ({ signal }) => analyticsApi.getPendingEvaluations({ limit: 5, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const displayTitle = (examId) => {
    const exam = examMap.get(examId);
    return exam?.title || (exam && subjectNames.get(exam.subject_id)?.name) || 'Untitled exam';
  };

  const stats = statsQuery.data;
  const overview = overviewQuery.data;

  const performanceItems =
    performanceQuery.data?.map((entry) => ({
      key: entry.id,
      label: entry.examName,
      value: entry.averagePercentage,
      tone: 'navy',
    })) ?? [];

  const statusCounts = new Map(
    (statusQuery.data ?? []).map((entry) => [entry.status, entry.count])
  );

  // Recent Logins / Sessions Columns
  const sessionColumns = [
    {
      key: 'studentName',
      header: 'Student Candidate',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-text-main">{row.studentName}</p>
          <p className="text-xs font-mono text-text-muted">{row.rollNumber}</p>
        </div>
      ),
    },
    { key: 'examName', header: 'Examination' },
    { key: 'startedAt', header: 'Login / Session Started', render: (row) => formatDateTime(row.startedAt) },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: () => <StatusBadge type="assignment" status="in_progress" />,
    },
  ];

  // Recent Submissions Columns
  const recentResultsColumns = [
    {
      key: 'student',
      header: 'Student Candidate',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-text-main">
            {row.student_exam?.student?.name ?? '—'}
          </p>
          <p className="text-xs font-mono text-text-muted">{row.student_exam?.student?.roll_number}</p>
        </div>
      ),
    },
    {
      key: 'exam',
      header: 'Exam',
      render: (row) => displayTitle(row.student_exam?.exam_schedule?.exam?.id),
    },
    {
      key: 'percentage',
      header: 'Percentage',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-navy-primary">
          {formatPercentage(row.percentage)}
        </span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      align: 'right',
      render: (row) => row.grade ?? '—',
    },
    {
      key: 'published_at',
      header: 'Submitted / Published',
      render: (row) => formatDateTime(row.published_at || row.created_at),
    },
  ];

  // Recent Evaluations Columns
  const pendingColumns = [
    {
      key: 'studentName',
      header: 'Student Candidate',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-text-main">{row.studentName}</p>
          <p className="text-xs font-mono text-text-muted">{row.rollNumber}</p>
        </div>
      ),
    },
    { key: 'subjectName', header: 'Subject' },
    {
      key: 'pendingAnswers',
      header: 'Pending Answers',
      align: 'center',
      render: (row) => (
        <span className="font-semibold text-status-warning">
          {row.pendingAnswers} pending
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted Date',
      render: (row) => formatDateTime(row.submittedAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive evaluation statistics, performance metrics, and activity logs across all examinations."
      />

      {statsQuery.isError ? (
        <Alert variant="error" className="mb-6">
          Dashboard statistics could not be loaded.
        </Alert>
      ) : null}

      {/* 1. Dashboard Statistics Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-primary mb-3">
          Dashboard Overview Statistics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 print-no-break">
          <StatCard
            label="Total Students"
            value={statsQuery.isLoading ? '—' : stats?.total_students}
            icon={<Users className="w-5 h-5 text-navy-primary" aria-hidden="true" />}
            onClick={() => navigate(PATHS.STUDENTS)}
          />
          <StatCard
            label="Total Exams"
            value={statsQuery.isLoading ? '—' : stats?.total_exams}
            icon={<FileText className="w-5 h-5 text-navy-primary" aria-hidden="true" />}
            onClick={() => navigate(PATHS.EXAMS)}
          />
          <StatCard
            label="Active Exams"
            value={statsQuery.isLoading ? '—' : stats?.active_exams}
            icon={<Activity className="w-5 h-5 text-status-success" aria-hidden="true" />}
            onClick={() => navigate(PATHS.ANALYTICS_EXAMS)}
          />
          <StatCard
            label="Completed Exams"
            value={statsQuery.isLoading ? '—' : stats?.completed_exams}
            icon={<CheckCircle2 className="w-5 h-5 text-status-info" aria-hidden="true" />}
            onClick={() => navigate(PATHS.ANALYTICS_EXAMS)}
          />
          <StatCard
            label="Pending Evaluations"
            value={overviewQuery.isLoading ? '—' : overview?.pending_evaluations ?? 0}
            icon={<ClipboardCheck className="w-5 h-5 text-status-warning" aria-hidden="true" />}
            onClick={() => navigate(PATHS.EVALUATION)}
          />
        </div>
      </div>

      {/* 2. Analytics Performance Summary Cards */}
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-primary mb-3">
          Performance Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print-no-break">
          <StatCard
            label="Average Score"
            value={
              overviewQuery.isLoading
                ? '—'
                : formatPercentage(overview?.average_score ?? 0.0)
            }
            icon={<TrendingUp className="w-5 h-5 text-navy-primary" aria-hidden="true" />}
          />
          <StatCard
            label="Pass Percentage"
            value={
              overviewQuery.isLoading
                ? '—'
                : formatPercentage(overview?.pass_percentage ?? 0.0)
            }
            icon={<Award className="w-5 h-5 text-status-success" aria-hidden="true" />}
          />
          <StatCard
            label="Highest Score"
            value={
              overviewQuery.isLoading
                ? '—'
                : formatPercentage(overview?.highest_score ?? 0.0)
            }
            icon={<ArrowUpRight className="w-5 h-5 text-status-success" aria-hidden="true" />}
          />
          <StatCard
            label="Lowest Score"
            value={
              overviewQuery.isLoading
                ? '—'
                : formatPercentage(overview?.lowest_score ?? 0.0)
            }
            icon={<ArrowDownRight className="w-5 h-5 text-status-danger" aria-hidden="true" />}
          />
        </div>
      </div>

      {/* 3. Reusable Charts Section */}
      <div className="grid gap-6 xl:grid-cols-2 mt-6 print-no-break">
        <Card>
          <CardHeader className="px-5 py-4 border-b border-border-main">
            <h3 className="text-base font-semibold text-text-main">Average Performance by Examination</h3>
          </CardHeader>
          <CardBody className="p-5">
            {performanceQuery.isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : (
              <BarList
                items={performanceItems}
                valueFormatter={(value) => formatPercentage(value)}
              />
            )}
          </CardBody>
          <CardFooter className="flex justify-end px-5 py-3 border-t border-border-main bg-subtle/30">
            <DownloadCsvButton
              filename="exam-performance.csv"
              columns={[
                { key: 'examName', header: 'Exam' },
                { key: 'averagePercentage', header: 'Average %' },
                { key: 'submissions', header: 'Submissions' },
              ]}
              data={performanceQuery.data ?? []}
            />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="px-5 py-4 border-b border-border-main">
            <h3 className="text-base font-semibold text-text-main">Submission Status Distribution</h3>
          </CardHeader>
          <CardBody className="p-5">
            {statusQuery.isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : (
              <BarList
                items={STATUS_CHART_META.filter(
                  (entry) => statusCounts.get(entry.key) > 0
                ).map((entry) => ({
                  key: entry.key,
                  label: entry.label,
                  value: statusCounts.get(entry.key),
                  tone: entry.tone,
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* 4. Recent Activity Section */}
      <Card className="mt-6">
        <CardHeader className="px-5 py-4 border-b border-border-main">
          <h3 className="text-base font-semibold text-text-main">Recent System Activity</h3>
        </CardHeader>
        <CardBody className="p-5">
          <Tabs
            value={activityTab}
            onChange={setActivityTab}
            ariaLabel="Recent System Activity Tabs"
            tabs={[
              {
                id: 'sessions',
                label: 'Recent Logins & Active Sessions',
                content: (
                  <Table
                    columns={sessionColumns}
                    data={recentSessionsQuery.data ?? []}
                    rowKey="id"
                    caption="Recent student logins and active exam sessions"
                    loading={recentSessionsQuery.isLoading}
                    empty={
                      <EmptyState
                        title="No active sessions"
                        description="No active candidate logins recorded right now."
                      />
                    }
                  />
                ),
              },
              {
                id: 'submissions',
                label: 'Recent Submissions',
                content: (
                  <Table
                    columns={recentResultsColumns}
                    data={recentResultsQuery.data?.items ?? []}
                    rowKey="id"
                    caption="Recently submitted candidate exam results"
                    loading={recentResultsQuery.isLoading}
                    empty={
                      <EmptyState
                        title="No recent submissions"
                        description="Submitted candidate results will appear here."
                      />
                    }
                  />
                ),
              },
              {
                id: 'evaluations',
                label: 'Recent Evaluations',
                content: (
                  <Table
                    columns={pendingColumns}
                    data={pendingQuery.data ?? []}
                    rowKey="id"
                    caption="Submissions with pending manual evaluations"
                    loading={pendingQuery.isLoading}
                    empty={
                      <EmptyState
                        title="No pending evaluations"
                        description="All candidate submissions have been evaluated."
                      />
                    }
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
};

export default AnalyticsOverviewPage;
