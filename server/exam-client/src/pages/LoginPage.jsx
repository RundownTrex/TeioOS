import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { UserCheck, Lock, Shield } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { announceToScreenReader } from '../utils/ariaAnnounce';

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

  // Immediate auto-focus onto the rollNumber input on mount
  useEffect(() => {
    const input = document.getElementById('rollNumber');
    if (input) {
      input.focus();
    }
    announceToScreenReader(
      'Student Examination Portal. Focused on Roll Number. Type your Roll Number, press Enter to enter your Passcode, then press Enter to sign in.',
      'polite'
    );
  }, []);

  // Keyboard navigation between fields
  const handleRollKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      document.getElementById('passcode')?.focus();
    }
  };

  const handlePassKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      document.getElementById('rollNumber')?.focus();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!rollNumber.trim()) {
      errors.rollNumber = 'Roll Number / Student ID is required.';
    }
    if (!passcode.trim()) {
      errors.passcode = 'Examination Passcode is required.';
    }
    setFieldErrors(errors);
    if (errors.rollNumber || errors.passcode) {
      announceToScreenReader(errors.rollNumber || errors.passcode, 'assertive');
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login(rollNumber.trim(), passcode);
      announceToScreenReader('Sign in successful. Redirecting to student dashboard...', 'assertive');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid Roll Number or Examination Passcode. Please check your credentials.';
      setServerError(msg);
      announceToScreenReader(msg, 'assertive');
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
        <h1
          tabIndex={-1}
          className="text-lg font-extrabold text-text-main tracking-tight uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
        >
          TEIOOS STUDENT EXAMINATION PORTAL
        </h1>
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
            onKeyDown={handleRollKeyDown}
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
            onKeyDown={handlePassKeyDown}
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
            Sign In (Enter)
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};

export default LoginPage;
