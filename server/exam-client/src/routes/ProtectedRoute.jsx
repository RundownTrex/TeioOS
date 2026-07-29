import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoadingSession } = useAuth();
  const location = useLocation();

  if (isLoadingSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 max-w-md mx-auto" role="status" aria-label="Loading candidate session">
        <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">Validating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
