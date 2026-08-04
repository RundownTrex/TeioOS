import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Key, School, Accessibility, Trash2 } from 'lucide-react';

import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';

import { studentsApi } from '../api/studentsApi';
import { useClassesReference, buildClassNameMap, buildClassOptions } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentNameMap } from '../../departments/hooks/useDepartmentsReference';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import {
  ACCESSIBILITY_PROFILE_OPTIONS,
  ACCESSIBILITY_PROFILE_DESCRIPTIONS,
  ACCESSIBILITY_PROFILES,
} from '../../../utils/constants';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const PROFILE_LABELS = ACCESSIBILITY_PROFILE_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option.label }),
  {}
);

const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2.5 border-b border-border-main last:border-0">
    <dt className="text-sm text-text-muted">{label}</dt>
    <dd className="col-span-2 text-sm text-text-main font-medium">{children}</dd>
  </div>
);

/**
 * Read-only student profile page with management shortcuts (docs/frontend/admin-students.md §5.3).
 */
export const StudentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [isAssigningClass, setIsAssigningClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [isAssigningProfile, setIsAssigningProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('');

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newDob, setNewDob] = useState('');

  const detailQuery = useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: ({ signal }) => studentsApi.detail(id, { signal }),
    enabled: Boolean(id),
  });

  const classesQuery = useClassesReference();
  const departmentsQuery = useDepartmentsReference();
  const classNames = buildClassNameMap(classesQuery.data);
  const departmentNames = buildDepartmentNameMap(departmentsQuery.data);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.remove(id),
    onSuccess: () => {
      toast('Student deleted', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
      navigate(PATHS.STUDENTS);
    },
    onError: (error) => {
      setDeleteError(error?.message || 'Failed to delete student.');
      toast(error?.message || 'Failed to delete student.', { type: 'error' });
    },
  });

  // Assign Class Mutation
  const assignClassMutation = useMutation({
    mutationFn: (classId) => studentsApi.assignClass(id, classId),
    onSuccess: () => {
      toast('Class re-assigned successfully', { type: 'success' });
      setIsAssigningClass(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to assign class.', { type: 'error' });
    },
  });

  // Assign Accessibility Profile Mutation
  const assignProfileMutation = useMutation({
    mutationFn: (profile) => studentsApi.assignAccessibilityProfile(id, profile),
    onSuccess: () => {
      toast('Accessibility profile updated', { type: 'success' });
      setIsAssigningProfile(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update accessibility profile.', { type: 'error' });
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (dateOfBirth) => studentsApi.resetPassword(id, dateOfBirth),
    onSuccess: () => {
      toast('Password reset successfully to candidate date of birth', { type: 'success' });
      setIsResettingPassword(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to reset password.', { type: 'error' });
    },
  });

  if (detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        title="Student not found"
        message="The student you are looking for does not exist or has been removed."
        retryLabel="Back to Students"
        onRetry={() => navigate(PATHS.STUDENTS)}
      />
    );
  }

  const student = detailQuery.data;
  const classObj = classNames.get(student.class_id);
  const className = classObj
    ? departmentNames.get(classObj.department_id)
      ? `${classObj.name} · ${departmentNames.get(classObj.department_id)}`
      : classObj.name
    : '—';
  const profileLabel = PROFILE_LABELS[student.accessibility_profile] || student.accessibility_profile;

  return (
    <div className="max-w-3xl">
      <Link to={PATHS.STUDENTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Students
      </Link>

      <PageHeader
        title={student.name}
        description={`Roll number: ${student.roll_number}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(PATHS.studentEdit(student.id))}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClassId(student.class_id || '');
                setIsAssigningClass(true);
              }}
            >
              <School className="w-4 h-4" aria-hidden="true" />
              Assign Class
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProfile(student.accessibility_profile || ACCESSIBILITY_PROFILES.STANDARD);
                setIsAssigningProfile(true);
              }}
            >
              <Accessibility className="w-4 h-4" aria-hidden="true" />
              Accommodation
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>Student Information</CardHeader>
        <CardBody>
          <dl className="m-0">
            <DetailRow label="Roll Number">{student.roll_number}</DetailRow>
            <DetailRow label="Date of Birth">{formatDate(student.date_of_birth)}</DetailRow>
            <DetailRow label="Class">{className}</DetailRow>
            <DetailRow label="Status">
              {student.is_active ? (
                <Badge variant="success" dot>Active</Badge>
              ) : (
                <Badge variant="neutral" dot>Inactive</Badge>
              )}
            </DetailRow>
            <DetailRow label="Accessibility Profile">
              <span className="font-medium">{profileLabel}</span>
              <p className="mt-1 text-xs text-text-muted font-normal">
                {ACCESSIBILITY_PROFILE_DESCRIPTIONS[student.accessibility_profile]}
              </p>
            </DetailRow>
            <DetailRow label="Created">{formatDateTime(student.created_at)}</DetailRow>
            <DetailRow label="Last Updated">{formatDateTime(student.updated_at)}</DetailRow>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Account Security & Management</CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">
            Candidates sign in to examinations using their roll number and their date of birth ({formatDate(student.date_of_birth)}) as their initial password.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setNewDob(student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : '');
                setIsResettingPassword(true);
              }}
            >
              <Key className="w-4 h-4" aria-hidden="true" />
              Reset Password
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                setDeleteError(null);
                setIsDeleting(true);
              }}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete Student Account
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Assign Class Modal */}
      <Modal
        open={isAssigningClass}
        onClose={() => setIsAssigningClass(false)}
        title={`Assign Class for ${student.name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAssigningClass(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignClassMutation.isPending}
              isDisabled={!selectedClassId}
              onClick={() => assignClassMutation.mutate(selectedClassId)}
            >
              Assign Class
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Select the new class to assign to candidate <strong className="text-text-main">{student.name}</strong>.
          </p>
          <Select
            id="detail-assign-class-select"
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
        open={isAssigningProfile}
        onClose={() => setIsAssigningProfile(false)}
        title={`Assign Accommodation Profile for ${student.name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAssigningProfile(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignProfileMutation.isPending}
              onClick={() => assignProfileMutation.mutate(selectedProfile)}
            >
              Update Accommodation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Select the accessibility profile for candidate <strong className="text-text-main">{student.name}</strong>. Accommodations are automatically enforced by the TeioOS candidate exam client.
          </p>
          <Select
            id="detail-assign-profile-select"
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
        open={isResettingPassword}
        onClose={() => setIsResettingPassword(false)}
        title={`Reset Password for ${student.name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsResettingPassword(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={resetPasswordMutation.isPending}
              isDisabled={!newDob}
              onClick={() => resetPasswordMutation.mutate(newDob)}
            >
              Reset Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Candidate passwords are initialized to their date of birth (<code className="font-mono text-xs">YYYY-MM-DD</code>). Confirm or update the date of birth below to reset the password.
          </p>
          <Input
            id="detail-reset-dob-input"
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
        open={isDeleting}
        title="Delete student?"
        message={`Delete “${student.name}” (${student.roll_number})? Their exam records will also be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => {
          setIsDeleting(false);
          setDeleteError(null);
        }}
      >
        {deleteError && <Alert variant="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmationDialog>
    </div>
  );
};

export default StudentDetailPage;
