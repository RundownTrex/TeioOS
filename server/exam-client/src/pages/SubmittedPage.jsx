import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useExam } from '../hooks/useExam';
import { CheckCircle2, ShieldCheck, ArrowRight, Home, LogOut } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTTS } from '../hooks/useTTS';

/**
 * Screen 8: Post-Submission Terminal State Screen
 *
 * Confirms secure paper delivery to the PostgreSQL server and treats submission
 * as the terminal state of the examination, handing control to the real-world hall invigilator.
 */
export const SubmittedPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { clearExamSession } = useExam();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText } = useTTS();

  useDocumentTitle('Paper Submitted');
  const pageHeadingRef = useFocusOnMount();

  // Generate deterministic details from student profile and timestamp
  const submissionData = useMemo(() => {
    const now = new Date();
    const rollNumber = userProfile?.roll_number || '';

    return {
      candidateName: userProfile?.name || userProfile?.full_name || 'Candidate',
      rollNumber,
      submissionTime: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }),
      submissionDate: now.toLocaleDateString('en-US', {
        dateStyle: 'medium',
      }),
    };
  }, [userProfile]);

  // Clear active exam session tokens on mount (terminal state reached)
  useEffect(() => {
    clearExamSession();
  }, [clearExamSession]);

  // Register Shortcuts for Post-Submission Navigation
  useEffect(() => {
    registerHandler('dashboardStartExam', () => navigate(`/exam/${scheduleId}/results`));
    registerHandler('navDashboard', () => navigate('/dashboard'));
    registerHandler('logout', () => {
      logout();
      navigate('/login', { replace: true });
    });

    return () => {
      unregisterHandler('dashboardStartExam');
      unregisterHandler('navDashboard');
      unregisterHandler('logout');
    };
  }, [registerHandler, unregisterHandler, scheduleId, navigate, logout]);

  // Global Key Listener for zero-tab actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputElem =
        e.target &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable);

      if (isInputElem) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toUpperCase();

      if (e.key === 'Enter' || e.key === ' ' || key === 'P' || key === 'R') {
        e.preventDefault();
        navigate(`/exam/${scheduleId}/results`);
      } else if (e.key === 'Escape' || key === 'D') {
        e.preventDefault();
        navigate('/dashboard');
      } else if (key === 'L') {
        e.preventDefault();
        logout();
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scheduleId, navigate, logout]);

  // Auditory Orientation on Mount
  useEffect(() => {
    const prompt = 'Examination submitted successfully. Press Enter for your Performance Report, or press D for Dashboard.';
    const timer = setTimeout(() => {
      speakText(prompt, 'Submission Confirmation');
    }, 600);
    return () => clearTimeout(timer);
  }, [speakText]);

  return (
    <ExamLayout paperTitle="EXAMINATION COMPLETE" sectionTitle="Paper Submitted">
      <div className="max-w-[600px] mx-auto space-y-6 select-none my-4 sm:my-8">
        {/* Primary Success Confirmation Card */}
        <Card className="border-border-main bg-surface shadow-sm overflow-hidden">
          {/* Success Banner */}
          <CardHeader className="text-center py-8 bg-subtle/40 border-b border-border-main">
            <div className="inline-flex p-3.5 bg-status-success-bg text-status-success rounded-full shadow-sm mb-3">
              <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
            </div>
            <h2
              ref={pageHeadingRef}
              tabIndex={-1}
              className="text-xl font-extrabold text-text-main tracking-tight uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
            >
              EXAMINATION SUBMITTED SUCCESSFULLY
            </h2>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed max-w-md mx-auto">
              Your examination paper has reached its terminal state. All responses are permanently recorded on the server database.
            </p>
          </CardHeader>

          <CardBody className="space-y-6 p-6">
            {/* Submission Details Card */}
            <section aria-labelledby="submission-details-heading" className="space-y-3">
              <h3 id="submission-details-heading" className="sr-only">Submission Details</h3>
              <div className="p-4 border border-border-main bg-subtle/50 rounded-lg space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-semibold">Candidate:</span>
                  <span className="font-bold text-text-main">
                    {submissionData.candidateName} ({submissionData.rollNumber})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-semibold">Submission Time:</span>
                  <span className="font-bold text-text-main">{submissionData.submissionTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-semibold">Date:</span>
                  <span className="font-bold text-text-main">{submissionData.submissionDate}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border-main">
                  <span className="text-text-muted font-semibold">Session Status:</span>
                  <Badge variant="success" size="sm">
                    COMPLETED & LOCKED
                  </Badge>
                </div>
              </div>
            </section>

            {/* Real-World Examination Room Guidance */}
            <section aria-labelledby="room-guidance-heading" className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-navy-tint/40 border border-navy-primary/20 text-text-main text-xs rounded-lg font-medium leading-relaxed">
                <ShieldCheck className="w-5 h-5 shrink-0 text-navy-primary mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h3 id="room-guidance-heading" className="text-xs font-bold uppercase tracking-wider text-text-main">
                    REAL-WORLD EXAMINATION ROOM PROCEDURE:
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 text-text-muted">
                    <li>Please remain seated at your terminal until the hall invigilator verifies your attendance.</li>
                    <li>No further answers or inputs can be submitted from this workstation.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Post-Submission Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-main">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="w-full sm:w-auto"
                ariaLabel="Log Out Candidate Session"
              >
                Sign Out
              </Button>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/dashboard')}
                  leftIcon={<Home className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                  ariaLabel="Return to Student Dashboard"
                >
                  Dashboard
                </Button>
                <Button
                  id="performance-report-btn"
                  variant="primary"
                  size="md"
                  autoFocus={true}
                  onClick={() => navigate(`/exam/${scheduleId}/results`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                  ariaLabel="View Performance Report"
                >
                  Performance Report (Enter)
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </ExamLayout>
  );
};

export default SubmittedPage;
