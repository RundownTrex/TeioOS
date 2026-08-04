import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { examsApi } from '../api/examsApi';
import { useSubjectsReference, buildSubjectOptions } from '../../subjects/hooks/useSubjectsReference';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft (In preparation)' },
  { value: 'published', label: 'Published (Ready for scheduling)' },
];

/**
 * Exam create/edit form (docs/frontend/admin-exam-management.md §5.3).
 * Manages Title, Subject, Duration, Total Marks, Status (Draft/Published), and Instructions.
 */
export const ExamFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subjectsQuery = useSubjectsReference();

  const detailQuery = useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: ({ signal }) => examsApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: {
      title: '',
      subject_id: '',
      duration_minutes: '',
      total_marks: '',
      status: 'draft',
      instructions: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.subject_id) {
        errors.subject_id = 'Subject is required.';
      }
      const duration = Number(values.duration_minutes);
      if (!values.duration_minutes || Number.isNaN(duration) || duration <= 0) {
        errors.duration_minutes = 'Enter a duration greater than 0 minutes.';
      }
      const totalMarks = Number(values.total_marks);
      if (!values.total_marks || Number.isNaN(totalMarks) || totalMarks <= 0) {
        errors.total_marks = 'Enter total marks greater than 0.';
      }
      if (!values.status) {
        errors.status = 'Status is required.';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        title: values.title.trim() || null,
        subject_id: values.subject_id,
        duration_minutes: Number(values.duration_minutes),
        total_marks: Number(values.total_marks),
        status: values.status,
        instructions: values.instructions.trim() || null,
      };
      const saved = isEdit ? await examsApi.update(id, payload) : await examsApi.create(payload);
      toast(isEdit ? 'Exam updated' : 'Exam created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list.all });
      navigate(PATHS.examDetail(saved.id));
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset({
        title: detailQuery.data.title ?? '',
        subject_id: detailQuery.data.subject_id,
        duration_minutes: String(detailQuery.data.duration_minutes),
        total_marks: String(detailQuery.data.total_marks),
        status: detailQuery.data.status ?? 'draft',
        instructions: detailQuery.data.instructions ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, detailQuery.data]);

  if (isEdit && detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ErrorState
        title="Exam not found"
        message="The exam you are trying to edit does not exist or has been removed."
        retryLabel="Back to Exams"
        onRetry={() => navigate(PATHS.EXAMS)}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={isEdit && id ? PATHS.examDetail(id) : PATHS.EXAMS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        {isEdit ? 'Back to Exam' : 'Back to Exams'}
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Exam' : 'New Exam'}
        description="Configure exam title, subject, duration, marks, draft/published status, and guidelines."
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <Input
              id="title"
              name="title"
              label="Title"
              value={form.values.title ?? ''}
              onChange={(event) => form.setValue('title', event.target.value)}
              error={form.errors.title}
              helperText="Optional. Leave blank to use the subject name."
              maxLength={255}
              autoFocus
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="subject_id"
                name="subject_id"
                label="Subject"
                value={form.values.subject_id ?? ''}
                onChange={(event) => form.setValue('subject_id', event.target.value)}
                options={buildSubjectOptions(subjectsQuery.data)}
                placeholder="Select a subject"
                error={form.errors.subject_id}
                isRequired
              />

              <Select
                id="status"
                name="status"
                label="Exam Status"
                value={form.values.status ?? 'draft'}
                onChange={(event) => form.setValue('status', event.target.value)}
                options={STATUS_OPTIONS}
                error={form.errors.status}
                isRequired
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="duration_minutes"
                name="duration_minutes"
                label="Duration (minutes)"
                type="number"
                min="1"
                step="1"
                value={form.values.duration_minutes ?? ''}
                onChange={(event) => form.setValue('duration_minutes', event.target.value)}
                error={form.errors.duration_minutes}
                helperText="How long candidates have to complete the exam."
                isRequired
              />

              <Input
                id="total_marks"
                name="total_marks"
                label="Total Marks"
                type="number"
                min="1"
                step="1"
                value={form.values.total_marks ?? ''}
                onChange={(event) => form.setValue('total_marks', event.target.value)}
                error={form.errors.total_marks}
                helperText="The overall maximum score for this exam."
                isRequired
              />
            </div>

            <Textarea
              id="instructions"
              name="instructions"
              label="Examination Instructions"
              value={form.values.instructions ?? ''}
              onChange={(event) => form.setValue('instructions', event.target.value)}
              error={form.errors.instructions}
              placeholder="Enter guidelines, rules, or instructions for candidates taking this exam…"
              helperText="Optional guidelines displayed to candidate at the beginning of the exam."
              rows={4}
            />
          </CardBody>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              isDisabled={form.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={form.isSubmitting}>
              {isEdit ? 'Save Changes' : 'Create Exam'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ExamFormPage;
