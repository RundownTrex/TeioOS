import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, Pencil, Trash2 } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Tabs } from '../../../components/ui/Tabs';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { examsApi } from '../api/examsApi';
import { questionsApi } from '../api/questionsApi';
import { QuestionPreviewModal } from '../components/QuestionPreviewModal';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatMarks, formatNumber } from '../../../utils/formatters';
import { PAGINATION } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const TABS = {
  ALL: 'all',
  MCQ: 'mcq',
  DESCRIPTIVE: 'descriptive',
};

const QUESTIONS_PAGE_SIZE = PAGINATION.MAX_PAGE_SIZE;

const reorderItems = (items, draggedId, targetId) => {
  const from = items.findIndex((item) => item.id === draggedId);
  if (from === -1) return items;
  let to = targetId ? items.findIndex((item) => item.id === targetId) : items.length;
  if (to === -1) to = items.length;
  const reordered = items.slice();
  const [moved] = reordered.splice(from, 1);
  if (from < to) to -= 1;
  reordered.splice(to, 0, moved);
  return reordered;
};

const swapItems = (items, indexA, indexB) => {
  const reordered = items.slice();
  const [a] = reordered.splice(indexA, 1);
  reordered.splice(indexB, 0, a);
  return reordered;
};

const withSequentialOrders = (items) =>
  items.map((question, index) => ({ ...question, display_order: index + 1 }));

/**
 * Exam detail page (docs/frontend/admin-exam-management.md §5.4).
 * Header card, live marks summary, question management with keyboard
 * (Move up/down) and pointer (drag-and-drop) reordering.
 */
export const ExamDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState(TABS.ALL);
  const [draggedId, setDraggedId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [pendingDeleteExam, setPendingDeleteExam] = useState(null);
  const [deleteExamError, setDeleteExamError] = useState(null);

  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const examQuery = useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: ({ signal }) => examsApi.detail(id, { signal }),
  });

  const questionsQuery = useQuery({
    queryKey: queryKeys.questions.list.by({ page: 1, pageSize: QUESTIONS_PAGE_SIZE, examId: id }),
    queryFn: ({ signal }) =>
      questionsApi.list({ page: 1, pageSize: QUESTIONS_PAGE_SIZE, examId: id, signal }),
  });

  const applyOrder = (nextItems) => {
    const reordered = withSequentialOrders(nextItems);
    queryClient.setQueryData(
      queryKeys.questions.list.by({ page: 1, pageSize: QUESTIONS_PAGE_SIZE, examId: id }),
      (old) => (old ? { ...old, items: reordered } : old)
    );
    return reordered;
  };

  const reorderMutation = useMutation({
    mutationFn: (orderedIds) => questionsApi.reorder(id, orderedIds),
    onSuccess: () => {
      toast('Question order updated', { type: 'success' });
    },
    onError: (error) => {
      toast(error?.message || 'The question order could not be updated.', { type: 'error' });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.list.all });
    },
  });

  const move = (questionId, direction) => {
    const items = questionsQuery.data?.items ?? [];
    const index = items.findIndex((item) => item.id === questionId);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= items.length) return;
    const reordered = swapItems(items, index, target);
    applyOrder(reordered);
    reorderMutation.mutate(reordered.map((item) => item.id));
  };

  const onDrop = (event) => {
    event.preventDefault();
    if (draggedId && overId !== draggedId) {
      const items = questionsQuery.data?.items ?? [];
      const targetId = overId === '__end__' ? null : overId;
      applyOrder(reorderItems(items, draggedId, targetId));
      reorderMutation.mutate(
        reorderItems(items, draggedId, targetId).map((item) => item.id)
      );
    }
    setDraggedId(null);
    setOverId(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (questionId) => questionsApi.remove(questionId),
    onSuccess: () => {
      toast('Question deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.list.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(id) });
    },
    onError: (error) => {
      if (error?.status === 400 || error?.status === 404) {
        setDeleteError(error?.message || 'The question cannot be deleted.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.list.all });
      toast(error?.message || 'The question could not be deleted.', { type: 'error' });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: (examId) => examsApi.remove(examId),
    onSuccess: () => {
      toast('Exam deleted', { type: 'success' });
      setPendingDeleteExam(null);
      setDeleteExamError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
      navigate(PATHS.EXAMS);
    },
    onError: (error) => {
      if (error?.status === 400) {
        setDeleteExamError(error?.message || 'The exam cannot be deleted.');
        return;
      }
      setPendingDeleteExam(null);
      setDeleteExamError(null);
      toast(error?.message || 'The exam could not be deleted.', { type: 'error' });
    },
  });

  if (examQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (examQuery.isError) {
    return (
      <ErrorState
        title="Exam not found"
        message="The exam does not exist or has been removed."
        retryLabel="Back to Exams"
        onRetry={() => navigate(PATHS.EXAMS)}
      />
    );
  }

  const exam = examQuery.data;
  const subjectName = subjectNames.get(exam.subject_id)?.name;
  const examTitle = exam.title || subjectName || 'Untitled exam';

  const items = questionsQuery.data?.items ?? [];
  const allocated = items.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);
  const mcqCount = items.filter((question) => question.question_type === 'MCQ').length;
  const descriptiveCount = items.length - mcqCount;
  const marksBalanced = Math.abs(allocated - exam.total_marks) < 0.005;

  const visibleItems =
    tab === TABS.ALL
      ? items
      : items.filter((question) =>
          tab === TABS.MCQ ? question.question_type === 'MCQ' : question.question_type === 'DESCRIPTIVE'
        );

  const questionRow = (question, position, index, listLength) => {
    const isDragging = draggedId === question.id;
    const isDropTarget = overId === question.id;
    return (
      <li
        key={question.id}
        onDragOver={(event) => {
          event.preventDefault();
          setOverId(question.id);
        }}
        onDragLeave={() => setOverId((current) => (current === question.id ? null : current))}
        onDrop={onDrop}
        className={`flex items-center gap-3 border-b border-border-main px-4 py-3 transition-colors ${
          isDragging ? 'opacity-50' : ''
        } ${isDropTarget ? 'bg-surface-hover ring-2 ring-inset ring-navy-primary' : ''}`}
      >
        <span
          aria-hidden="true"
          draggable
          onDragStart={() => setDraggedId(question.id)}
          onDragEnd={() => {
            setDraggedId(null);
            setOverId(null);
          }}
          className="cursor-grab touch-none text-text-muted hover:text-navy-primary"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-text-muted">
          {position}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-text-main" title={question.question_text}>
          {question.question_text}
        </p>
        <Badge variant={question.question_type === 'MCQ' ? 'info' : 'purple'}>
          {question.question_type === 'MCQ' ? 'MCQ' : 'Descriptive'}
        </Badge>
        <span className="w-16 shrink-0 text-right text-sm tabular-nums text-text-main">
          {formatMarks(question.marks)}
        </span>
        <span className="w-16 shrink-0 text-right text-sm tabular-nums text-text-muted">
          {question.question_type === 'MCQ' && question.negative_marks > 0
            ? `−${formatMarks(question.negative_marks)}`
            : '—'}
        </span>
        <span className="w-16 shrink-0 text-right text-sm tabular-nums text-text-muted">
          {question.question_type === 'DESCRIPTIVE' && question.max_characters
            ? formatNumber(question.max_characters)
            : '—'}
        </span>
        <Menu
          label={`Actions for question ${position}`}
          align="right"
          items={[
            {
              key: 'preview',
              label: 'Preview',
              onSelect: () => setPreviewQuestion(question),
            },
            {
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.questionEdit(id, question.id)),
            },
            {
              key: 'move-up',
              label: 'Move up',
              disabled: index === 0,
              onSelect: () => move(question.id, 'up'),
            },
            {
              key: 'move-down',
              label: 'Move down',
              disabled: index === listLength - 1,
              onSelect: () => move(question.id, 'down'),
            },
            {
              key: 'delete',
              label: 'Delete',
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete(question);
              },
            },
          ]}
        />
      </li>
    );
  };

  const tabContent = (
    <div>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {visibleItems.length} question{visibleItems.length === 1 ? '' : 's'}
          {tab !== TABS.ALL ? ` · ${tab === TABS.MCQ ? 'MCQ' : 'Descriptive'}` : ''}
        </p>
        <Button variant="primary" onClick={() => navigate(PATHS.questionNew(id))}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Question
        </Button>
      </div>
      <div className="flex items-center gap-3 px-4 pb-2 text-xs text-text-muted">
        <span className="w-4" aria-hidden="true" />
        <span className="w-7 text-center">#</span>
        <span className="flex-1">Question</span>
        <span className="w-16 text-right">Marks</span>
        <span className="w-16 text-right">Neg.</span>
        <span className="w-16 text-right">Max</span>
        <span className="w-8" aria-hidden="true" />
      </div>
      {items.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No questions yet"
            description="Add MCQ or descriptive questions to build this exam."
            actionLabel="New Question"
            onAction={() => navigate(PATHS.questionNew(id))}
          />
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-muted">
          No {tab === TABS.MCQ ? 'MCQ' : 'descriptive'} questions in this exam.
        </p>
      ) : (
        <ul
          aria-label="Exam questions"
          onDragOver={(event) => {
            event.preventDefault();
            if (event.target === event.currentTarget) setOverId('__end__');
          }}
          onDrop={onDrop}
          className="list-none m-0 p-0 pb-2"
        >
          {visibleItems.map((question) => {
            const fullIndex = items.findIndex((item) => item.id === question.id);
            return questionRow(question, fullIndex + 1, fullIndex, items.length);
          })}
        </ul>
      )}
      <p className="sr-only">
        Reorder questions using the Move up and Move down actions or the drag handle.
      </p>
    </div>
  );

  return (
    <>
      <PageHeader
        title={examTitle}
        description={
          subjectName
            ? `${subjectName} · ${formatNumber(exam.duration_minutes)} minutes · ${formatNumber(exam.total_marks)} total marks`
            : `${formatNumber(exam.duration_minutes)} minutes · ${formatNumber(exam.total_marks)} total marks`
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(PATHS.examEdit(id))}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit Exam
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteError(null);
                setPendingDeleteExam(exam);
              }}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete Exam
            </Button>
            <Button variant="primary" onClick={() => navigate(PATHS.questionNew(id))}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Question
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-main">
                {formatMarks(allocated)} of {formatNumber(exam.total_marks)} marks allocated
              </p>
              <p className="mt-1 text-xs text-text-muted" aria-live="polite">
                {mcqCount} MCQ · {descriptiveCount} descriptive ·{' '}
                {formatNumber(exam.question_count ?? items.length)} questions total
              </p>
            </div>
            {marksBalanced ? (
              <Badge variant="success">Balanced</Badge>
            ) : (
              <Badge variant="warning">
                {allocated > exam.total_marks ? 'Over' : 'Under'}
              </Badge>
            )}
          </div>
          {!marksBalanced && (
            <Alert variant="warning" className="mx-5 mb-4">
              Allocated marks ({formatMarks(allocated)}) differ from the exam total (
              {formatNumber(exam.total_marks)}). Adjust question marks or the exam's total marks.
            </Alert>
          )}
          {(exam.question_count ?? items.length) === 0 && (
            <Alert variant="info" className="mx-5 mb-4">
              This exam has no questions yet. Add questions before scheduling it.
            </Alert>
          )}
        </Card>
        <Card>
          <div className="space-y-1 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Subject</span>
              <span className="font-medium text-text-main">{subjectName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Duration</span>
              <span className="font-medium text-text-main">
                {formatNumber(exam.duration_minutes)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Total marks</span>
              <span className="font-medium text-text-main">{formatNumber(exam.total_marks)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Questions</span>
              <span className="font-medium text-text-main">
                {formatNumber(exam.question_count ?? items.length)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Tabs
          ariaLabel="Question types"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: TABS.ALL, label: `All (${items.length})`, content: tabContent },
            { id: TABS.MCQ, label: `MCQ (${mcqCount})`, content: tabContent },
            { id: TABS.DESCRIPTIVE, label: `Descriptive (${descriptiveCount})`, content: tabContent },
          ]}
        />
      </Card>

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete question?"
        message={`Delete question ${pendingDelete ? `“${pendingDelete.question_text.slice(0, 60)}${pendingDelete.question_text.length > 60 ? '…' : ''}”` : ''}? Student answers for this question are also deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      >
        {deleteError && <Alert variant="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmationDialog>

      <ConfirmationDialog
        open={Boolean(pendingDeleteExam)}
        title="Delete exam?"
        message={`Delete “${examTitle}”? This permanently removes the exam and its questions. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteExamMutation.isPending}
        onConfirm={() => pendingDeleteExam && deleteExamMutation.mutate(pendingDeleteExam.id)}
        onCancel={() => {
          setPendingDeleteExam(null);
          setDeleteExamError(null);
        }}
      >
        {deleteExamError && <Alert variant="error" className="mt-4">{deleteExamError}</Alert>}
      </ConfirmationDialog>

      <QuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} />
    </>
  );
};

export default ExamDetailPage;
