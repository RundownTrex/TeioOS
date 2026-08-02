import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { departmentsApi } from '../api/departmentsApi';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDate } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

/**
 * Departments list page (docs/frontend/admin-academic-management.md §7).
 * Search, pagination and filters are URL-synced via useQueryParams.
 */
export const DepartmentsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const listQuery = useQuery({
    queryKey: queryKeys.departments.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
    }),
    queryFn: ({ signal }) =>
      departmentsApi.list({ page, pageSize, q: filters.q, signal }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => departmentsApi.remove(id),
    onSuccess: () => {
      toast('Department deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list.all });
    },
    onError: (error) => {
      if (error?.status === 400) {
        setDeleteError(error?.message || 'The department cannot be deleted.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list.all });
      toast(error?.message || 'The department could not be deleted.', { type: 'error' });
    },
  });

  const data = listQuery.data;

  const columns = [
    { key: 'name', header: 'Name' },
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
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.departmentEdit(row.id)),
            },
            {
              key: 'delete',
              label: 'Delete',
              danger: true,
              onSelect: () => {
                setDeleteError(null);
                setPendingDelete({ id: row.id, name: row.name });
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
        title="Departments"
        description="Organize classes and subjects into academic departments."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.DEPARTMENTS_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Department
          </Button>
        }
      />

      <Card>
        <Filters
          fields={[{ name: 'q', label: 'Search departments', placeholder: 'Search by name…' }]}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="List of departments"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Departments could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            filters.q ? (
              <p className="text-sm text-text-muted">
                No departments match “{filters.q}”. Clear the search to see all departments.
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

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete department?"
        message={`Delete “${pendingDelete?.name ?? ''}”? Classes and subjects in this department will also be removed. This action cannot be undone.`}
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

export default DepartmentsListPage;
