import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useExam } from '../hooks/useExam';
import { useExamSession } from '../features/exams/hooks/useExamSession';
import { examsApi } from '../features/exams/api/examsApi';
import { RotateCcw, ShieldCheck, Clock, FileText, Flag, PauseCircle } from 'lucide-react';
import { restoreLocalAnswers, restoreWorkbenchState } from '../utils/resilienceManager';
import { formatDuration } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { announceToScreenReader } from '../utils/ariaAnnounce';
import { EXAM_SESSION_STATUS } from '../utils/constants';

/**
 * Screen 6: Resume Examination (Active Session Recovery)
 *
 * Triggers automatically when a candidate re-opens the kiosk browser or refreshes.
 * Restores cached answers, verifies server synchronization, and allows seamless resumption.
 */
export const ResumeExamPage = () => {
  const { scheduleId = 'cs-401' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userProfile, token: baseToken } = useAuth();
  const { initExamSession } = useExam();

  const { data: sessionSnapshot, isLoading } = useExamSession(scheduleId);

  const [isResuming, setIsResuming] = useState(false);

  const studentName = userProfile?.name || 'Alex Smith';
  const rollNumber = userProfile?.roll_number || 'STU-2026-8941';

  useDocumentTitle('Resume Examination');
  const pageHeadingRef = useFocusOnMount();

  const session = sessionSnapshot;
  const status = session?.status;

  // The server froze the individual timer while the candidate was away.
  // Remaining time is frozen at expires_at - paused_at and is only unfrozen
  // (deadline shifted forward) when the candidate resumes via POST /start.
  const isPaused = status === EXAM_SESSION_STATUS.IN_PROGRESS && Boolean(session?.paused_at);

  const terminalStatuses = [
    EXAM_SESSION_STATUS.SUBMITTED,
    EXAM_SESSION_STATUS.AUTO_SUBMITTED,
    EXAM_SESSION_STATUS.EXPIRED,
    EXAM_SESSION_STATUS.TERMINATED,
  ];

  // Route according to the authoritative server session status
  useEffect(() => {
    if (isLoading) return;
    if (!session || status === EXAM_SESSION_STATUS.PENDING) {
      navigate(`/exam/${scheduleId}/instructions`, { replace: true });
    } else if (terminalStatuses.includes(status)) {
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, session, status, scheduleId, navigate]);

  // Announce the paused state to screen-reader users on arrival
  useEffect(() => {
    if (isPaused) {
      announceToScreenReader(
        'Your examination timer was paused while you were away. Examination time is not counted while paused. Click resume to continue your examination.',
        'assertive'
      );
    }
  }, [isPaused]);

  // Compute restored draft count from local resilience cache
  const restoredAnswers = useMemo(() => restoreLocalAnswers(scheduleId), [scheduleId]);
  const savedCount = Object.keys(restoredAnswers).filter((k) => Boolean(restoredAnswers[k])).length;
  const flaggedCount = useMemo(() => restoreWorkbenchState(scheduleId).flaggedSet.size, [scheduleId]);

  // Server-authoritative remaining time derived from the session snapshot.
  // While paused the timer is frozen: the clock is stopped at paused_at, so
  // remaining time is expires_at - paused_at (a constant) rather than
  // expires_at - server_now.
  const secondsRemaining = useMemo(() => {
    if (!session?.expires_at) return 0;
    const endMs = new Date(session.expires_at).getTime();
    if (isPaused && session?.paused_at) {
      const pausedMs = new Date(session.paused_at).getTime();
      return Math.max(0, Math.floor((endMs - pausedMs) / 1000));
    }
    if (sessionSnapshot?.server_current_time) {
      const serverNowMs = new Date(sessionSnapshot.server_current_time).getTime();
      return Math.max(0, Math.floor((endMs - serverNowMs) / 1000));
    }
    return 0;
  }, [session, sessionSnapshot, isPaused]);

  // Resume is server-idempotent (POST /start never recomputes expires_at for an
  // IN_PROGRESS session). Re-issuing the elevated token here makes resumption
  // survive a browser restart, where the sessionStorage token is gone.
  const handleResume = async () => {
    setIsResuming(true);
    try {
      const response = await examsApi.startExam(scheduleId, baseToken);
      const startData = response?.data;
      if (!startData?.access_token) {
        throw new Error('Failed to obtain examination access token from backend server.');
      }
      initExamSession({
        token: startData.access_token,
        scheduleId,
        session: startData.session,
        serverCurrentTime: startData.server_current_time,
      });
      // Seed the shared session query with the fresh unpaused snapshot so the
      // active page never renders the stale paused state (which previously
      // caused a resume <-> active routing flicker loop).
      queryClient.setQueryData(['examSession', scheduleId, baseToken], {
        server_current_time: startData.server_current_time,
        ...startData.session,
      });
      navigate(`/exam/${scheduleId}/active`, { replace: true, state: { isResumed: true } });
    } catch (err) {
      const terminal = err?.code === 'SESSION_SUBMITTED' || err?.code === 'SESSION_EXPIRED';
      if (terminal) {
        navigate(`/exam/${scheduleId}/submitted`, { replace: true });
        return;
      }
      console.warn('Resume exam start error:', err);
      setIsResuming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[540px] w-full border-border-main bg-surface shadow-md">
        <CardHeader className="text-center py-6 bg-subtle/50 border-b border-border-main">
          <div className="inline-flex p-3 bg-navy-primary text-text-inverse rounded-2xl shadow-xs mb-3">
            <RotateCcw className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1
            ref={pageHeadingRef}
            tabIndex={-1}
            className="text-lg font-extrabold text-text-main tracking-tight uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
          >
            RESUME EXAMINATION SESSION
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            An active paper session was detected for {studentName} ({rollNumber}).
          </p>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          {/* Paused Session Notice */}
          {isPaused && (
            <div role="status" aria-live="polite" className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-lg font-medium">
              <PauseCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Examination timer paused:</strong> Your exam timer was frozen when you left the
                screen. Time was not counted while you were away, and the countdown will continue from
                where it stopped when you resume.
              </div>
            </div>
          )}

          {/* Session Details List */}
          <div className="p-4 border border-border-main bg-subtle/40 rounded-lg space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-navy-primary" aria-hidden="true" />
                Paper ID:
              </span>
              <span className="font-bold text-text-main">{scheduleId.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                Restored Draft Responses:
              </span>
              <span className="font-bold text-green-700">{savedCount} Questions Cached</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-semibold flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-navy-primary" aria-hidden="true" />
                Marked for Review:
              </span>
              <span className="font-bold text-text-main">{flaggedCount} Questions</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                {isPaused ? 'Remaining Time (Frozen):' : 'Server Remaining Time:'}
              </span>
              <span className="font-bold text-amber-700">{formatDuration(secondsRemaining)}</span>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed text-center">
            {isPaused
              ? 'The countdown will restart from this frozen value when you click below to resume the paper workbench.'
              : 'Your locally cached responses and server state are intact. Click below to re-enter the active paper workbench.'}
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            isLoading={isResuming}
            isDisabled={isLoading || isResuming}
            onClick={handleResume}
            ariaLabel="Resume Examination Workbench"
          >
            RESUME EXAMINATION WORKBENCH
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default ResumeExamPage;
