import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, UserPlus, Users, Building, Upload, Trash2, Clock, CheckCircle, Search } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { schedulesApi } from '../api/schedulesApi';
import { studentAssignmentsApi } from '../api/studentAssignmentsApi';
import { studentsApi } from '../../students/api/studentsApi';
import { useExamsReference, buildExamMap } from '../../exams/hooks/useExamsReference';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useClassesReference, buildClassOptions, buildClassMap } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentOptions } from '../../departments/hooks/useDepartmentsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { QUERY_DEFAULTS } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending (Not started)' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'auto_submitted', label: 'Auto Submitted' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
];

/**
 * Student Assignment Management Page
 * Supports assigning exam schedule to:
 * 1. Individual Student
 * 2. Entire Class
 * 3. Entire Department
 * Includes search, filtering, removal, per-student duration overrides,
 * and future bulk CSV import architecture extension point.
 */
export const ScheduleAssignmentsPage = () => {
  const navigate = useNavigate();
  const { id: scheduleId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'class_id', 'status'] });

  // Modal States
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [overrideStudent, setOverrideStudent] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [removeError, setRemoveError] = useState(null);

  // Form States for Modals
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [individualDuration, setIndividualDuration] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [overrideDurationInput, setOverrideDurationInput] = useState('');
  const [modalError, setModalError] = useState(null);

  // Reference Queries
  const examsQuery = useExamsReference();
  const subjectsQuery = useSubjectsReference();
  const classesQuery = useClassesReference();
  const deptsQuery = useDepartmentsReference();

  const examMap = buildExamMap(examsQuery.data);
  const subjectMap = buildSubjectNameMap(subjectsQuery.data);
  const classMap = buildClassMap(classesQuery.data);

  // Schedule Detail Query
  const scheduleQuery = useQuery({
    queryKey: queryKeys.schedules.detail(scheduleId),
    queryFn: ({ signal }) => schedulesApi.detail(scheduleId, { signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_DETAIL_MS,
  });

  // Assigned Students List Query
  const assignmentsQuery = useQuery({
    queryKey: queryKeys.schedules.assignments.by(scheduleId, {
      page,
      pageSize,
      q: filters.q || undefined,
      classId: filters.class_id || undefined,
      status: filters.status || undefined,
    }),
    queryFn: ({ signal }) =>
      studentAssignmentsApi.list({
        scheduleId,
        page,
        pageSize,
        q: filters.q,
        classId: filters.class_id,
        status: filters.status,
        signal,
      }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
    placeholderData: (prev) => prev,
  });

  // All Students Reference Query for Individual Assign Modal
  const allStudentsQuery = useQuery({
    queryKey: queryKeys.students.list.by({ page: 1, pageSize: 100 }),
    queryFn: ({ signal }) => studentsApi.list({ page: 1, pageSize: 100, signal }),
    enabled: isIndividualModalOpen,
  });

  // Mutations
  const assignStudentMutation = useMutation({
    mutationFn: (payload) => studentAssignmentsApi.assignStudent(scheduleId, payload),
    onSuccess: () => {
      toast('Student assigned successfully', { type: 'success' });
      setIsIndividualModalOpen(false);
      setSelectedStudentId('');
      setIndividualDuration('');
      setModalError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.assignments.all(scheduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.detail(scheduleId) });
    },
    onError: (error) => {
      setModalError(error?.message || 'Failed to assign student.');
    },
  });

  const assignClassMutation = useMutation({
    mutationFn: (payload) => studentAssignmentsApi.assignClass(scheduleId, payload),
    onSuccess: (data) => {
      toast(`Class assigned: ${data.assigned} newly assigned, ${data.skipped} skipped`, { type: 'success' });
      setIsClassModalOpen(false);
      setSelectedClassId('');
      setModalError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.assignments.all(scheduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.detail(scheduleId) });
    },
    onError: (error) => {
      setModalError(error?.message || 'Failed to assign class.');
    },
  });

  const assignDeptMutation = useMutation({
    mutationFn: (payload) => studentAssignmentsApi.assignDepartment(scheduleId, payload),
    onSuccess: (data) => {
      toast(`Department assigned: ${data.assigned} newly assigned, ${data.skipped} skipped`, { type: 'success' });
      setIsDeptModalOpen(false);
      setSelectedDeptId('');
      setModalError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.assignments.all(scheduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.detail(scheduleId) });
    },
    onError: (error) => {
      setModalError(error?.message || 'Failed to assign department.');
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ studentId, data }) => studentAssignmentsApi.updateAssignment(scheduleId, studentId, data),
    onSuccess: () => {
      toast('Candidate duration override updated', { type: 'success' });
      setOverrideStudent(null);
      setOverrideDurationInput('');
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.assignments.all(scheduleId) });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update candidate duration.', { type: 'error' });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (studentId) => studentAssignmentsApi.removeAssignment(scheduleId, studentId),
    onSuccess: () => {
      toast('Student assignment removed', { type: 'success' });
      setPendingRemove(null);
      setRemoveError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.assignments.all(scheduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.detail(scheduleId) });
    },
    onError: (error) => {
      setRemoveError(error?.message || 'Failed to remove assignment.');
      toast(error?.message || 'Failed to remove assignment.', { type: 'error' });
    },
  });

  if (scheduleQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (scheduleQuery.isError) {
    return (
      <ErrorState
        title="Schedule not found"
        message="The schedule does not exist or has been removed."
        retryLabel="Back to Schedules"
        onRetry={() => navigate(PATHS.SCHEDULES)}
      />
    );
  }

  const schedule = scheduleQuery.data;
  const exam = examMap.get(schedule.exam_id);
  const subjectName = exam ? subjectMap.get(exam.subject_id)?.name : null;
  const examTitle = exam?.title || subjectName || 'Untitled Exam';

  const data = assignmentsQuery.data;

  const columns = [
    {
      key: 'roll_number',
      header: 'Roll Number',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-text-main">
          {row.student?.roll_number ?? '—'}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-main">{row.student?.name ?? '—'}</p>
          <p className="text-xs text-text-muted">
            {row.student?.class_id ? classMap.get(row.student.class_id)?.name : 'Class N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="assignment" status={row.status} />,
    },
    {
      key: 'started_at',
      header: 'Session Started',
      render: (row) => (row.started_at ? formatDateTime(row.started_at) : 'Not started'),
    },
    {
      key: 'duration_override',
      header: 'Duration Limit',
      render: (row) =>
        row.individual_duration_minutes ? (
          <Badge variant="purple">{row.individual_duration_minutes} min (Override)</Badge>
        ) : (
          <span className="text-xs text-text-muted">
            {exam ? `${exam.duration_minutes} min (Default)` : 'Default'}
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label="Assignment actions"
          items={[
            {
              key: 'override-time',
              label: 'Set Duration Override',
              onSelect: () => {
                setOverrideStudent(row);
                setOverrideDurationInput(
                  row.individual_duration_minutes ? String(row.individual_duration_minutes) : ''
                );
              },
            },
            {
              key: 'remove',
              label: 'Remove Assignment',
              danger: true,
              onSelect: () => {
                setRemoveError(null);
                setPendingRemove(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(filters.q || filters.class_id || filters.status);

  return (
    <>
      <Link to={PATHS.SCHEDULES} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Schedules
      </Link>

      <PageHeader
        title={`Student Assignments: ${examTitle}`}
        description="Assign candidates individually, by class, or by department to this examination schedule."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setModalError(null);
                setIsIndividualModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Assign Student
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setModalError(null);
                setIsClassModalOpen(true);
              }}
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              Assign Class
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setModalError(null);
                setIsDeptModalOpen(true);
              }}
            >
              <Building className="w-4 h-4" aria-hidden="true" />
              Assign Department
            </Button>

            <Button
              variant="outline"
              isDisabled
              title="CSV Import is prepared in architecture for future enablement."
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Import CSV
            </Button>
          </div>
        }
      />

      {/* Schedule Summary Header Card */}
      <Card className="mb-5">
        <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-text-muted block text-xs">Availability Window</span>
            <span className="font-semibold text-text-main block">
              {formatDateTime(schedule.start_time)}
            </span>
            <span className="text-xs text-text-muted block">to {formatDateTime(schedule.end_time)}</span>
          </div>
          <div>
            <span className="text-text-muted block text-xs">Default Duration</span>
            <span className="font-semibold text-text-main">{exam ? `${exam.duration_minutes} mins` : '—'}</span>
          </div>
          <div>
            <span className="text-text-muted block text-xs">Schedule Status</span>
            <Badge variant="info">{schedule.status}</Badge>
          </div>
          <div>
            <span className="text-text-muted block text-xs">Assigned Candidates</span>
            <span className="font-semibold text-navy-primary text-base">
              {formatNumber(schedule.assigned_count ?? data?.total ?? 0)} candidates
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <Filters
          fields={[
            {
              name: 'q',
              label: 'Search assigned students',
              placeholder: 'Search by student name or roll number…',
            },
            {
              name: 'class_id',
              label: 'Class',
              type: 'select',
              placeholder: 'All classes',
              options: buildClassOptions(classesQuery.data),
            },
            {
              name: 'status',
              label: 'Assignment Status',
              type: 'select',
              placeholder: 'All statuses',
              options: STATUS_OPTIONS,
            },
          ]}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="Assigned students list"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={assignmentsQuery.isFetching}
          error={
            assignmentsQuery.isError ? (
              <Alert variant="error">Assigned students could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            hasFilters ? (
              <p className="text-sm text-text-muted">
                No assigned students match your current search or filters.
              </p>
            ) : (
              <p className="text-sm text-text-muted">
                No students assigned to this schedule yet. Click "Assign Student", "Assign Class", or "Assign Department" to begin.
              </p>
            )
          }
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Individual Student Assignment Modal */}
      <Modal
        open={isIndividualModalOpen}
        onClose={() => setIsIndividualModalOpen(false)}
        title="Assign Individual Student"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsIndividualModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignStudentMutation.isPending}
              onClick={() => {
                if (!selectedStudentId) {
                  setModalError('Please select a student.');
                  return;
                }
                assignStudentMutation.mutate({
                  student_id: selectedStudentId,
                  individual_duration_minutes: individualDuration ? Number(individualDuration) : null,
                });
              }}
            >
              Assign Student
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}

          <Select
            id="modal_student_id"
            name="student_id"
            label="Select Student"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={(allStudentsQuery.data?.items ?? []).map((s) => ({
              value: s.id,
              label: `${s.roll_number} — ${s.name} (${classMap.get(s.class_id)?.name ?? 'Class N/A'})`,
            }))}
            placeholder="Select a student…"
            isRequired
          />

          <Input
            id="modal_individual_duration"
            name="individual_duration_minutes"
            label="Individual Duration Override (Minutes)"
            type="number"
            min="1"
            max="720"
            value={individualDuration}
            onChange={(e) => setIndividualDuration(e.target.value)}
            placeholder={`Default: ${exam?.duration_minutes ?? 90} minutes`}
            helperText="Optional. Leave blank to use the default exam duration."
          />
        </div>
      </Modal>

      {/* Class Assignment Modal */}
      <Modal
        open={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Assign Entire Class"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignClassMutation.isPending}
              onClick={() => {
                if (!selectedClassId) {
                  setModalError('Please select a class.');
                  return;
                }
                assignClassMutation.mutate({ class_id: selectedClassId });
              }}
            >
              Assign Entire Class
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}

          <Select
            id="modal_class_id"
            name="class_id"
            label="Select Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={buildClassOptions(classesQuery.data)}
            placeholder="Select a class…"
            isRequired
          />

          <Alert variant="info">
            All active students enrolled in the selected class will be assigned to this schedule. Existing assignments are preserved.
          </Alert>
        </div>
      </Modal>

      {/* Department Assignment Modal */}
      <Modal
        open={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Assign Entire Department"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignDeptMutation.isPending}
              onClick={() => {
                if (!selectedDeptId) {
                  setModalError('Please select a department.');
                  return;
                }
                assignDeptMutation.mutate({ department_id: selectedDeptId });
              }}
            >
              Assign Entire Department
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}

          <Select
            id="modal_dept_id"
            name="department_id"
            label="Select Department"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            options={buildDepartmentOptions(deptsQuery.data)}
            placeholder="Select a department…"
            isRequired
          />

          <Alert variant="info">
            All active students across all classes belonging to the selected department will be assigned to this schedule. Duplicate assignments will be automatically skipped.
          </Alert>
        </div>
      </Modal>

      {/* Override Candidate Duration Modal */}
      <Modal
        open={Boolean(overrideStudent)}
        onClose={() => setOverrideStudent(null)}
        title={`Set Duration Override: ${overrideStudent?.student?.name ?? ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOverrideStudent(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={updateAssignmentMutation.isPending}
              onClick={() => {
                if (!overrideStudent) return;
                const duration = overrideDurationInput.trim() ? Number(overrideDurationInput) : null;
                updateAssignmentMutation.mutate({
                  studentId: overrideStudent.student_id,
                  data: { individual_duration_minutes: duration },
                });
              }}
            >
              Save Duration
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="modal_override_duration_input"
            name="overrideDurationInput"
            label="Individual Candidate Duration (Minutes)"
            type="number"
            min="1"
            max="720"
            value={overrideDurationInput}
            onChange={(e) => setOverrideDurationInput(e.target.value)}
            placeholder={`Default exam duration: ${exam?.duration_minutes ?? 90} mins`}
            helperText="Clear input to revert to the default exam duration."
          />
        </div>
      </Modal>

      {/* Remove Assignment Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingRemove)}
        title="Remove student assignment?"
        message={`Remove assignment for ${pendingRemove?.student?.name ?? 'this student'}? If the student has already started or submitted an exam session, student session records will be deleted.`}
        confirmLabel="Remove Assignment"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={removeAssignmentMutation.isPending}
        onConfirm={() => pendingRemove && removeAssignmentMutation.mutate(pendingRemove.student_id)}
        onCancel={() => {
          setPendingRemove(null);
          setRemoveError(null);
        }}
      >
        {removeError && <Alert variant="error" className="mt-4">{removeError}</Alert>}
      </ConfirmationDialog>
    </>
  );
};

export default ScheduleAssignmentsPage;
