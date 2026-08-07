import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ExamLayout } from '../layouts/ExamLayout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Alert } from '../components/ui/Alert';
import { useExamInstructions } from '../features/exams/hooks/useExamInstructions';
import { useExam } from '../hooks/useExam';
import { useAuth } from '../hooks/useAuth';
import { examsApi } from '../features/exams/api/examsApi';
import { ShieldCheck, Info, ArrowRight, ArrowLeft, Clock, Lock, CheckCircle2, FileText } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';

const STANDARD_CONDUCT_RULES = [
  'Ensure you remain seated at your designated computer terminal throughout the examination.',
  'The examination countdown timer will start immediately upon clicking "Begin Examination".',
  'Your responses are continuously auto-saved locally and synchronized with the server.',
  'Navigation between questions is completely free using the Question Palette sidebar.',
  'Marking a question for review does NOT exclude it from final evaluation if an answer is selected.',
  'Do not attempt to close the browser window or switch desktop applications during the exam session.',
];

const TECHNICAL_ACCESSIBILITY_NOTICES = [
  'You may adjust font size scaling and color contrast themes at any time using [Alt + A].',
  'In the event of a network disruption, your responses remain securely cached in local storage until reconnected.',
];

export const InstructionsPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const { initExamSession } = useExam();
  const { token: baseToken } = useAuth();

  useDocumentTitle('Examination Instructions');
  const pageHeadingRef = useFocusOnMount();

  const { data: apiInstructions, isLoading, isError, error, refetch } = useExamInstructions(scheduleId);

  // Auto-redirect candidate if exam is already completed or personal session is in state
  useEffect(() => {
    if (apiInstructions?.status === 'COMPLETED' || apiInstructions?.status === 'SUBMITTED') {
      navigate('/dashboard', { replace: true });
      return;
    }
    const sessionStatus = apiInstructions?.session?.status;
    if (
      sessionStatus === 'submitted' ||
      sessionStatus === 'auto_submitted' ||
      sessionStatus === 'expired' ||
      sessionStatus === 'terminated'
    ) {
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    } else if (sessionStatus === 'in_progress') {
      navigate(`/exam/${scheduleId}/resume`, { replace: true });
    }
  }, [apiInstructions, scheduleId, navigate]);

  // 1-second ticker for real-time schedule window status
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalQuestionsDisplay = (() => {
    const total = apiInstructions?.total_questions || 0;
    const mcqs = apiInstructions?.mcq_count || 0;
    const desc = apiInstructions?.descriptive_count || 0;
    if (mcqs > 0 && desc > 0) {
      return `${total} (${mcqs} MCQ${mcqs > 1 ? 's' : ''} + ${desc} Descriptive)`;
    }
    if (mcqs > 0) {
      return `${total} (${mcqs} MCQ${mcqs > 1 ? 's' : ''})`;
    }
    if (desc > 0) {
      return `${total} (${desc} Descriptive Question${desc > 1 ? 's' : ''})`;
    }
    return `${total} Question${total === 1 ? '' : 's'}`;
  })();

  const data = {
    subjectCode: apiInstructions?.subject_code || '',
    subjectName: apiInstructions?.exam_title || apiInstructions?.subject_name || 'Examination',
    departmentName: apiInstructions?.department_name || '',
    durationMinutes: apiInstructions?.duration_minutes || 0,
    totalMarks: apiInstructions?.total_marks || 0,
    totalQuestions: totalQuestionsDisplay,
    customInstructions: apiInstructions?.instructions || null,
    startTime: apiInstructions?.start_time,
    endTime: apiInstructions?.end_time,
  };

  const startTimeMs = data.startTime ? new Date(data.startTime).getTime() : 0;
  const isUpcoming = startTimeMs > now;

  const handleBeginExam = async () => {
    if (isUpcoming) return;
    setStartError('');
    setIsStarting(true);

    try {
      if (baseToken && scheduleId) {
        try {
          const response = await examsApi.startExam(scheduleId, baseToken);
          const startData = response?.data;

          if (!startData?.access_token) {
            throw new Error('Failed to obtain examination access token from backend server.');
          }

          initExamSession({
            token: startData.access_token,
            scheduleId: scheduleId,
            session: startData.session,
            serverCurrentTime: startData.server_current_time,
          });

          queryClient.setQueryData(['examSession', scheduleId, baseToken], {
            server_current_time: startData.server_current_time,
            ...startData.session,
          });

          navigate(`/exam/${scheduleId}/active`);
        } catch (apiErr) {
          console.warn('Backend live session start error:', apiErr);
          const errorMsg =
            apiErr?.message ||
            apiErr?.details ||
            'Failed to start examination session. You may have already submitted this exam.';

          if (apiErr?.code === 'SESSION_SUBMITTED') {
            navigate(`/exam/${scheduleId}/submitted`, { replace: true });
            return;
          }

          if (
            apiErr?.code === 'SESSION_EXPIRED' ||
            errorMsg.toLowerCase().includes('already submitted') ||
            errorMsg.toLowerCase().includes('closed') ||
            errorMsg.toLowerCase().includes('completed')
          ) {
            navigate('/dashboard', { replace: true });
            return;
          }

          setStartError(errorMsg);
          setIsStarting(false);
          return;
        }
      } else {
        setStartError('Authentication token missing. Please log in again.');
        setIsStarting(false);
      }
    } catch (err) {
      setStartError('Failed to initialize examination session. Please try again.');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <ExamLayout paperTitle="EXAM" sectionTitle="Instructions">
        <div className="max-w-[800px] mx-auto space-y-6">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={240} />
          <Skeleton variant="rectangular" height={100} />
        </div>
      </ExamLayout>
    );
  }

  if (isError) {
    return (
      <ExamLayout paperTitle="EXAM" sectionTitle="Instructions Error">
        <div className="max-w-[800px] mx-auto space-y-4">
          <ErrorState
            title="Failed to Load Instructions"
            message={error?.message || 'Could not retrieve examination details from the server.'}
            onRetry={() => refetch()}
          />
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </ExamLayout>
    );
  }

  return (
    <ExamLayout paperTitle={data.subjectCode || 'EXAM'} sectionTitle="Instructions & Rules">
      <div className="max-w-[800px] mx-auto space-y-6 select-none my-2">
        <Card className="border-border-main bg-surface shadow-sm">
          {/* Paper Metadata Banner */}
          <CardHeader className="bg-subtle/40 border-b border-border-main pb-4">
            {(data.subjectCode || data.departmentName) && (
              <span className="text-xs font-mono font-bold text-navy-primary uppercase tracking-wider">
                {data.subjectCode}{data.subjectCode && data.departmentName ? ' • ' : ''}{data.departmentName}
              </span>
            )}
            <h2
              ref={pageHeadingRef}
              tabIndex={-1}
              className="text-2xl font-extrabold text-text-main leading-snug mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
            >
              {data.subjectName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-text-muted font-medium pt-3 mt-2 border-t border-border-main">
              <div><strong>Duration:</strong> {data.durationMinutes} Minutes</div>
              <div><strong>Total Marks:</strong> {data.totalMarks} Marks</div>
              <div><strong>Questions:</strong> {data.totalQuestions}</div>
            </div>
          </CardHeader>

          <CardBody className="space-y-6 p-6">
            {/* Start Time Unlock Notice Banner */}
            {isUpcoming ? (
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-lg font-medium">
                <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>Kiosk Examination Schedule Lock:</strong> Paper scheduled to start at{' '}
                  <span className="font-bold">{formatDateTime(data.startTime)}</span>. The "Begin Examination" CTA button will automatically unlock in real-time when the schedule window opens.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-300 text-green-900 text-xs rounded-lg font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>Examination Window Active:</strong> You may check the agreement box and click "Begin Examination" to unlock your paper.
                </div>
              </div>
            )}

            {startError && (
              <Alert variant="error" className="mb-2">
                {startError}
              </Alert>
            )}

            {/* Custom Exam Instructions (If set on Exam by Admin/Teacher) */}
            {data.customInstructions && (
              <section aria-labelledby="custom-instructions-heading" className="space-y-3 p-4 bg-subtle/70 rounded-lg border border-border-main">
                <h3 id="custom-instructions-heading" className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                  SPECIFIC EXAMINATION INSTRUCTIONS:
                </h3>
                <div className="text-xs text-text-main leading-relaxed whitespace-pre-line font-medium">
                  {data.customInstructions}
                </div>
              </section>
            )}

            {/* Candidate Conduct & Rules */}
            <section aria-labelledby="conduct-rules-heading" className="space-y-3">
              <h3 id="conduct-rules-heading" className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                CANDIDATE CONDUCT & EXAMINATION RULES:
              </h3>
              <ol className="list-decimal pl-5 space-y-2.5 text-xs text-text-main leading-relaxed font-normal">
                {STANDARD_CONDUCT_RULES.map((rule, idx) => (
                  <li key={idx} className="pl-1">
                    {rule}
                  </li>
                ))}
              </ol>
            </section>

            {/* Technical & Accessibility Notice */}
            <section aria-labelledby="technical-notice-heading" className="space-y-3 pt-4 border-t border-border-main">
              <h3 id="technical-notice-heading" className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                TECHNICAL & ACCESSIBILITY NOTICE:
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-text-muted leading-relaxed">
                {TECHNICAL_ACCESSIBILITY_NOTICES.map((notice, idx) => (
                  <li key={idx} className="pl-1">
                    {notice}
                  </li>
                ))}
              </ul>
            </section>

            {/* Mandatory Agreement Checkbox */}
            <div className="p-4 bg-subtle rounded-lg border border-border-main">
              <Checkbox
                id="agree-rules-checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                label="I have read and agree to follow all examination instructions & rules."
                className="text-xs font-semibold text-text-main"
              />
            </div>

            {/* CTA Action Button */}
            <div className="pt-2">
              <Button
                variant={isUpcoming ? 'secondary' : 'primary'}
                size="lg"
                fullWidth={true}
                isDisabled={!hasAgreed || isUpcoming || isStarting}
                isLoading={isStarting}
                onClick={handleBeginExam}
                rightIcon={isUpcoming ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                ariaLabel="Begin Examination Session"
              >
                {isUpcoming
                  ? `Examination Locked (Unlocks at ${formatDateTime(data.startTime)})`
                  : 'Begin Examination'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </ExamLayout>
  );
};

export default InstructionsPage;
