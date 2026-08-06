import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, ChevronLeft } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { BarList } from '../../../components/ui/BarList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';

import { examsApi } from '../../exams/api/examsApi';
import { schedulesApi } from '../../schedules/api/schedulesApi';
import { resultsApi } from '../../results/api/resultsApi';
import { useExamsReference, buildExamOptions } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, PASS_PERCENTAGE } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';
import { formatDateTime, formatNumber, formatPercent } from '../../../utils/formatters';
import { downloadCsv } from '../../../utils/downloadCsv';

const MARKS_BUCKETS = [
  { label: '0–19%', min: 0, max: 19.99 },
  { label: '20–39%', min: 20, max: 39.99 },
  { label: '40–59%', min: 40, max: 59.99 },
  { label: '60–79%', min: 60, max: 79.99 },
  { label: '80–100%', min: 80, max: 100 },
];

/**
 * Exam Summary Report
 * Real data: exam detail + schedules + published results (aggregates and
 * marks distribution computed client-side; results capped at max page size).
 */
export const ExamSummaryReportPage = () => {
  const [examId, setExamId] = useState('');
  const [reportExamId, setReportExamId] = useState(null);

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const examDetailQuery = useQuery({
    queryKey: queryKeys.exams.detail(reportExamId),
    queryFn: ({ signal }) => examsApi.detail(reportExamId, { signal }),
    enabled: Boolean(reportExamId),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId }),
    queryFn: ({ signal }) =>
      schedulesApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId, signal }),
    enabled: Boolean(reportExamId),
  });

  const resultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId }),
    queryFn: ({ signal }) =>
      resultsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId, signal }),
    enabled: Boolean(reportExamId),
  });

  const exam = examDetailQuery.data;

  const summary = useMemo(() => {
    const items = resultsQuery.data?.items ?? [];
    if (!items.length) return null;
    const percentages = items.map((result) => result.percentage);
    const passCount = items.filter((result) => result.percentage >= PASS_PERCENTAGE).length;
    return {
      submissions: items.length,
      average: percentages.reduce((sum, value) => sum + value, 0) / items.length,
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      passCount,
      failCount: items.length - passCount,
      passPercentage: (passCount / items.length) * 100,
    };
  }, [resultsQuery.data]);

  const distribution = useMemo(() => {
    const items = resultsQuery.data?.items ?? [];
    return MARKS_BUCKETS.map((bucket) => ({
      key: bucket.label,
      label: bucket.label,
      value: items.filter((result) => result.percentage >= bucket.min && result.percentage <= bucket.max)
        .length,
      tone: bucket.min >= PASS_PERCENTAGE ? 'success' : 'warning',
    }));
  }, [resultsQuery.data]);

  const generate = (event) => {
    event.preventDefault();
    if (!examId) return;
    setReportExamId(examId);
  };

  const handleExportCsv = () => {
    const items = resultsQuery.data?.items ?? [];
    if (!items.length) return;
    const headers = [
      'Candidate Name',
      'Roll Number',
      'Obtained Marks',
      'Exam Total Marks',
      'Percentage',
      'Grade',
      'Published Date',
    ];
    const rows = items.map((r) => [
      r.student_exam?.student?.name ?? '—',
      r.student_exam?.student?.roll_number ?? '—',
      formatNumber(r.obtained_marks),
      formatNumber(r.student_exam?.exam_schedule?.exam?.total_marks ?? 0),
      formatPercent(r.percentage),
      r.grade ?? '—',
      formatDateTime(r.published_at),
    ]);
    const examTitleClean = exam?.title ? exam.title.replace(/\s+/g, '_') : 'exam';
    downloadCsv(`exam-summary-report-${examTitleClean}.csv`, headers, rows);
  };

  const scheduleColumns = [
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

  const participantColumns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-main">{row.student_exam?.student?.name}</p>
          <p className="text-xs text-text-muted">{row.student_exam?.student?.roll_number}</p>
        </div>
      ),
    },
    {
      key: 'obtained_marks',
      header: 'Obtained',
      align: 'right',
      render: (row) =>
        `${formatNumber(row.obtained_marks)} / ${formatNumber(row.student_exam?.exam_schedule?.exam?.total_marks ?? 0)}`,
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
      key: 'published_at',
      header: 'Published',
      render: (row) => formatDateTime(row.published_at),
    },
  ];

  return (
    <>
      <PageHeader
        title="Exam Summary"
        description="Performance summary, pass rate, and marks distribution for one exam."
        actions={
          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="md"
              onClick={handleExportCsv}
              disabled={!resultsQuery.data?.items?.length}
            >
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.print()}
              disabled={!resultsQuery.data?.items?.length}
            >
              <Printer className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Print report
            </Button>
          </div>
        }
      />

      <Card className="no-print">
        <CardBody>
          <form onSubmit={generate} className="flex flex-wrap items-end gap-4">
            <div className="w-full max-w-md">
              <Select
                id="exam"
                name="exam"
                label="Exam"
                value={examId}
                onChange={(event) => setExamId(event.target.value)}
                options={buildExamOptions(examsQuery.data, subjectNames)}
                placeholder="Select an exam…"
                required
              />
            </div>
            <Button type="submit" disabled={!examId}>
              Generate report
            </Button>
          </form>
        </CardBody>
      </Card>

      {resultsQuery.isError && (
        <Alert variant="error" className="mt-6 no-print">
          Exam data could not be loaded.
        </Alert>
      )}

      {reportExamId && (
        <>
          {exam && (
            <Card className="mt-6 print-no-break">
              <CardHeader className="bg-subtle/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-text-main">Official Examination Summary Report</h2>
                  <span className="text-xs font-mono text-text-muted">TeioOS Examination System</span>
                </div>
              </CardHeader>
              <CardBody>
                <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Exam Title</dt>
                    <dd className="text-text-main font-medium">{exam.title || 'Untitled exam'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Subject</dt>
                    <dd className="text-text-main font-medium">
                      {subjectNames.get(exam.subject_id)?.name ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Total Marks</dt>
                    <dd className="text-text-main font-medium tabular-nums">{exam.total_marks}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Duration</dt>
                    <dd className="text-text-main font-medium tabular-nums">
                      {exam.duration_minutes} min
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          )}

          {summary && (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5 mt-6 print-no-break">
                <StatCard label="Submissions" value={summary.submissions} />
                <StatCard label="Average %" value={formatPercent(summary.average)} />
                <StatCard label="Highest" value={formatPercent(summary.highest)} />
                <StatCard label="Lowest" value={formatPercent(summary.lowest)} />
                <StatCard
                  label="Pass %"
                  value={formatPercent(summary.passPercentage)}
                  hint={`${summary.passCount} passed / ${summary.failCount} failed`}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2 mt-6">
                <Card className="print-no-break">
                  <CardHeader>Marks Distribution</CardHeader>
                  <CardBody>
                    <BarList
                      items={distribution}
                      valueFormatter={(value) => `${value} student${value === 1 ? '' : 's'}`}
                    />
                  </CardBody>
                </Card>

                <Card className="print-no-break">
                  <CardHeader>Schedules</CardHeader>
                  <Table
                    columns={scheduleColumns}
                    data={schedulesQuery.data?.items ?? []}
                    rowKey="id"
                    caption="Schedules for this exam"
                    loading={schedulesQuery.isLoading}
                    empty={<EmptyState title="No schedules" description="This exam has no schedules." />}
                  />
                </Card>
              </div>

              <Card className="mt-6 print-report-table">
                <CardHeader>Candidate Results Summary</CardHeader>
                <Table
                  columns={participantColumns}
                  data={resultsQuery.data?.items ?? []}
                  rowKey="id"
                  caption="Students with published results for this exam"
                  loading={resultsQuery.isLoading}
                  empty={
                    <EmptyState
                      title="No results"
                      description="No results have been published for this exam yet."
                    />
                  }
                />
                <CardFooter className="text-xs text-text-muted no-print">
                  Results are capped at {PAGINATION.MAX_PAGE_SIZE} per report; pass threshold is{' '}
                  {PASS_PERCENTAGE}%.
                </CardFooter>
              </Card>
            </>
          )}
        </>
      )}

      <Link
        to={PATHS.REPORTS}
        className="mt-6 inline-flex items-center gap-1 text-sm text-navy-primary hover:text-navy-hover no-print"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        All reports
      </Link>
    </>
  );
};

export default ExamSummaryReportPage;
