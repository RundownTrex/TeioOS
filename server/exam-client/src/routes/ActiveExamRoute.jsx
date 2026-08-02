import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { STORAGE_KEYS, EXAM_SESSION_STATUS } from '../utils/constants';
import { getItem } from '../utils/storage';

export const ActiveExamRoute = () => {
  const { isExamActive, elevatedToken } = useExam();
  const { scheduleId } = useParams();

  const storedToken = getItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage);
  const storedScheduleId = getItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage);
  const storedPayload = getItem(STORAGE_KEYS.EXAM_SESSION_PAYLOAD, localStorage);

  // A valid stored session payload indicates an in-progress exam that should
  // still be active. After a browser restart the elevated token is gone
  // (sessionStorage), but the payload in localStorage persists; we route the
  // candidate to the Resume page so a fresh elevated token can be minted via
  // POST /start without losing any session state.
  const hasPayload =
    storedPayload &&
    storedPayload.scheduleId === scheduleId &&
    storedPayload.status === EXAM_SESSION_STATUS.IN_PROGRESS;

  const hasElevatedAccess =
    (isExamActive && Boolean(elevatedToken)) ||
    Boolean(storedToken && (storedScheduleId === scheduleId || !scheduleId));

  // Highest priority: full active access (token present) → render exam.
  if (hasElevatedAccess) {
    return <Outlet />;
  }

  // Session payload exists (exam started) but token is missing (browser restart).
  // Route to the resume flow so the candidate can re-authenticate their exam token.
  if (hasPayload && scheduleId) {
    return <Navigate to={`/exam/${scheduleId}/resume`} replace />;
  }

  // No active session data at all.
  return <Navigate to={scheduleId ? `/exam/${scheduleId}/instructions` : '/dashboard'} replace />;
};

export default ActiveExamRoute;
