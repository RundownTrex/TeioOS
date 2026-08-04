import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock, Calendar, AlertCircle } from 'lucide-react';

import { Card, CardBody, CardFooter, CardHeader } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { schedulesApi } from '../api/schedulesApi';
import { useExamsReference, buildExamMap, buildExamOptions } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled (Upcoming)' },
  { value: 'active', label: 'Active (Open for entry)' },
  { value: 'completed', label: 'Completed (Closed)' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Converts a Date object or ISO string to local input datetime-local string (YYYY-MM-DDTHH:mm).
 */
const toLocalISOString = (dateOrIso) => {
  if (!dateOrIso) return '';
  const date = new Date(dateOrIso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Exam Schedule Create / Edit Form Page
 * Serves /admin/schedules/new and /admin/schedules/:id/edit.
 * Dynamically displays individual candidate duration and availability window timing.
 */
export const ScheduleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();

  const examMap = buildExamMap(examsQuery.data);
  const subjectMap = buildSubjectNameMap(subjectsQuery.data);

  const detailQuery = useQuery({
    queryKey: queryKeys.schedules.detail(id),
    queryFn: ({ signal }) => schedulesApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: {
      exam_id: '',
      start_time: '',
      end_time: '',
      status: 'scheduled',
    },
    validate: (values) => {
      const errors = {};
      if (!values.exam_id) {
        errors.exam_id = 'Please select an examination.';
      }
      if (!values.start_time) {
        errors.start_time = 'Start date and time is required.';
      }
      if (!values.end_time) {
        errors.end_time = 'End date and time is required.';
      }
      if (values.start_time && values.end_time) {
        const start = new Date(values.start_time);
        const end = new Date(values.end_time);
        if (start >= end) {
          errors.end_time = 'End date and time must be strictly after start date and time.';
        }
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        exam_id: values.exam_id,
        start_time: new Date(values.start_time).toISOString(),
        end_time: new Date(values.end_time).toISOString(),
        status: values.status,
      };

      try {
        if (isEdit) {
          await schedulesApi.update(id, payload);
        } else {
          await schedulesApi.create(payload);
        }
        toast(isEdit ? 'Schedule updated' : 'Schedule created', { type: 'success' });
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.list.all });
        navigate(PATHS.SCHEDULES);
      } catch (error) {
        if (error?.status === 409) {
          form.setSubmitError('This schedule time window overlaps with another active schedule for the same exam.');
        } else {
          form.setSubmitError(error?.message || 'Failed to save schedule.');
        }
      }
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      const schedule = detailQuery.data;
      form.reset({
        exam_id: schedule.exam_id,
        start_time: toLocalISOString(schedule.start_time),
        end_time: toLocalISOString(schedule.end_time),
        status: schedule.status ?? 'scheduled',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, detailQuery.data]);

  const selectedExam = useMemo(
    () => (form.values.exam_id ? examMap.get(form.values.exam_id) : null),
    [form.values.exam_id, examMap]
  );

  const windowDurationText = useMemo(() => {
    if (!form.values.start_time || !form.values.end_time) return null;
    const start = new Date(form.values.start_time);
    const end = new Date(form.values.end_time);
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours === 0) return `${remMin} minutes`;
    if (remMin === 0) return `${hours} hours`;
    return `${hours} hours ${remMin} minutes`;
  }, [form.values.start_time, form.values.end_time]);

  if ((isEdit && detailQuery.isLoading) || examsQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ErrorState
        title="Schedule not found"
        message="The schedule you are trying to edit does not exist or has been removed."
        retryLabel="Back to Schedules"
        onRetry={() => navigate(PATHS.SCHEDULES)}
      />
    );
  }

  const subjectName = selectedExam ? subjectMap.get(selectedExam.subject_id)?.name : null;

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.SCHEDULES} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Schedules
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Schedule' : 'New Schedule'}
        description="Set the availability window for candidates to log in and start their examination."
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-5">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <Select
              id="exam_id"
              name="exam_id"
              label="Select Examination"
              value={form.values.exam_id ?? ''}
              onChange={(event) => form.setValue('exam_id', event.target.value)}
              options={buildExamOptions(examsQuery.data, subjectMap)}
              placeholder="Select an examination…"
              error={form.errors.exam_id}
              isRequired
              autoFocus
            />

            {/* Selected Exam Information & Candidate Duration Card */}
            {selectedExam && (
              <div className="p-4 rounded-lg bg-subtle border border-border-main space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-navy-primary">
                    Examination Profile
                  </span>
                  <Badge variant="purple">Candidate Duration: {selectedExam.duration_minutes} mins</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-muted block text-xs">Title</span>
                    <span className="font-semibold text-text-main">
                      {selectedExam.title || subjectName || 'Untitled Exam'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs">Subject</span>
                    <span className="font-semibold text-text-main">{subjectName ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs">Total Marks</span>
                    <span className="font-semibold text-text-main">{selectedExam.total_marks} pts</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs">Student Timer</span>
                    <span className="font-semibold text-status-success">
                      {selectedExam.duration_minutes} minutes
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="start_time"
                name="start_time"
                label="Start Date & Time (Window Start)"
                type="datetime-local"
                value={form.values.start_time ?? ''}
                onChange={(event) => form.setValue('start_time', event.target.value)}
                error={form.errors.start_time}
                helperText="When candidates may first enter the exam."
                isRequired
              />

              <Input
                id="end_time"
                name="end_time"
                label="End Date & Time (Window End)"
                type="datetime-local"
                value={form.values.end_time ?? ''}
                onChange={(event) => form.setValue('end_time', event.target.value)}
                error={form.errors.end_time}
                helperText="When new exam sessions close."
                isRequired
              />
            </div>

            <Select
              id="status"
              name="status"
              label="Schedule Status"
              value={form.values.status ?? 'scheduled'}
              onChange={(event) => form.setValue('status', event.target.value)}
              options={STATUS_OPTIONS}
              error={form.errors.status}
              isRequired
            />

            {/* Availability Window & Timing Rules Explanation */}
            <div className="p-4 rounded-lg bg-subtle border border-border-main space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2 text-text-main font-semibold">
                <Calendar className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                <span>
                  Availability Window Duration:{' '}
                  <span className="text-navy-primary font-bold">
                    {windowDurationText ?? 'Specify start & end times'}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-border-main">
                <AlertCircle className="w-4 h-4 text-status-info shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Important Distinction:</strong> The <em>Availability Window</em> defines when candidates are permitted to start the exam. Each student will get their full <strong>{selectedExam ? `${selectedExam.duration_minutes} minutes` : 'candidate duration'}</strong> timer tracked independently by the backend upon entering the kiosk.
                </p>
              </div>
            </div>
          </CardBody>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(PATHS.SCHEDULES)}
              isDisabled={form.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={form.isSubmitting}>
              {isEdit ? 'Save Schedule' : 'Create Schedule'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ScheduleFormPage;
