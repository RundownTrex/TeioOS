import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, ChevronLeft } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Alert } from '../../../components/ui/Alert';

import { studentsApi } from '../../students/api/studentsApi';
import { resultsApi } from '../../results/api/resultsApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';
import { formatDateTime, formatMarks, formatPercent } from '../../../utils/formatters';

/**
 * Student Results Report (docs/frontend/admin-analytics-monitoring.md §4.4).
 * Real data: GET /admin/results/?student_id= — printable via window.print().
 */
export const StudentResultsReportPage = () => {
  const [studentId, setStudentId] = useState('');
  const [reportStudentId, setReportStudentId] = useState(null);
  const [page, setPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(10);

  const studentsQuery = useQuery({
    queryKey: queryKeys.students.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      studentsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
  });

  const resultsQuery = useQuery({
    queryKey: queryKeys.results.list.by({ page, pageSize, studentId: reportStudentId }),
    queryFn: ({ signal }) =>
      resultsApi.list({ page, pageSize, studentId: reportStudentId, signal }),
    enabled: Boolean(reportStudentId),
  });

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const examMap = buildExamMap(examsQuery.data);
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const displayTitle = (examId) => {
    const exam = examMap.get(examId);
    return exam?.title || (exam && subjectNames.get(exam.subject_id)?.name) || 'Untitled exam';
  };

  const studentOptions = (studentsQuery.data?.items ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => ({
      value: student.id,
      label: `${student.roll_number} — ${student.name}`,
    }));

  const selectedStudent = (studentsQuery.data?.items ?? []).find((s) => s.id === reportStudentId);

  const generate = (event) => {
    event.preventDefault();
    if (!studentId) return;
    setPage(PAGINATION.DEFAULT_PAGE);
    setReportStudentId(studentId);
  };

  const columns = [
    {
      key: 'exam',
      header: 'Exam',
      render: (row) => displayTitle(row.student_exam?.exam_schedule?.exam?.id),
    },
    {
      key: 'obtained_marks',
      header: 'Obtained',
      align: 'right',
      render: (row) =>
        `${formatMarks(row.obtained_marks)} / ${formatMarks(row.student_exam?.exam_schedule?.exam?.total_marks ?? 0)}`,
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

  const data = resultsQuery.data;

  return (
    <>
      <PageHeader
        title="Student Results Report"
        description="Marks, grades, and evaluation status for a single student."
        actions={
          <Button variant="ghost" size="md" onClick={() => window.print()} disabled={!data?.items?.length}>
            <Printer className="w-5 h-5" aria-hidden="true" />
            Print report
          </Button>
        }
      />

      <Card>
        <CardBody>
          <form onSubmit={generate} className="flex flex-wrap items-end gap-4">
            <div className="w-full max-w-md">
              <Select
                id="student"
                name="student"
                label="Student"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                options={studentOptions}
                placeholder="Select a student…"
                required
              />
            </div>
            <Button type="submit" disabled={!studentId}>
              Generate report
            </Button>
          </form>
        </CardBody>
      </Card>

      {resultsQuery.isError && (
        <Alert variant="error" className="mt-6">
          Results could not be loaded.
        </Alert>
      )}

      {reportStudentId && (
        <Card className="mt-6 print-report-table">
          <CardHeader>Report</CardHeader>
          <CardBody>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 mb-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Generated</dt>
                <dd className="text-text-main font-medium tabular-nums">
                  {formatDateTime(new Date().toISOString())}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Student</dt>
                <dd className="text-text-main font-medium">
                  {selectedStudent?.name ?? '—'} ({selectedStudent?.roll_number ?? '—'})
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Exams</dt>
                <dd className="text-text-main font-medium tabular-nums">{data?.total ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted">Average %</dt>
                <dd className="text-text-main font-medium tabular-nums">
                  {data?.items?.length
                    ? formatPercent(
                        data.items.reduce((sum, r) => sum + r.percentage, 0) / data.items.length,
                      )
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardBody>
          <Table
            columns={columns}
            data={data?.items ?? []}
            rowKey="id"
            caption={`Results for ${selectedStudent?.name ?? 'selected student'}`}
            loading={resultsQuery.isLoading}
            empty={
              <EmptyState
                title="No results"
                description="This student has no published results yet."
              />
            }
          />
          <CardFooter>
            <div className="flex justify-end">
              <Pagination
                page={data?.page ?? 1}
                pageSize={data?.page_size ?? pageSize}
                total={data?.total ?? 0}
                pageSizeOptions={[10, 20, 50]}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </CardFooter>
        </Card>
      )}

      <Link
        to={PATHS.REPORTS}
        className="mt-6 inline-flex items-center gap-1 text-sm text-navy-primary hover:text-navy-hover"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        All reports
      </Link>
    </>
  );
};

export default StudentResultsReportPage;
