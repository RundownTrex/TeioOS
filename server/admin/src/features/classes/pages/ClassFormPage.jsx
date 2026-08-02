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

import { classesApi } from '../api/classesApi';
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
 * Class create/edit form (docs/frontend/admin-academic-management.md §8.2).
 * One component serves both routes; `id` in the URL switches to edit mode.
 */
export const ClassFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const departmentsQuery = useDepartmentsReference();

  const detailQuery = useQuery({
    queryKey: queryKeys.classes.detail(id),
    queryFn: ({ signal }) => classesApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: { name: '', semester: '', section: '', department_id: '' },
    validate: (values) => {
      const errors = {};
      if (!values.name || !values.name.trim()) {
        errors.name = 'Name is required.';
      } else if (values.name.length > 255) {
        errors.name = 'Name must be 255 characters or fewer.';
      }
      if (!values.semester || values.semester === '') {
        errors.semester = 'Semester is required.';
      } else {
        const semester = Number(values.semester);
        if (!Number.isInteger(semester) || semester < 1) {
          errors.semester = 'Semester must be a whole number of at least 1.';
        }
      }
      if (!values.section || !values.section.trim()) {
        errors.section = 'Section is required.';
      } else if (values.section.length > 50) {
        errors.section = 'Section must be 50 characters or fewer.';
      }
      if (!values.department_id) {
        errors.department_id = 'Department is required.';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        semester: Number(values.semester),
        section: values.section.trim(),
        department_id: values.department_id,
      };
      if (isEdit) {
        await classesApi.update(id, payload);
      } else {
        await classesApi.create(payload);
      }
      toast(isEdit ? 'Class updated' : 'Class created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list.all });
      navigate(PATHS.CLASSES);
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset({
        name: detailQuery.data.name,
        semester: String(detailQuery.data.semester),
        section: detailQuery.data.section,
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
        title="Class not found"
        message="The class you are trying to edit does not exist or has been removed."
        retryLabel="Back to Classes"
        onRetry={() => navigate(PATHS.CLASSES)}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.CLASSES} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Classes
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Class' : 'New Class'}
        description="A class groups students of the same semester and section within a department."
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
              helperText="e.g. BCA Semester I"
              isRequired
              autoFocus
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="semester"
                label="Semester"
                type="number"
                min="1"
                value={form.values.semester ?? ''}
                onChange={(event) => form.setValue('semester', event.target.value)}
                error={form.errors.semester}
                isRequired
              />
              <Input
                name="section"
                label="Section"
                value={form.values.section ?? ''}
                onChange={(event) => form.setValue('section', event.target.value)}
                error={form.errors.section}
                helperText="e.g. A"
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
              Save Class
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ClassFormPage;
