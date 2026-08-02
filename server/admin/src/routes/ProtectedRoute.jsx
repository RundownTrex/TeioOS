import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { PATHS } from './paths';

export const ProtectedRoute = () => {
  const { isAuthenticated, isBooting, sessionError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return <PageSkeleton />;
  }

  if (sessionError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorState
          title="Unable to Validate Session"
          message={sessionError.message}
          retryLabel="Retry"
          onRetry={retryBootstrap}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
