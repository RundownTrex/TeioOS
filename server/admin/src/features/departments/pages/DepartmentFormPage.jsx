import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { departmentsApi } from '../api/departmentsApi';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

/**
 * Department create/edit form (docs/frontend/admin-academic-management.md §8.1).
 * One component serves both routes; `id` in the URL switches to edit mode.
 */
export const DepartmentFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const detailQuery = useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: ({ signal }) => departmentsApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: { name: '' },
    validate: (values) => {
      const errors = {};
      if (!values.name || !values.name.trim()) {
        errors.name = 'Name is required.';
      } else if (values.name.length > 255) {
        errors.name = 'Name must be 255 characters or fewer.';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = { name: values.name.trim() };
      if (isEdit) {
        await departmentsApi.update(id, payload);
      } else {
        await departmentsApi.create(payload);
      }
      toast(isEdit ? 'Department updated' : 'Department created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list.all });
      navigate(PATHS.DEPARTMENTS);
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset({ name: detailQuery.data.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, detailQuery.data]);

  if (isEdit && detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ErrorState
        title="Department not found"
        message="The department you are trying to edit does not exist or has been removed."
        retryLabel="Back to Departments"
        onRetry={() => navigate(PATHS.DEPARTMENTS)}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.DEPARTMENTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Departments
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Department' : 'New Department'}
        description={
          isEdit
            ? 'Update the department name. Changes apply to all linked classes and subjects.'
            : 'Create a department to group classes and subjects.'
        }
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <Input
              name="name"
              label="Name"
              value={form.values.name ?? ''}
              onChange={(event) => form.setValue('name', event.target.value)}
              error={form.errors.name}
              helperText="e.g. Computer Science"
              isRequired
              autoFocus
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
              Save Department
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DepartmentFormPage;
