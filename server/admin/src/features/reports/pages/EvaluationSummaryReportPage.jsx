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
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';

import { resultsApi } from '../../results/api/resultsApi';
import { useExamsReference, buildExamOptions } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';
import { formatDateTime, formatPercent } from '../../../utils/formatters';
import { downloadCsv } from '../../../utils/downloadCsv';

/**
 * Evaluation Summary Report
 * Real data: results filtered by exam — evaluation status counts computed
 * client-side from the result set (capped at max page size).
 */
export const EvaluationSummaryReportPage = () => {
  const [examId, setExamId] = useState('');
  const [reportExamId, setReportExamId] = useState(null);

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const resultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId }),
    queryFn: ({ signal }) =>
      resultsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, examId: reportExamId, signal }),
    enabled: Boolean(reportExamId),
  });

  const counts = useMemo(() => {
    const items = resultsQuery.data?.items ?? [];
    return items.reduce(
      (acc, result) => {
        acc[result.evaluation_status] = (acc[result.evaluation_status] ?? 0) + 1;
        return acc;
      },
      { PENDING: 0, PARTIALLY_EVALUATED: 0, COMPLETED: 0 },
    );
  }, [resultsQuery.data]);

  const generate = (event) => {
    event.preventDefault();
    if (!examId) return;
    setReportExamId(examId);
  };

  const handleExportCsv = () => {
    const items = resultsQuery.data?.items ?? [];
    if (!items.length) return;
    const headers = ['Student Candidate', 'Roll Number', 'Percentage', 'Grade', 'Evaluation Status', 'Published Date'];
    const rows = items.map((r) => [
      r.student_exam?.student?.name ?? '—',
      r.student_exam?.student?.roll_number ?? '—',
      formatPercent(r.percentage),
      r.grade ?? '—',
      r.evaluation_status,
      formatDateTime(r.published_at),
    ]);
    const examObj = (examsQuery.data?.items ?? []).find((e) => e.id === reportExamId);
    const examTitleClean = examObj?.title ? examObj.title.replace(/\s+/g, '_') : 'exam';
    downloadCsv(`evaluation-summary-report-${examTitleClean}.csv`, headers, rows);
  };

  const columns = [
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
        title="Evaluation Summary"
        description="Evaluation progress and pending work for one exam."
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
          Results could not be loaded.
        </Alert>
      )}

      {reportExamId && (
        <>
          <div className="grid gap-6 md:grid-cols-3 mt-6 print-no-break">
            <StatCard
              label="Pending Evaluation"
              value={counts.PENDING ?? 0}
              hint="Awaiting manual marking"
            />
            <StatCard
              label="Partially Evaluated"
              value={counts.PARTIALLY_EVALUATED ?? 0}
              hint="Some answers remain"
            />
            <StatCard
              label="Evaluated"
              value={counts.COMPLETED ?? 0}
              hint="Fully evaluated"
            />
          </div>

          <Card className="mt-6 print-report-table">
            <CardHeader className="bg-subtle/50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text-main">Official Evaluation Status Report</h2>
                <span className="text-xs font-mono text-text-muted">TeioOS Examination System</span>
              </div>
            </CardHeader>
            <Table
              columns={columns}
              data={resultsQuery.data?.items ?? []}
              rowKey="id"
              caption="Evaluation status of published results for this exam"
              loading={resultsQuery.isLoading}
              empty={
                <EmptyState
                  title="No results"
                  description="No results have been published for this exam yet."
                />
              }
            />
            <CardFooter className="text-xs text-text-muted no-print">
              Results are capped at {PAGINATION.MAX_PAGE_SIZE} per report.
            </CardFooter>
          </Card>
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

export default EvaluationSummaryReportPage;
