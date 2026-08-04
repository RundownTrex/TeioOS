import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Key, School, Accessibility } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Menu } from '../../../components/ui/Menu';

import { studentsApi } from '../api/studentsApi';
import { useClassesReference, buildClassNameMap, buildClassOptions } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentNameMap } from '../../departments/hooks/useDepartmentsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDate } from '../../../utils/formatters';
import {
  ACCESSIBILITY_PROFILE_OPTIONS,
  ACCESSIBILITY_PROFILE_DESCRIPTIONS,
  ACCESSIBILITY_PROFILES,
  QUERY_DEFAULTS,
} from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PROFILE_LABELS = ACCESSIBILITY_PROFILE_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option.label }),
  {}
);

/**
 * Students list page (docs/frontend/admin-students.md §5.1).
 * Search (name/roll), class and status filters; URL-synced pagination;
 * Quick actions for Reset Password, Assign Class, and Assign Accessibility Profile.
 */
export const StudentsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'class_id', 'status'] });

  // Dialog & Modal States
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [assignClassStudent, setAssignClassStudent] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [assignProfileStudent, setAssignProfileStudent] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState('');

  const [resetPasswordStudent, setResetPasswordStudent] = useState(null);
  const [newDob, setNewDob] = useState('');

  const classesQuery = useClassesReference();
  const departmentsQuery = useDepartmentsReference();
  const classNames = buildClassNameMap(classesQuery.data);
  const departmentNames = buildDepartmentNameMap(departmentsQuery.data);

  const isActive =
    filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined;

  const listQuery = useQuery({
    queryKey: queryKeys.students.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      classId: filters.class_id || undefined,
      isActive,
    }),
    queryFn: ({ signal }) =>
      studentsApi.list({
        page,
        pageSize,
        q: filters.q,
        classId: filters.class_id,
        isActive,
        signal,
      }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_LIST_MS,
    placeholderData: (prev) => prev,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => studentsApi.remove(id),
    onSuccess: () => {
      toast('Student deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      if (error?.status === 400) {
        setDeleteError(error?.message || 'The student cannot be deleted.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
      toast(error?.message || 'The student could not be deleted.', { type: 'error' });
    },
  });

  // Assign Class Mutation
  const assignClassMutation = useMutation({
    mutationFn: ({ id, classId }) => studentsApi.assignClass(id, classId),
    onSuccess: () => {
      toast('Class re-assigned successfully', { type: 'success' });
      setAssignClassStudent(null);
      setSelectedClassId('');
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to assign class.', { type: 'error' });
    },
  });

  // Assign Accessibility Profile Mutation
  const assignProfileMutation = useMutation({
    mutationFn: ({ id, profile }) => studentsApi.assignAccessibilityProfile(id, profile),
    onSuccess: () => {
      toast('Accessibility profile updated', { type: 'success' });
      setAssignProfileStudent(null);
      setSelectedProfile('');
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update accessibility profile.', { type: 'error' });
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, dateOfBirth }) => studentsApi.resetPassword(id, dateOfBirth),
    onSuccess: () => {
      toast('Password reset successfully to candidate date of birth', { type: 'success' });
      setResetPasswordStudent(null);
      setNewDob('');
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to reset password.', { type: 'error' });
    },
  });

  const data = listQuery.data;

  const columns = [
    { key: 'roll_number', header: 'Roll Number' },
    { key: 'name', header: 'Name' },
    {
      key: 'class_id',
      header: 'Class',
      render: (row) => {
        const classObj = classNames.get(row.class_id);
        if (!classObj) return '—';
        const departmentName = departmentNames.get(classObj.department_id);
        return departmentName ? `${classObj.name} · ${departmentName}` : classObj.name;
      },
    },
    { key: 'date_of_birth', header: 'Date of Birth', render: (row) => formatDate(row.date_of_birth) },
    {
      key: 'accessibility_profile',
      header: 'Accommodation',
      render: (row) => (
        <Badge variant={row.accessibility_profile === ACCESSIBILITY_PROFILES.STANDARD ? 'neutral' : 'purple'}>
          {PROFILE_LABELS[row.accessibility_profile] || row.accessibility_profile}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="neutral" dot>Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label={`Actions for ${row.name} (${row.roll_number})`}
          items={[
            {
              key: 'view',
              label: 'View Profile',
              onSelect: () => navigate(PATHS.studentDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.studentEdit(row.id)),
            },
            {
              key: 'assign-class',
              label: 'Assign Class',
              icon: <School className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => {
                setAssignClassStudent(row);
                setSelectedClassId(row.class_id || '');
              },
            },
            {
              key: 'assign-profile',
              label: 'Assign Accessibility Profile',
              icon: <Accessibility className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => {
                setAssignProfileStudent(row);
                setSelectedProfile(row.accessibility_profile || ACCESSIBILITY_PROFILES.STANDARD);
              },
            },
            {
              key: 'reset-password',
              label: 'Reset Password',
              icon: <Key className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => {
                setResetPasswordStudent(row);
                setNewDob(row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : '');
              },
            },
            {
              key: 'delete',
              label: 'Delete',
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete({ id: row.id, name: row.name, rollNumber: row.roll_number });
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
      <PageHeader
        title="Students"
        description="Manage student accounts, class assignments, and accessibility accommodations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/*
              ARCHITECTURE EXTENSION POINT: Future Bulk CSV Import Button
              When CSV import is added in future milestones, render:
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Import CSV
              </Button>
            */}
            <Button variant="primary" onClick={() => navigate(PATHS.STUDENTS_NEW)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Student
            </Button>
          </div>
        }
      />

      <Card>
        <Filters
          fields={[
            {
              name: 'q',
              label: 'Search students',
              placeholder: 'Search by name or roll number…',
            },
            {
              name: 'class_id',
              label: 'Class',
              type: 'select',
              placeholder: 'All classes',
              options: classesQuery.data?.items?.map((item) => ({
                value: item.id,
                label: departmentNames.get(item.department_id)
                  ? `${item.name} · ${departmentNames.get(item.department_id)}`
                  : item.name,
              })) ?? [],
            },
            {
              name: 'status',
              label: 'Status',
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
          caption="List of students"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Students could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            hasFilters ? (
              <p className="text-sm text-text-muted">
                No students match the current filters. Clear the filters to see all students.
              </p>
            ) : undefined
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

      {/* Assign Class Modal */}
      <Modal
        open={Boolean(assignClassStudent)}
        onClose={() => setAssignClassStudent(null)}
        title={`Assign Class for ${assignClassStudent?.name ?? ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAssignClassStudent(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignClassMutation.isPending}
              isDisabled={!selectedClassId}
              onClick={() =>
                assignClassStudent &&
                assignClassMutation.mutate({
                  id: assignClassStudent.id,
                  classId: selectedClassId,
                })
              }
            >
              Assign Class
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Select the new academic class to assign to candidate{' '}
            <strong className="text-text-main">{assignClassStudent?.name}</strong> ({assignClassStudent?.roll_number}).
          </p>
          <Select
            id="assign-class-select"
            label="Target Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={buildClassOptions(classesQuery.data, departmentNames)}
            placeholder="Select a class"
            isRequired
          />
        </div>
      </Modal>

      {/* Assign Accessibility Profile Modal */}
      <Modal
        open={Boolean(assignProfileStudent)}
        onClose={() => setAssignProfileStudent(null)}
        title={`Assign Accommodation Profile for ${assignProfileStudent?.name ?? ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAssignProfileStudent(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignProfileMutation.isPending}
              onClick={() =>
                assignProfileStudent &&
                assignProfileMutation.mutate({
                  id: assignProfileStudent.id,
                  profile: selectedProfile,
                })
              }
            >
              Update Accommodation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Select the accessibility profile for candidate{' '}
            <strong className="text-text-main">{assignProfileStudent?.name}</strong>. Accommodations are automatically enforced by the TeioOS candidate exam client.
          </p>
          <Select
            id="assign-profile-select"
            label="Accessibility Profile"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            options={ACCESSIBILITY_PROFILE_OPTIONS}
            helperText={ACCESSIBILITY_PROFILE_DESCRIPTIONS[selectedProfile]}
            isRequired
          />
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={Boolean(resetPasswordStudent)}
        onClose={() => setResetPasswordStudent(null)}
        title={`Reset Password for ${resetPasswordStudent?.name ?? ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResetPasswordStudent(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={resetPasswordMutation.isPending}
              isDisabled={!newDob}
              onClick={() =>
                resetPasswordStudent &&
                resetPasswordMutation.mutate({
                  id: resetPasswordStudent.id,
                  dateOfBirth: newDob,
                })
              }
            >
              Reset Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            In TeioOS, a candidate's password is set to their date of birth (<code className="font-mono text-xs">YYYY-MM-DD</code>). Confirm or update the date of birth below to reset the password.
          </p>
          <Input
            id="reset-dob-input"
            label="Date of Birth (Password)"
            type="date"
            value={newDob}
            onChange={(e) => setNewDob(e.target.value)}
            isRequired
            helperText="The candidate will log in using this date of birth (YYYY-MM-DD)."
          />
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete student?"
        message={`Delete “${pendingDelete?.name ?? ''}” (${pendingDelete?.rollNumber ?? ''})? Their exam records will also be removed. This action cannot be undone.`}
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
    </>
  );
};

export default StudentsListPage;
