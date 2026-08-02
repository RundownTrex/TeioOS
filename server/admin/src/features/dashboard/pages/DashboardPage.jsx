import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FileText,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { Spinner } from '../../../components/ui/Spinner';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatusBadge } from '../../../components/ui/StatusBadge';

import { dashboardApi } from '../api/dashboardApi';
import { analyticsApi } from '../../analytics/api/analyticsApi';
import { schedulesApi } from '../../schedules/api/schedulesApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';

import { queryKeys } from '../../../utils/queryKeys';
import { QUERY_DEFAULTS, PAGINATION } from '../../../utils/constants';
import {
  formatNumber,
  formatPercent,
  formatTime,
  formatRelativeTime,
} from '../../../utils/formatters';
import { announceToScreenReader } from '../../../utils/ariaAnnounce';
import { PATHS } from '../../../routes/paths';

const PAGE_SIZE = PAGINATION.MAX_PAGE_SIZE;

const LINK_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary rounded';

const STAT_DEFS = [
  {
    label: 'Students',
    key: 'total_students',
    format: formatNumber,
    hint: 'registered students',
    icon: <Users className="w-5 h-5" aria-hidden="true" />,
    path: PATHS.STUDENTS,
  },
  {
    label: 'Active Exams',
    key: 'active_exams',
    format: formatNumber,
    hint: 'schedules in progress',
    icon: <Activity className="w-5 h-5" aria-hidden="true" />,
    path: PATHS.SCHEDULES,
  },
  {
    label: 'Upcoming Exams',
    key: 'upcoming_exams',
    format: formatNumber,
    hint: 'scheduled examinations',
    icon: <CalendarClock className="w-5 h-5" aria-hidden="true" />,
    path: PATHS.SCHEDULES,
  },
  {
    label: 'Average Score',
    key: 'average_score',
    format: formatPercent,
    hint: 'across published results',
    icon: <BarChart3 className="w-5 h-5" aria-hidden="true" />,
    path: PATHS.RESULTS,
  },
];

const QUICK_ACTIONS = [
  { label: 'New Exam', path: PATHS.EXAMS_NEW, icon: <FileText className="w-4 h-4" aria-hidden="true" /> },
  { label: 'New Schedule', path: PATHS.SCHEDULES_NEW, icon: <CalendarClock className="w-4 h-4" aria-hidden="true" /> },
  { label: 'New Student', path: PATHS.STUDENTS_NEW, icon: <UserPlus className="w-4 h-4" aria-hidden="true" /> },
  { label: 'Evaluation Queue', path: PATHS.EVALUATION, icon: <ClipboardCheck className="w-4 h-4" aria-hidden="true" /> },
  { label: 'Results', path: PATHS.RESULTS, icon: <BarChart3 className="w-4 h-4" aria-hidden="true" /> },
  { label: 'Exam Schedules', path: PATHS.SCHEDULES, icon: <CalendarDays className="w-4 h-4" aria-hidden="true" /> },
];

const WidgetError = ({ message = 'This widget could not be loaded.', onRetry }) => (
  <CardBody>
    <Alert variant="error" className="mb-3">
      {message}
    </Alert>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Retry
    </Button>
  </CardBody>
);

/**
 * Administrator dashboard homepage (see docs/frontend/admin-dashboard-page.md).
 * Snapshot widgets: stats, today's examinations, quick actions, pending
 * evaluations, recent activity, recently created exams.
 */
export const DashboardPage = () => {
  const navigate = useNavigate();
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => dashboardApi.getStats({ signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({ pageSize: PAGE_SIZE }),
    queryFn: ({ signal }) => schedulesApi.list({ page: 1, pageSize: PAGE_SIZE, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIVE_MS,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.analytics.pendingEvaluations,
    queryFn: () => analyticsApi.getPendingEvaluations(),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const subjectNameForExam = (examId) => {
    const exam = examMap.get(examId);
    return (exam && subjectNames.get(exam.subject_id)?.name) || 'Exam';
  };

  const todaySchedules = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return (schedulesQuery.data?.items ?? [])
      .map((schedule) => ({ schedule, start: new Date(schedule.start_time) }))
      .filter(({ start }) => start >= startOfDay && start < endOfDay)
      .sort((a, b) => a.start - b.start)
      .map(({ schedule }) => schedule);
  }, [schedulesQuery.data]);

  const recentExams = useMemo(
    () =>
      (examsQuery.data?.items ?? [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [examsQuery.data]
  );

  const recentActivity = statsQuery.data?.recent_activity ?? [];
  const pendingEvaluations = pendingQuery.data ?? [];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      statsQuery.refetch(),
      schedulesQuery.refetch(),
      examsQuery.refetch(),
      subjectsQuery.refetch(),
      pendingQuery.refetch(),
    ]);
    setLastSyncedAt(new Date());
    setIsRefreshing(false);
    announceToScreenReader('Dashboard data refreshed.', 'polite');
  }, [statsQuery, schedulesQuery, examsQuery, subjectsQuery, pendingQuery]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A snapshot of examinations, students and assessment work across the platform."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted hidden sm:inline">
              Last synced {formatTime(lastSyncedAt)}
            </span>
            <IconButton
              label="Refresh dashboard data"
              onClick={handleRefresh}
              isDisabled={isRefreshing}
              icon={
                isRefreshing ? (
                  <Spinner size="sm" label="Refreshing..." />
                ) : (
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                )
              }
            />
          </div>
        }
      />

      {/* Statistics cards */}
      {statsQuery.isError ? (
        <Alert variant="error" className="mb-6">
          The dashboard statistics could not be loaded.{' '}
          <button
            type="button"
            onClick={() => statsQuery.refetch()}
            className="underline font-medium text-text-main ml-1"
          >
            Retry
          </button>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {STAT_DEFS.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={
                statsQuery.isLoading
                  ? '—'
                  : stat.format(statsQuery.data?.[stat.key])
              }
              hint={stat.hint}
              icon={stat.icon}
              onClick={() => navigate(stat.path)}
            />
          ))}
        </div>
      )}

      {/* Row: today's examinations + quick actions */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">Today's Examinations</h2>
              <Link
                to={PATHS.SCHEDULES}
                className={`text-sm font-medium text-navy-primary hover:text-navy-hover ${LINK_FOCUS}`}
              >
                View all
              </Link>
            </div>
          </CardHeader>

          {schedulesQuery.isError ? (
            <WidgetError onRetry={() => schedulesQuery.refetch()} />
          ) : schedulesQuery.isLoading ? (
            <CardBody>
              <LoadingSkeleton count={3} />
            </CardBody>
          ) : todaySchedules.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<CalendarClock className="w-8 h-8 text-text-muted" aria-hidden="true" />}
                title="No examinations today"
                description="No exam schedules fall within today's local date window."
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-border-main">
              {todaySchedules.map((schedule) => (
                <li
                  key={schedule.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text-main truncate">
                      {subjectNameForExam(schedule.exam_id)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                    </span>
                  </div>
                  <StatusBadge type="schedule" status={schedule.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardBody>
            <ul className="grid grid-cols-2 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.path}>
                  <Link
                    to={action.path}
                    className={`flex items-center gap-2.5 p-3 rounded-lg text-sm font-medium text-text-main hover:bg-subtle ${LINK_FOCUS}`}
                  >
                    <span className="text-text-muted shrink-0">{action.icon}</span>
                    <span className="min-w-0">{action.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Row: pending evaluations + recent activity + recently created exams */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold flex items-center gap-2">
                Pending Evaluations
                {pendingEvaluations.length > 0 && (
                  <Badge variant="warning">{pendingEvaluations.length}</Badge>
                )}
              </h2>
              <Link
                to={PATHS.EVALUATION}
                className={`text-sm font-medium text-navy-primary hover:text-navy-hover ${LINK_FOCUS}`}
              >
                Open queue
              </Link>
            </div>
          </CardHeader>

          {pendingQuery.isError ? (
            <WidgetError onRetry={() => pendingQuery.refetch()} />
          ) : pendingQuery.isLoading ? (
            <CardBody>
              <LoadingSkeleton count={4} />
            </CardBody>
          ) : pendingEvaluations.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<ClipboardCheck className="w-8 h-8 text-text-muted" aria-hidden="true" />}
                title="Nothing waiting"
                description="All descriptive answers have been evaluated."
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-border-main">
              {pendingEvaluations.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text-main truncate">
                      {item.studentName}
                    </span>
                    <span className="text-xs text-text-muted">
                      {item.rollNumber} · {item.subjectName}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-medium text-text-main tabular-nums">
                      {item.pendingAnswers} {item.pendingAnswers === 1 ? 'answer' : 'answers'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatRelativeTime(item.submittedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </CardHeader>

          {statsQuery.isError ? (
            <WidgetError onRetry={() => statsQuery.refetch()} />
          ) : statsQuery.isLoading ? (
            <CardBody>
              <LoadingSkeleton count={4} />
            </CardBody>
          ) : recentActivity.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<FileCheck2 className="w-8 h-8 text-text-muted" aria-hidden="true" />}
                title="No activity yet"
                description="Published results will appear here as they are generated."
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-border-main">
              {recentActivity.map((activity) => {
                const student = activity.student_exam?.student;
                return (
                  <li key={activity.id}>
                    <Link
                      to={PATHS.resultDetail(activity.id)}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-subtle ${LINK_FOCUS}`}
                    >
                      <span
                        className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <FileCheck2 className="w-4 h-4 text-text-muted" />
                      </span>
                      <span className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-text-main truncate">
                          {student?.name || 'Unknown student'}
                        </span>
                        <span className="text-xs text-text-muted">
                          {student?.roll_number || ''} · Result published
                        </span>
                      </span>
                      <span className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-semibold text-text-main tabular-nums">
                          {formatPercent(activity.percentage)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatRelativeTime(activity.published_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">Recently Created Exams</h2>
              <Link
                to={PATHS.EXAMS}
                className={`text-sm font-medium text-navy-primary hover:text-navy-hover ${LINK_FOCUS}`}
              >
                View all
              </Link>
            </div>
          </CardHeader>

          {examsQuery.isError ? (
            <WidgetError onRetry={() => examsQuery.refetch()} />
          ) : examsQuery.isLoading ? (
            <CardBody>
              <LoadingSkeleton count={4} />
            </CardBody>
          ) : recentExams.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<FileText className="w-8 h-8 text-text-muted" aria-hidden="true" />}
                title="No exams created yet"
                description="Create your first exam to see it listed here."
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-border-main">
              {recentExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text-main truncate">
                      {exam.title || subjectNames.get(exam.subject_id)?.name || 'Exam'}
                    </span>
                    <span className="text-xs text-text-muted tabular-nums">
                      {formatNumber(exam.total_marks)} marks · {exam.duration_minutes} min
                    </span>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">
                    {formatRelativeTime(exam.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
