import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, ChevronLeft } from 'lucide-react';

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
import { downloadCsv } from '../../../utils/downloadCsv';

/**
 * Student Results Report
 * Real data: GET /admin/results/?student_id= — printable via window.print() or exportable as CSV.
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

  const data = resultsQuery.data;

  const handleExportCsv = () => {
    if (!data?.items?.length) return;
    const headers = [
      'Candidate Name',
      'Roll Number',
      'Examination',
      'Obtained Marks',
      'Max Marks',
      'Percentage',
      'Grade',
      'Evaluation Status',
      'Published Date',
    ];
    const rows = data.items.map((row) => [
      selectedStudent?.name ?? '—',
      selectedStudent?.roll_number ?? '—',
      displayTitle(row.student_exam?.exam_schedule?.exam?.id),
      formatMarks(row.obtained_marks),
      formatMarks(row.student_exam?.exam_schedule?.exam?.total_marks ?? 0),
      formatPercent(row.percentage),
      row.grade ?? '—',
      row.evaluation_status,
      formatDateTime(row.published_at),
    ]);
    const studentNameClean = selectedStudent?.name ? selectedStudent.name.replace(/\s+/g, '_') : 'student';
    downloadCsv(`student-results-report-${studentNameClean}.csv`, headers, rows);
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

  return (
    <>
      <PageHeader
        title="Student Results Report"
        description="Marks, grades, and evaluation status for a single student."
        actions={
          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="md"
              onClick={handleExportCsv}
              disabled={!data?.items?.length}
            >
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.print()}
              disabled={!data?.items?.length}
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
        <Alert variant="error" className="mt-6 no-print">
          Results could not be loaded.
        </Alert>
      )}

      {reportStudentId && (
        <Card className="mt-6 print-report-table">
          <CardHeader className="bg-subtle/50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-main">
                Official Student Academic Performance Report
              </h2>
              <span className="text-xs font-mono text-text-muted">
                TeioOS Examination System
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 mb-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Report Generated</dt>
                <dd className="text-text-main font-medium tabular-nums">
                  {formatDateTime(new Date().toISOString())}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Candidate</dt>
                <dd className="text-text-main font-medium">
                  {selectedStudent?.name ?? '—'} ({selectedStudent?.roll_number ?? '—'})
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Exams Recorded</dt>
                <dd className="text-text-main font-medium tabular-nums">{data?.total ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-muted font-bold">Average Percentage</dt>
                <dd className="text-text-main font-medium tabular-nums font-bold">
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
          <CardFooter className="no-print">
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
        className="mt-6 inline-flex items-center gap-1 text-sm text-navy-primary hover:text-navy-hover no-print"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        All reports
      </Link>
    </>
  );
};

export default StudentResultsReportPage;
