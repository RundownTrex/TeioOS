import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Filters } from '../../../components/ui/Filters';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { classesApi } from '../api/classesApi';
import {
  useDepartmentsReference,
  buildDepartmentNameMap,
} from '../../departments/hooks/useDepartmentsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

/**
 * Classes list page (docs/frontend/admin-academic-management.md §7.3).
 * Search + department filter; server orders newest first for stable pagination.
 */
export const ClassesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'department_id'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const departmentsQuery = useDepartmentsReference();
  const departmentNames = buildDepartmentNameMap(departmentsQuery.data);

  const listQuery = useQuery({
    queryKey: queryKeys.classes.list.by({
      page,
      pageSize,
      q: filters.q || undefined,
      departmentId: filters.department_id || undefined,
    }),
    queryFn: ({ signal }) =>
      classesApi.list({
        page,
        pageSize,
        q: filters.q,
        departmentId: filters.department_id,
        signal,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => classesApi.remove(id),
    onSuccess: () => {
      toast('Class deleted', { type: 'success' });
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list.all });
    },
    onError: (error) => {
      if (error?.status === 400) {
        setDeleteError(error?.message || 'The class cannot be deleted.');
        return;
      }
      setPendingDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list.all });
      toast(error?.message || 'The class could not be deleted.', { type: 'error' });
    },
  });

  const data = listQuery.data;

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'semester', header: 'Semester', render: (row) => formatNumber(row.semester) },
    { key: 'section', header: 'Section' },
    {
      key: 'department_id',
      header: 'Department',
      render: (row) => departmentNames.get(row.department_id) ?? '—',
    },
    { key: 'created_at', header: 'Created', render: (row) => formatDate(row.created_at) },
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
              icon: <Pencil className="w-4 h-4" aria-hidden="true" />,
              onSelect: () => navigate(PATHS.classEdit(row.id)),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-4 h-4" aria-hidden="true" />,
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
        title="Classes"
        description="Manage student classes organized by department and semester."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.CLASSES_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Class
          </Button>
        }
      />

      <Card>
        <Filters
          fields={[
            { name: 'q', label: 'Search classes', placeholder: 'Search by name…' },
            {
              name: 'department_id',
              label: 'Department',
              type: 'select',
              placeholder: 'All departments',
              options: (departmentsQuery.data?.items ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              })),
            },
          ]}
          values={filters}
          onChange={(name, value) => setFilter(name, value)}
          onReset={clearFilters}
          className="px-5 py-4 border-b border-border-main"
        />

        <Table
          caption="List of classes"
          columns={columns}
          data={data?.items ?? []}
          rowKey="id"
          loading={listQuery.isFetching}
          error={
            listQuery.isError ? (
              <Alert variant="error">Classes could not be loaded.</Alert>
            ) : undefined
          }
          empty={
            filters.q || filters.department_id ? (
              <p className="text-sm text-text-muted">
                No classes match the current filters. Clear the filters to see all classes.
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
        title="Delete class?"
        message={`Delete “${pendingDelete?.name ?? ''}”? This action cannot be undone.`}
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

export default ClassesListPage;
