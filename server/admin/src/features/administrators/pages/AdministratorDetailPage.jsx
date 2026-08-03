import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Key, UserX, UserCheck, Trash2 } from 'lucide-react';

import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';
import { PasswordInput } from '../../../components/ui/PasswordInput';

import { administratorsApi } from '../api/administratorsApi';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDateTime } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2.5 border-b border-border-main last:border-0">
    <dt className="text-sm text-text-muted">{label}</dt>
    <dd className="col-span-2 text-sm text-text-main font-medium">{children}</dd>
  </div>
);

/**
 * Detailed view for an administrator user profile.
 */
export const AdministratorDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const detailQuery = useQuery({
    queryKey: queryKeys.administrators.detail(id),
    queryFn: ({ signal }) => administratorsApi.detail(id, { signal }),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => administratorsApi.remove(id),
    onSuccess: () => {
      toast('Administrator account deleted', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.list.all });
      navigate(PATHS.ADMINISTRATORS);
    },
    onError: (error) => {
      setDeleteError(error?.message || 'Failed to delete administrator account.');
      toast(error?.message || 'Failed to delete administrator account.', { type: 'error' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (is_active) => administratorsApi.toggleStatus(id, is_active),
    onSuccess: (_, is_active) => {
      const actionText = is_active ? 'enabled' : 'disabled';
      toast(`Administrator account ${actionText}`, { type: 'success' });
      setIsTogglingStatus(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.list.all });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update account status.', { type: 'error' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (password) => administratorsApi.changePassword(id, password),
    onSuccess: () => {
      toast('Password changed successfully', { type: 'success' });
      closePasswordModal();
    },
    onError: (error) => {
      setPasswordError(error?.message || 'Failed to change password.');
    },
  });

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('Password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    changePasswordMutation.mutate(newPassword);
  };

  if (detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        title="Administrator not found"
        message="The administrator account you are looking for does not exist or has been removed."
        retryLabel="Back to Administrators"
        onRetry={() => navigate(PATHS.ADMINISTRATORS)}
      />
    );
  }

  const user = detailQuery.data;

  return (
    <div className="max-w-3xl">
      <Link to={PATHS.ADMINISTRATORS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Administrators
      </Link>

      <PageHeader
        title={user.name}
        description={`Username: ${user.username}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(PATHS.administratorEdit(user.id))}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <Key className="w-4 h-4" aria-hidden="true" />
              Change Password
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>Account Overview</CardHeader>
        <CardBody>
          <dl className="m-0">
            <DetailRow label="Full Name">{user.name}</DetailRow>
            <DetailRow label="Username">
              <code className="text-xs font-mono bg-surface-subtle px-1.5 py-0.5 rounded border border-border-main">
                {user.username}
              </code>
            </DetailRow>
            <DetailRow label="Email Address">{user.email}</DetailRow>
            <DetailRow label="System Role">
              <StatusBadge type="role" status={user.role} />
            </DetailRow>
            <DetailRow label="Account Status">
              {user.is_active ? (
                <Badge variant="success" dot>Active</Badge>
              ) : (
                <Badge variant="neutral" dot>Inactive</Badge>
              )}
            </DetailRow>
            <DetailRow label="Created At">{formatDateTime(user.created_at)}</DetailRow>
            <DetailRow label="Last Updated">{formatDateTime(user.updated_at)}</DetailRow>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Account Actions & Security</CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setIsTogglingStatus(true)}
            >
              {user.is_active ? (
                <>
                  <UserX className="w-4 h-4 text-status-danger" aria-hidden="true" />
                  Disable Account
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-status-success" aria-hidden="true" />
                  Enable Account
                </>
              )}
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                setDeleteError(null);
                setIsDeleting(true);
              }}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete Account
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Change Password Modal */}
      <Modal
        open={isPasswordModalOpen}
        onClose={closePasswordModal}
        title={`Change Password for ${user.name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={changePasswordMutation.isPending}
              onClick={handlePasswordSubmit}
            >
              Update Password
            </Button>
          </div>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && <Alert variant="error">{passwordError}</Alert>}
          <PasswordInput
            id="detail-modal-new-password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            isRequired
            helperText="Minimum 8 characters."
          />
          <PasswordInput
            id="detail-modal-confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
          />
        </form>
      </Modal>

      {/* Enable / Disable Account Dialog */}
      <ConfirmationDialog
        open={isTogglingStatus}
        title={user.is_active ? 'Disable Administrator?' : 'Enable Administrator?'}
        message={
          user.is_active
            ? `Disable account for “${user.name}”? The user will not be able to log in until re-enabled.`
            : `Enable account for “${user.name}”? The user will regain access to the administration portal.`
        }
        confirmLabel={user.is_active ? 'Disable' : 'Enable'}
        cancelLabel="Cancel"
        variant={user.is_active ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
        onConfirm={() => toggleStatusMutation.mutate(!user.is_active)}
        onCancel={() => setIsTogglingStatus(false)}
      />

      {/* Delete Account Dialog */}
      <ConfirmationDialog
        open={isDeleting}
        title="Delete administrator?"
        message={`Delete account for “${user.name}”? This action cannot be undone.`}
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

export default AdministratorDetailPage;
