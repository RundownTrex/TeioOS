import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem } from '../utils/storage';

export const ActiveExamRoute = () => {
  const { isExamActive, elevatedToken } = useExam();
  const { scheduleId } = useParams();

  const storedToken = getItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage);
  const storedScheduleId = getItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage);

  // Active exam routes strictly require an active session or elevated token
  const hasActiveAccess =
    (isExamActive && Boolean(elevatedToken)) ||
    Boolean(storedToken && (storedScheduleId === scheduleId || !scheduleId));

  if (!hasActiveAccess) {
    return <Navigate to={scheduleId ? `/exam/${scheduleId}/instructions` : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ActiveExamRoute;
