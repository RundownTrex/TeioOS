import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { administratorsApi } from '../api/administratorsApi';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator (Full Access)' },
  { value: 'teacher', label: 'Teacher (Academic & Evaluation Access)' },
];

export const AdministratorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const detailQuery = useQuery({
    queryKey: queryKeys.administrators.detail(id),
    queryFn: ({ signal }) => administratorsApi.detail(id, { signal }),
    enabled: isEdit,
  });

  const form = useForm({
    initialValues: {
      name: '',
      username: '',
      email: '',
      role: 'admin',
      is_active: true,
      password: '',
      confirmPassword: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.name || !values.name.trim()) {
        errors.name = 'Full name is required.';
      }

      if (!values.username || !values.username.trim()) {
        errors.username = 'Username is required.';
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(values.username.trim())) {
        errors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores.';
      }

      if (!values.email || !values.email.trim()) {
        errors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }

      if (!values.role) {
        errors.role = 'Role is required.';
      }

      if (!isEdit) {
        if (!values.password) {
          errors.password = 'Password is required.';
        } else if (values.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long.';
        }

        if (values.password !== values.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match.';
        }
      }

      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        role: values.role,
        is_active: values.is_active,
      };

      if (!isEdit) {
        payload.password = values.password;
        await administratorsApi.create(payload);
      } else {
        await administratorsApi.update(id, payload);
      }

      toast(isEdit ? 'Administrator updated' : 'Administrator created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators.list.all });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: queryKeys.administrators.detail(id) });
      }
      navigate(PATHS.ADMINISTRATORS);
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      const user = detailQuery.data;
      form.reset({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        role: user.role ?? 'admin',
        is_active: user.is_active ?? true,
        password: '',
        confirmPassword: '',
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
        title="Administrator not found"
        message="The administrator account you are trying to edit does not exist or has been removed."
        retryLabel="Back to Administrators"
        onRetry={() => navigate(PATHS.ADMINISTRATORS)}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to={PATHS.ADMINISTRATORS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Administrators
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Administrator' : 'New Administrator'}
        description={
          isEdit
            ? 'Update user account profile information and assigned administrative role.'
            : 'Create a new staff or administrator account for managing the platform.'
        }
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <Input
              id="name"
              name="name"
              label="Full Name"
              value={form.values.name ?? ''}
              onChange={(e) => form.setValue('name', e.target.value)}
              error={form.errors.name}
              isRequired
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="username"
                name="username"
                label="Username"
                value={form.values.username ?? ''}
                onChange={(e) => form.setValue('username', e.target.value)}
                error={form.errors.username}
                helperText="Unique login handle"
                isRequired
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={form.values.email ?? ''}
                onChange={(e) => form.setValue('email', e.target.value)}
                error={form.errors.email}
                isRequired
              />
            </div>

            <Select
              id="role"
              name="role"
              label="System Role"
              value={form.values.role ?? 'admin'}
              onChange={(e) => form.setValue('role', e.target.value)}
              options={ROLE_OPTIONS}
              error={form.errors.role}
              isRequired
            />

            <div className="pt-2">
              <Switch
                id="is_active"
                label="Account Enabled (Active)"
                checked={Boolean(form.values.is_active)}
                onChange={(checked) => form.setValue('is_active', checked)}
              />
              <p className="mt-1 text-xs text-text-muted">
                Disabled users will not be able to log in to the admin portal.
              </p>
            </div>

            {!isEdit && (
              <div className="pt-4 border-t border-border-main space-y-4">
                <h3 className="text-sm font-medium text-text-main">Initial Password</h3>

                <PasswordInput
                  id="password"
                  name="password"
                  label="Password"
                  value={form.values.password ?? ''}
                  onChange={(e) => form.setValue('password', e.target.value)}
                  error={form.errors.password}
                  helperText="Minimum 8 characters."
                  isRequired
                />

                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={form.values.confirmPassword ?? ''}
                  onChange={(e) => form.setValue('confirmPassword', e.target.value)}
                  error={form.errors.confirmPassword}
                  isRequired
                />
              </div>
            )}
          </CardBody>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(PATHS.ADMINISTRATORS)}
              isDisabled={form.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={form.isSubmitting}>
              {isEdit ? 'Save Changes' : 'Create Administrator'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdministratorFormPage;
