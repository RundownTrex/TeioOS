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

/**
 * Screen 8: Post-Submission Terminal State Screen
 *
 * Confirms secure paper delivery to the PostgreSQL server and treats submission
 * as the terminal state of the examination, handing control to the real-world hall invigilator.
 */
export const SubmittedPage = () => {
  const { scheduleId = 'cs-401' } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { clearExamSession } = useExam();

  useDocumentTitle('Paper Submitted');

  // Generate deterministic receipt details from schedule ID and timestamp
  const submissionData = useMemo(() => {
    const now = new Date();
    const rollNumber = userProfile?.roll_number || 'STU-2026-8941';
    const shortId = String(scheduleId || 'CS401').replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase();
    const receiptCode = `TX-${rollNumber.replace(/[^A-Z0-9]/gi, '').slice(-4)}-${now.getFullYear()}-${shortId}`;

    return {
      receiptCode,
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
  }, [scheduleId, userProfile]);

  // Clear active exam session tokens on mount (terminal state reached)
  useEffect(() => {
    clearExamSession();
  }, [clearExamSession]);

  return (
    <ExamLayout paperTitle="EXAMINATION COMPLETE" sectionTitle="Paper Submitted">
      <div className="max-w-[580px] mx-auto space-y-6 select-none my-4 sm:my-8">
        {/* Primary Success Confirmation Card */}
        <Card className="border-border-main bg-surface shadow-sm overflow-hidden">
          {/* Success Banner */}
          <CardHeader className="text-center py-8 bg-green-50 border-b border-green-200">
            <div className="inline-flex p-4 bg-green-100 text-green-600 rounded-full shadow-inner mb-4">
              <CheckCircle2 className="w-12 h-12" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-extrabold text-text-main tracking-tight uppercase">
              EXAMINATION SUBMITTED SUCCESSFULLY
            </h2>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed max-w-md mx-auto">
              Your examination paper has reached its terminal state. All responses are permanently recorded on the server database.
            </p>
          </CardHeader>

          <CardBody className="space-y-6 p-6">
            {/* Submission Receipt Details Card */}
            <section aria-labelledby="receipt-heading" className="space-y-3">
              <h3 id="receipt-heading" className="sr-only">Submission Receipt Details</h3>
              <div className="p-4 border border-border-main bg-subtle/50 rounded-lg space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-semibold">Receipt Code:</span>
                  <span className="font-bold text-navy-primary tracking-wider">{submissionData.receiptCode}</span>
                </div>
                <hr className="border-border-main" />
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
                <div className="flex justify-between items-center pt-1 border-t border-border-main">
                  <span className="text-text-muted font-semibold">Session Status:</span>
                  <Badge variant="success" size="sm">
                    COMPLETED & LOCKED
                  </Badge>
                </div>
              </div>
            </section>

            {/* Real-World Examination Room Guidance */}
            <section aria-labelledby="room-guidance-heading" className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 text-blue-950 text-xs rounded-lg font-medium leading-relaxed">
                <ShieldCheck className="w-5 h-5 shrink-0 text-navy-primary mt-0.5" aria-hidden="true" />
                <div className="space-y-1.5">
                  <h3 id="room-guidance-heading" className="text-xs font-bold uppercase tracking-wider">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/dashboard')}
                leftIcon={<Home className="w-4 h-4" />}
                ariaLabel="Return to Student Dashboard"
              >
                Dashboard
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
                ariaLabel="Log Out Candidate Session"
              >
                Log Out Candidate
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/exam/${scheduleId}/results`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                ariaLabel="View Performance Report"
              >
                Performance Report
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </ExamLayout>
  );
};

export default SubmittedPage;
