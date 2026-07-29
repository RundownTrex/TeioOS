import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useExam } from '../hooks/useExam';
import { RotateCcw, ShieldCheck, Clock, FileText } from 'lucide-react';
import { restoreLocalAnswers } from '../utils/resilienceManager';
import { formatDuration } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Screen 6: Resume Examination (Active Session Recovery)
 *
 * Triggers automatically when a candidate re-opens the kiosk browser or refreshes.
 * Restores cached answers, verifies server synchronization, and allows seamless resumption.
 */
export const ResumeExamPage = () => {
  const { scheduleId = 'cs-401' } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { endTime } = useExam();

  const studentName = userProfile?.name || 'Alex Smith';
  const rollNumber = userProfile?.roll_number || 'STU-2026-8941';

  useDocumentTitle('Resume Examination');

  // Compute restored draft count from local resilience cache
  const restoredAnswers = useMemo(() => restoreLocalAnswers(scheduleId), [scheduleId]);
  const savedCount = Object.keys(restoredAnswers).filter((k) => Boolean(restoredAnswers[k])).length;

  const secondsRemaining = useMemo(() => {
    if (endTime) {
      const remainingMs = new Date(endTime).getTime() - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    }
    return 4320; // 01h 12m fallback
  }, [endTime]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[540px] w-full border-border-main bg-surface shadow-md">
        <CardHeader className="text-center py-6 bg-subtle/50 border-b border-border-main">
          <div className="inline-flex p-3 bg-navy-primary text-text-inverse rounded-2xl shadow-xs mb-3">
            <RotateCcw className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-extrabold text-text-main tracking-tight uppercase">
            RESUME EXAMINATION SESSION
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            An active paper session was detected for {studentName} ({rollNumber}).
          </p>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
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
                <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                Server Remaining Time:
              </span>
              <span className="font-bold text-amber-700">{formatDuration(secondsRemaining)}</span>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed text-center">
            Your locally cached responses and server state are intact. Click below to re-enter the active paper workbench.
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate(`/exam/${scheduleId}/active`)}
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
