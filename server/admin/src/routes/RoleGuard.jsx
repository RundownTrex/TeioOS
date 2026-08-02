import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { PATHS } from './paths';

/**
 * Role-based route guard, driven by the profile fetched from /admin/auth/me.
 * Today only `admin` passes (the backend enforces the same via require_admin);
 * `teacher` access can be enabled later without rework.
 */
export const RoleGuard = ({ roles = [] }) => {
  const { user, isAuthenticated, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};
