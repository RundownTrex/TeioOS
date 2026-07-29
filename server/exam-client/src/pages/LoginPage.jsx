import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { UserCheck, Lock, Shield } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const LoginPage = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentTitle('Student Sign In');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const validateForm = () => {
    const errors = {};
    if (!rollNumber.trim()) {
      errors.rollNumber = 'Roll Number / Student ID is required.';
    }
    if (!passcode.trim()) {
      errors.passcode = 'Examination Passcode is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login(rollNumber.trim(), passcode);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.message || 'Invalid Roll Number or Examination Passcode. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md border border-border-main select-none">
      <CardHeader className="text-center py-6 bg-subtle/30">
        <div className="inline-flex p-3 bg-navy-primary text-text-inverse rounded-2xl shadow-xs mb-3">
          <Shield className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-extrabold text-text-main tracking-tight uppercase">
          TEIOOS STUDENT EXAMINATION PORTAL
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Please enter your assigned credentials to access your paper.
        </p>
      </CardHeader>

      <CardBody className="p-6">
        {serverError && (
          <Alert variant="error" className="mb-5">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="rollNumber"
            name="rollNumber"
            label="Roll Number / Student ID"
            type="text"
            value={rollNumber}
            onChange={(e) => {
              setRollNumber(e.target.value);
              if (fieldErrors.rollNumber) {
                setFieldErrors((prev) => ({ ...prev, rollNumber: null }));
              }
            }}
            placeholder="e.g. STU-2026-8941"
            isRequired={true}
            autoFocus={true}
            error={fieldErrors.rollNumber}
            leftIcon={<UserCheck className="w-4 h-4" />}
          />

          <PasswordInput
            id="passcode"
            name="passcode"
            label="Examination Passcode"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              if (fieldErrors.passcode) {
                setFieldErrors((prev) => ({ ...prev, passcode: null }));
              }
            }}
            placeholder="Enter your assigned passcode"
            isRequired={true}
            error={fieldErrors.passcode}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            isLoading={isSubmitting}
            className="pt-1"
          >
            Sign In
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};

export default LoginPage;
