import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { subjectsApi } from '../api/subjectsApi';
import {
  useDepartmentsReference,
  buildDepartmentOptions,
} from '../../departments/hooks/useDepartmentsReference';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

/**
 * Subject create/edit form (docs/frontend/admin-academic-management.md §8.3).
 * One component serves both routes; `id` in the URL switches to edit mode.
 */
export const SubjectFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const departmentsQuery = useDepartmentsReference();

  const detailQuery = useQuery({
    queryKey: queryKeys.subjects.detail(id),
    queryFn: ({ signal }) => subjectsApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: { name: '', subject_code: '', department_id: '' },
    validate: (values) => {
      const errors = {};
      if (!values.name || !values.name.trim()) {
        errors.name = 'Name is required.';
      } else if (values.name.length > 255) {
        errors.name = 'Name must be 255 characters or fewer.';
      }
      if (!values.subject_code || !values.subject_code.trim()) {
        errors.subject_code = 'Subject code is required.';
      } else if (values.subject_code.length > 50) {
        errors.subject_code = 'Subject code must be 50 characters or fewer.';
      }
      if (!values.department_id) {
        errors.department_id = 'Department is required.';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        subject_code: values.subject_code.trim(),
        department_id: values.department_id,
      };
      if (isEdit) {
        await subjectsApi.update(id, payload);
      } else {
        await subjectsApi.create(payload);
      }
      toast(isEdit ? 'Subject updated' : 'Subject created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.list.all });
      navigate(PATHS.SUBJECTS);
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset({
        name: detailQuery.data.name,
        subject_code: detailQuery.data.subject_code,
        department_id: detailQuery.data.department_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, detailQuery.data]);

  if (isEdit && detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ErrorState
        title="Subject not found"
        message="The subject you are trying to edit does not exist or has been removed."
        retryLabel="Back to Subjects"
        onRetry={() => navigate(PATHS.SUBJECTS)}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.SUBJECTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Subjects
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Subject' : 'New Subject'}
        description="A subject belongs to one department and is identified by a short code."
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="name"
                label="Name"
                value={form.values.name ?? ''}
                onChange={(event) => form.setValue('name', event.target.value)}
                error={form.errors.name}
                helperText="e.g. Data Structures"
                isRequired
                autoFocus
              />
              <Input
                name="subject_code"
                label="Subject Code"
                value={form.values.subject_code ?? ''}
                onChange={(event) => form.setValue('subject_code', event.target.value)}
                error={form.errors.subject_code}
                helperText="e.g. CS301"
                isRequired
              />
            </div>

            <Select
              name="department_id"
              label="Department"
              value={form.values.department_id ?? ''}
              onChange={(event) => form.setValue('department_id', event.target.value)}
              options={buildDepartmentOptions(departmentsQuery.data)}
              placeholder="Select a department"
              error={form.errors.department_id}
              isRequired
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
              Save Subject
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SubjectFormPage;
