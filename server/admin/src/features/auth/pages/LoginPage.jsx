import React, { useMemo } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { PATHS } from '../../../routes/paths';

/**
 * Administrator sign-in screen (see docs/frontend/admin-authentication.md §7).
 * Rendered inside the `auth` AppShell (centered 440px card on canvas).
 */
export const LoginPage = () => {
  const { login, isAuthenticated, isBooting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const wasExpired = searchParams.get('expired') === '1';

  const destination = useMemo(() => {
    const from = location.state?.from;
    if (from?.pathname && from.pathname !== PATHS.LOGIN) {
      return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
    }
    return PATHS.DASHBOARD;
  }, [location.state?.from]);

  const { values, errors, submitError, isSubmitting, setValue, handleSubmit } = useForm({
    initialValues: { username: '', password: '' },
    validate: (formValues) => {
      const fieldErrors = {};
      if (!formValues.username?.trim()) fieldErrors.username = 'Username is required.';
      if (!formValues.password) fieldErrors.password = 'Password is required.';
      return fieldErrors;
    },
    onSubmit: async (formValues) => {
      await login(formValues.username.trim(), formValues.password);
      navigate(destination, { replace: true });
    },
  });

  if (isBooting) {
    return <PageSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return (
    <Card className="w-full">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span
            className="w-10 h-10 rounded-lg bg-navy-primary text-text-inverse flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold text-text-main">TeioOS</p>
            <p className="text-xs text-text-muted">Examination Platform Administration</p>
          </div>
        </div>

        {wasExpired && (
          <Alert variant="info" title="Session expired" className="mb-4">
            Your previous session ended. Please sign in again to continue.
          </Alert>
        )}

        {submitError && (
          <Alert variant="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <h1 className="text-xl font-bold text-text-main mb-1">Administrator Sign In</h1>
        <p className="text-sm text-text-muted mb-6">
          Sign in to manage examinations, students and results.
        </p>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            value={values.username}
            onChange={(event) => setValue('username', event.target.value)}
            error={errors.username}
            isRequired
            autoFocus
            autoComplete="username"
            leftIcon={<User className="w-4 h-4" aria-hidden="true" />}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={values.password}
            onChange={(event) => setValue('password', event.target.value)}
            error={errors.password}
            isRequired
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
          />

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} className="mt-2">
            Sign In
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default LoginPage;
