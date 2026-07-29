import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ui/ErrorState';
import { AuthLayout } from '../layouts/AuthLayout';

/**
 * Screen 15: Error States
 */
export const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="max-w-[600px] mx-auto my-8 select-none">
        <ErrorState
          title="SYSTEM ERROR"
          message="Unable to synchronize response with database server. Local progress preserved on terminal."
          onRetry={() => navigate('/dashboard')}
        />
      </div>
    </AuthLayout>
  );
};

export default ErrorPage;
