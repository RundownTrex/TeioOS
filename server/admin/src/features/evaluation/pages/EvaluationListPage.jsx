import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, ArrowRight, Search, CheckCircle2, Clock } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';

import { evaluationApi } from '../api/evaluationApi';
import { QUERY_DEFAULTS } from '../../../utils/constants';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

/**
 * Pending Evaluation List Page
 * Displays submitted student exam sessions with unevaluated descriptive answers.
 */
export const EvaluationListPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingQuery = useQuery({
    queryKey: queryKeys.evaluation.pendingList,
    queryFn: ({ signal }) => evaluationApi.getPendingList({ limit: 50, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
    placeholderData: (prev) => prev,
  });

  const pendingList = useMemo(() => {
    const raw = pendingQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [pendingQuery.data]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return pendingList;
    const term = searchQuery.toLowerCase().trim();
    return pendingList.filter(
      (item) =>
        item.studentName?.toLowerCase().includes(term) ||
        item.rollNumber?.toLowerCase().includes(term) ||
        item.subjectName?.toLowerCase().includes(term)
    );
  }, [pendingList, searchQuery]);

  const columns = [
    {
      key: 'student',
      header: 'Student Candidate',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-text-main">{row.studentName}</p>
          <p className="text-xs font-mono text-text-muted">{row.rollNumber}</p>
        </div>
      ),
    },
    {
      key: 'subjectName',
      header: 'Subject / Exam',
      render: (row) => <span className="text-sm font-medium text-text-main">{row.subjectName}</span>,
    },
    {
      key: 'pendingAnswers',
      header: 'Pending Answers',
      align: 'center',
      render: (row) => (
        <Badge variant="amber">
          {row.pendingAnswers} {row.pendingAnswers === 1 ? 'answer' : 'answers'} to evaluate
        </Badge>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      render: (row) => (
        <span className="text-xs text-text-muted">{formatDateTime(row.submittedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(PATHS.evaluationWorkbench(row.id))}
        >
          Evaluate
          <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manual Evaluation Queue"
        description="Review and evaluate descriptive answer submissions for pending candidate examinations."
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border-main">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-navy-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-text-main">
              Pending Submissions ({filteredList.length})
            </h3>
          </div>
          <div className="w-full sm:w-64">
            <Input
              id="search_pending"
              name="search_pending"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search pending evaluation submissions"
            />
          </div>
        </CardHeader>

        {pendingQuery.isError ? (
          <div className="p-5">
            <Alert variant="error">Pending evaluation queue could not be loaded.</Alert>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            rowKey="id"
            caption="Pending student evaluation submissions list"
            loading={pendingQuery.isFetching}
            empty={
              <EmptyState
                title="No pending evaluations"
                description="All descriptive answers have been evaluated! No student submissions are currently awaiting manual grading."
              />
            }
          />
        )}
      </Card>
    </>
  );
};

export default EvaluationListPage;
