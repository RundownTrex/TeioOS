import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Activity, CheckCircle2, ClipboardCheck } from 'lucide-react';

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

import { dashboardApi } from '../../dashboard/api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { resultsApi } from '../../results/api/resultsApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';
import { formatDateTime, formatPercent } from '../../../utils/formatters';

const STATUS_CHART_META = [
  { key: 'submitted', label: 'Submitted', tone: 'success' },
  { key: 'auto_submitted', label: 'Auto Submitted', tone: 'success' },
  { key: 'in_progress', label: 'In Progress', tone: 'info' },
  { key: 'pending', label: 'Yet to Start', tone: 'warning' },
  { key: 'expired', label: 'Expired', tone: 'danger' },
  { key: 'terminated', label: 'Terminated', tone: 'danger' },
];

/**
 * Dashboard Analytics (docs/frontend/admin-analytics-monitoring.md §4.4):
 * statistics cards, charts (BarList), and summary tables. All aggregates
 * come from the real /admin/analytics/* endpoints.
 */
export const AnalyticsOverviewPage = () => {
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => dashboardApi.getStats({ signal }),
  });

  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: () => analyticsApi.getOverview(),
  });

  const performanceQuery = useQuery({
    queryKey: queryKeys.analytics.examPerformance,
    queryFn: () => analyticsApi.getExamPerformance(),
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.analytics.submissionStatus,
    queryFn: () => analyticsApi.getSubmissionStatus(),
  });

  const recentResultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({ page: 1, pageSize: 5 }),
    queryFn: ({ signal }) => resultsApi.list({ page: 1, pageSize: 5, signal }),
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.analytics.pendingEvaluations,
    queryFn: () => analyticsApi.getPendingEvaluations(),
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
  const pendingEvaluations = overviewQuery.data?.pending_evaluations ?? 0;

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

  const recentResultsColumns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-main">
            {row.student_exam?.student?.name ?? '—'}
          </p>
          <p className="text-xs text-text-muted">{row.student_exam?.student?.roll_number}</p>
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
      render: (row) => formatPercent(row.percentage),
    },
    {
      key: 'grade',
      header: 'Grade',
      align: 'right',
      render: (row) => row.grade ?? '—',
    },
    {
      key: 'evaluation_status',
      header: 'Evaluation',
      render: (row) => <StatusBadge type="evaluation" status={row.evaluation_status} />,
    },
    {
      key: 'published_at',
      header: 'Published',
      render: (row) => formatDateTime(row.published_at),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard Analytics"
        description="A snapshot of examination activity across the institution."
      />

      {statsQuery.isError ? (
        <Alert variant="error" className="mb-6">
          The dashboard statistics could not be loaded.
        </Alert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5 print-no-break">
        <StatCard
          label="Total Students"
          value={statsQuery.isLoading ? '—' : stats?.total_students}
          icon={<Users className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.STUDENTS)}
        />
        <StatCard
          label="Total Exams"
          value={statsQuery.isLoading ? '—' : stats?.total_exams}
          icon={<FileText className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.EXAMS)}
        />
        <StatCard
          label="Active Exams"
          value={statsQuery.isLoading ? '—' : stats?.active_exams}
          icon={<Activity className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.ANALYTICS_EXAMS)}
        />
        <StatCard
          label="Completed Exams"
          value={statsQuery.isLoading ? '—' : stats?.completed_exams}
          icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.ANALYTICS_EXAMS)}
        />
        <StatCard
          label="Pending Evaluations"
          value={overviewQuery.isLoading ? '—' : pendingEvaluations}
          icon={<ClipboardCheck className="w-5 h-5" aria-hidden="true" />}
          onClick={() => navigate(PATHS.EVALUATION)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2 mt-6 print-no-break">
        <Card>
          <CardHeader>Average performance by exam</CardHeader>
          <CardBody>
            {performanceQuery.isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : (
              <BarList
                items={performanceItems}
                valueFormatter={(value) => formatPercent(value)}
              />
            )}
          </CardBody>
          <CardFooter className="flex justify-end">
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
          <CardHeader>Submission status distribution</CardHeader>
          <CardBody>
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

      <Card className="mt-6">
        <CardHeader>Recent results</CardHeader>
        <Table
          columns={recentResultsColumns}
          data={recentResultsQuery.data?.items ?? []}
          rowKey="id"
          caption="Recently published exam results"
          loading={recentResultsQuery.isLoading}
          empty={
            <EmptyState
              title="No results yet"
              description="Published results will appear here."
            />
          }
        />
      </Card>

      <Card className="mt-6 print-no-break">
        <CardHeader>Pending evaluations</CardHeader>
        <CardBody>
          {pendingQuery.isError ? (
            <Alert variant="error">Pending evaluations could not be loaded.</Alert>
          ) : (
            <Table
              columns={[
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
                {
                  key: 'submittedAt',
                  header: 'Submitted',
                  render: (row) => formatDateTime(row.submittedAt),
                },
              ]}
              data={pendingQuery.data ?? []}
              rowKey="id"
              caption="Descriptive answers awaiting manual evaluation"
              empty={
                <EmptyState
                  title="No pending evaluations"
                  description="All descriptive answers have been evaluated."
                />
              }
            />
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default AnalyticsOverviewPage;
