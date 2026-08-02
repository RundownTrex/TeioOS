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
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Menu } from '../../../components/ui/Menu';

import { studentsApi } from '../api/studentsApi';
import { useClassesReference, buildClassNameMap } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentNameMap } from '../../departments/hooks/useDepartmentsReference';
import { useQueryParams } from '../../../hooks/useQueryParams';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatDate } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Students list page (docs/frontend/admin-students.md §5.1).
 * Search (name/roll), class and status filters; URL-synced pagination.
 */
export const StudentsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { page, pageSize, filters, setPage, setPageSize, setFilter, clearFilters } =
    useQueryParams({ filterKeys: ['q', 'class_id', 'status'] });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

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
  });

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
      key: 'is_active',
      header: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
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
              label: 'View',
              onSelect: () => navigate(PATHS.studentDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              onSelect: () => navigate(PATHS.studentEdit(row.id)),
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
        description="Manage student accounts, class assignment and accessibility profiles."
        actions={
          <Button variant="primary" onClick={() => navigate(PATHS.STUDENTS_NEW)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Student
          </Button>
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
