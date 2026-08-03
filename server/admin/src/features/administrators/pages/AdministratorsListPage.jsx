import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Key, UserX, UserCheck } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Modal } from '../../../components/ui/Modal';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Menu } from '../../../components/ui/Menu';

import { administratorsApi } from '../api/administratorsApi';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDate } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

/**
 * Administrators list page with search, role filters, pagination,
 * detail viewing, status toggle, password changes, and account deletion.
 */
export const AdministratorsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'role'] });

  // Dialog / Modal state
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [pendingStatusToggle, setPendingStatusToggle] = useState(null);

  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // List Query
  const listQuery = useQuery({
    queryKey: queryKeys.administrators.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      role: filters.role || undefined,
    }),
    queryFn: ({ signal }) =>
      administratorsApi.list({
        page,
        pageSize,
        q: filters.q,
        role: filters.role,
        signal,
      }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => administratorsApi.remove(id),
    onSuccess: () => {
      toast('Administrator account deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.list.all });
    },
    onError: (error) => {
      setDeleteError(error?.message || 'The administrator could not be deleted.');
      toast(error?.message || 'The administrator could not be deleted.', { type: 'error' });
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => administratorsApi.toggleStatus(id, is_active),
    onSuccess: (_, variables) => {
      const actionText = variables.is_active ? 'enabled' : 'disabled';
      toast(`Administrator account ${actionText}`, { type: 'success' });
      setPendingStatusToggle(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.list.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.detail(variables.id) });
    },
    onError: (error) => {
      toast(error?.message || 'Failed to update account status.', { type: 'error' });
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }) => administratorsApi.changePassword(id, password),
    onSuccess: () => {
      toast('Password changed successfully', { type: 'success' });
      closePasswordModal();
    },
    onError: (error) => {
      setPasswordError(error?.message || 'Failed to change password.');
    },
  });

  const closePasswordModal = () => {
    setPasswordModalUser(null);
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

    if (passwordModalUser) {
      changePasswordMutation.mutate({
        id: passwordModalUser.id,
        password: newPassword,
      });
    }
  };

  const data = listQuery.data;

  const filterFields = [
    { name: 'q', label: 'Search administrators', placeholder: 'Search by name, username, email…' },
    {
      name: 'role',
      label: 'Filter by role',
      type: 'select',
      options: [
        { value: '', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'teacher', label: 'Teacher' },
      ],
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <span className="font-medium text-text-main block">{row.name}</span>
          <span className="text-xs text-text-muted">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (row) => <code className="text-xs font-mono text-text-main">{row.username}</code>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <StatusBadge type="role" status={row.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="neutral" dot>Inactive</Badge>
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'w-24',
      render: (row) => (
        <Menu
          label={`Actions for ${row.name}`}
          items={[
            {
              key: 'view',
              label: 'View Details',
              onSelect: () => navigate(PATHS.administratorDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.administratorEdit(row.id)),
            },
            {
              key: 'change-password',
              label: 'Change Password',
              icon: <Key className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => setPasswordModalUser(row),
            },
            {
              key: 'toggle-status',
              label: row.is_active ? 'Disable Account' : 'Enable Account',
              icon: row.is_active ? (
                <UserX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <UserCheck className="w-4 h-4" aria-hidden="true" />
              ),
              onSelect: () => setPendingStatusToggle(row),
            },
            {
              key: 'delete',
              label: 'Delete',
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Administrators"
        description="Manage system administrators, teachers, and staff user accounts."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.ADMINISTRATORS_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Administrator
          </Button>
        }
      />

      <Card>
        <Filters
          fields={filterFields}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="List of system administrators"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Administrators list could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            filters.q || filters.role ? (
              <p className="text-sm text-text-muted">
                No administrators match your filter criteria. Clear filters to see all accounts.
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

      {/* Change Password Modal */}
      <Modal
        open={Boolean(passwordModalUser)}
        onClose={closePasswordModal}
        title={`Change Password for ${passwordModalUser?.name ?? ''}`}
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
            id="modal-new-password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            isRequired
            helperText="Minimum 8 characters."
          />
          <PasswordInput
            id="modal-confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
          />
        </form>
      </Modal>

      {/* Enable / Disable Account Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingStatusToggle)}
        title={pendingStatusToggle?.is_active ? 'Disable Administrator?' : 'Enable Administrator?'}
        message={
          pendingStatusToggle?.is_active
            ? `Disable account for “${pendingStatusToggle?.name}”? The user will not be able to log in until re-enabled.`
            : `Enable account for “${pendingStatusToggle?.name}”? The user will regain access to the administration portal.`
        }
        confirmLabel={pendingStatusToggle?.is_active ? 'Disable' : 'Enable'}
        cancelLabel="Cancel"
        variant={pendingStatusToggle?.is_active ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
        onConfirm={() =>
          pendingStatusToggle &&
          toggleStatusMutation.mutate({
            id: pendingStatusToggle.id,
            is_active: !pendingStatusToggle.is_active,
          })
        }
        onCancel={() => setPendingStatusToggle(null)}
      />

      {/* Delete Account Dialog */}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete administrator?"
        message={`Delete account for “${pendingDelete?.name ?? ''}”? This action cannot be undone.`}
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

export default AdministratorsListPage;
