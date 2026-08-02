import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { studentsApi } from '../api/studentsApi';
import { useClassesReference, buildClassOptions } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentNameMap } from '../../departments/hooks/useDepartmentsReference';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import {
  ACCESSIBILITY_PROFILE_OPTIONS,
  ACCESSIBILITY_PROFILE_DESCRIPTIONS,
  ACCESSIBILITY_PROFILES,
} from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

/**
 * Student create/edit form (docs/frontend/admin-students.md §5.2).
 * One component serves both routes; `id` in the URL switches to edit mode.
 */
export const StudentFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const classesQuery = useClassesReference();
  const departmentsQuery = useDepartmentsReference();
  const departmentNames = buildDepartmentNameMap(departmentsQuery.data);

  const detailQuery = useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: ({ signal }) => studentsApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: {
      roll_number: '',
      name: '',
      date_of_birth: '',
      class_id: '',
      accessibility_profile: ACCESSIBILITY_PROFILES.STANDARD,
      is_active: true,
    },
    validate: (values) => {
      const errors = {};
      if (!values.roll_number || !values.roll_number.trim()) {
        errors.roll_number = 'Roll number is required.';
      } else if (values.roll_number.length > 100) {
        errors.roll_number = 'Roll number must be 100 characters or fewer.';
      }
      if (!values.name || !values.name.trim()) {
        errors.name = 'Name is required.';
      } else if (values.name.length > 255) {
        errors.name = 'Name must be 255 characters or fewer.';
      }
      if (!values.date_of_birth) {
        errors.date_of_birth = 'Date of birth is required.';
      } else {
        const dob = new Date(`${values.date_of_birth}T00:00:00`);
        if (Number.isNaN(dob.getTime())) {
          errors.date_of_birth = 'Enter a valid date.';
        } else if (dob.getTime() > Date.now()) {
          errors.date_of_birth = 'Date of birth cannot be in the future.';
        }
      }
      if (!values.class_id) {
        errors.class_id = 'Class is required.';
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        roll_number: values.roll_number.trim(),
        name: values.name.trim(),
        date_of_birth: values.date_of_birth,
        class_id: values.class_id,
        accessibility_profile: values.accessibility_profile,
      };
      if (isEdit) {
        await studentsApi.update(id, { ...payload, is_active: values.is_active });
      } else {
        await studentsApi.create(payload);
      }
      toast(isEdit ? 'Student updated' : 'Student created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list.all });
      navigate(PATHS.STUDENTS);
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset({
        roll_number: detailQuery.data.roll_number,
        name: detailQuery.data.name,
        date_of_birth: toDateInputValue(detailQuery.data.date_of_birth),
        class_id: detailQuery.data.class_id,
        accessibility_profile: detailQuery.data.accessibility_profile,
        is_active: detailQuery.data.is_active,
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
        title="Student not found"
        message="The student you are trying to edit does not exist or has been removed."
        retryLabel="Back to Students"
        onRetry={() => navigate(PATHS.STUDENTS)}
      />
    );
  }

  const profileHelperText = ACCESSIBILITY_PROFILE_DESCRIPTIONS[form.values.accessibility_profile];

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.STUDENTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Students
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Student' : 'New Student'}
        description="Students sign in with their roll number and their date of birth as the initial password."
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="roll_number"
                label="Roll Number"
                value={form.values.roll_number ?? ''}
                onChange={(event) => form.setValue('roll_number', event.target.value)}
                error={form.errors.roll_number}
                helperText="Must be unique across all students."
                isRequired
                autoFocus
              />
              <Input
                name="name"
                label="Name"
                value={form.values.name ?? ''}
                onChange={(event) => form.setValue('name', event.target.value)}
                error={form.errors.name}
                helperText="Full name of the student."
                isRequired
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                value={form.values.date_of_birth ?? ''}
                onChange={(event) => form.setValue('date_of_birth', event.target.value)}
                error={form.errors.date_of_birth}
                helperText="Initial login password (YYYY-MM-DD)."
                isRequired
              />
              <Select
                name="class_id"
                label="Class"
                value={form.values.class_id ?? ''}
                onChange={(event) => form.setValue('class_id', event.target.value)}
                options={buildClassOptions(classesQuery.data, departmentNames)}
                placeholder="Select a class"
                error={form.errors.class_id}
                isRequired
              />
            </div>

            <Select
              name="accessibility_profile"
              label="Accessibility Profile"
              value={form.values.accessibility_profile ?? ACCESSIBILITY_PROFILES.STANDARD}
              onChange={(event) => form.setValue('accessibility_profile', event.target.value)}
              options={ACCESSIBILITY_PROFILE_OPTIONS}
              helperText={profileHelperText}
              isRequired
            />

            {isEdit && (
              <div className="flex items-center justify-between rounded-lg border border-border-main p-4">
                <div>
                  <p className="text-sm font-medium text-text-main">Active</p>
                  <p className="text-xs text-text-muted">
                    Inactive students cannot sign in to examinations.
                  </p>
                </div>
                <Switch
                  checked={Boolean(form.values.is_active)}
                  onChange={() => form.setValue('is_active', !form.values.is_active)}
                />
              </div>
            )}
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
              Save Student
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StudentFormPage;
