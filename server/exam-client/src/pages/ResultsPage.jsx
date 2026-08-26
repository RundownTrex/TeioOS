import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useAuth } from '../hooks/useAuth';
import { useExamResult } from '../features/exams/hooks/useExamResult';
import { useExamInstructions } from '../features/exams/hooks/useExamInstructions';
import { Clock, ArrowLeft, Award, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTTS } from '../hooks/useTTS';

export const ResultsPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText } = useTTS();

  useDocumentTitle('Performance Report');
  const pageHeadingRef = useFocusOnMount();

  const { data: resultData, isLoading: isResultLoading, isError: isResultError, error: resultError, refetch } = useExamResult(scheduleId);
  const { data: instructionData, isLoading: isInstructionLoading } = useExamInstructions(scheduleId);

  const studentName = userProfile?.name || userProfile?.full_name || 'Candidate';
  const rollNumber = userProfile?.roll_number || '';

  const subjectCode = instructionData?.subject_code || 'EXAM';
  const subjectName = instructionData?.subject_name || 'Examination';
  const isPublished = Boolean(resultData?.is_published);
  const evaluationStatus = resultData?.evaluation_status || 'PENDING_EVALUATION';
  const obtainedMarks = resultData?.obtained_marks ?? 0;
  const totalMarks = resultData?.total_marks ?? instructionData?.total_marks ?? 100;
  const percentage = resultData?.percentage ?? (totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0);
  const grade = resultData?.grade || (percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F');

  const handleReadScoreAloud = () => {
    if (!isPublished) {
      speakText(
        `Performance Report for ${subjectName}. Evaluation is currently in progress. Final scores have not yet been published.`,
        'Performance Report Summary'
      );
      return;
    }
    speakText(
      `Performance Report for ${subjectName}. Score: ${obtainedMarks} out of ${totalMarks} marks. Grade: ${grade}. Percentage: ${percentage} percent.`,
      'Performance Report Summary'
    );
  };

  // Register Shortcuts for Results Page
  useEffect(() => {
    registerHandler('ttsReadQuestion', handleReadScoreAloud);
    registerHandler('navDashboard', () => navigate('/dashboard'));
    registerHandler('logout', () => {
      logout();
      navigate('/login', { replace: true });
    });

    return () => {
      unregisterHandler('ttsReadQuestion');
      unregisterHandler('navDashboard');
      unregisterHandler('logout');
    };
  }, [registerHandler, unregisterHandler, isPublished, obtainedMarks, totalMarks, grade, percentage, subjectName, navigate, logout]);

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

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || key === 'D') {
        e.preventDefault();
        navigate('/dashboard');
      } else if (key === 'R') {
        e.preventDefault();
        handleReadScoreAloud();
      } else if (key === 'L') {
        e.preventDefault();
        logout();
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReadScoreAloud, logout, navigate]);

  // Initial Auditory Announcement on Mount
  useEffect(() => {
    if (!isResultLoading && !isInstructionLoading) {
      const prompt = `Performance Report for ${subjectName}. Press R to hear your score summary.`;
      const timer = setTimeout(() => {
        speakText(prompt, 'Results Orientation');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isResultLoading, isInstructionLoading, subjectName, speakText]);

  if (isResultLoading || isInstructionLoading) {
    return (
      <ExamLayout paperTitle="Loading Results..." sectionTitle="Performance Report">
        <div className="max-w-4xl mx-auto space-y-4 p-4 my-6">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={220} />
        </div>
      </ExamLayout>
    );
  }

  if (isResultError && !resultData) {
    return (
      <ExamLayout paperTitle="Results" sectionTitle="Performance Report">
        <div className="max-w-2xl mx-auto my-8 p-4">
          <ErrorState
            title="Result Pending Evaluation"
            message={
              resultError?.response?.data?.message ||
              resultError?.message ||
              'Examination results have not been published by the administration yet. Please check back later.'
            }
            actionLabel="Return to Dashboard"
            onAction={() => navigate('/dashboard')}
            onRetry={() => refetch()}
          />
        </div>
      </ExamLayout>
    );
  }

  return (
    <ExamLayout paperTitle={subjectCode} sectionTitle="Performance Report">
      <div className="max-w-[900px] mx-auto space-y-6 select-none my-4">
        {/* Paper Header Card */}
        <Card className="border-border-main bg-surface shadow-sm">
          <CardHeader className="bg-subtle/40 border-b border-border-main pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-navy-primary uppercase tracking-wider">
                  {subjectCode} • PERFORMANCE REPORT
                </span>
                <h2
                  ref={pageHeadingRef}
                  tabIndex={-1}
                  className="text-2xl font-extrabold text-text-main leading-snug mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
                >
                  {subjectName}
                </h2>
                <p className="text-xs text-text-muted mt-1 font-medium">
                  Candidate: {studentName} {rollNumber ? `(${rollNumber})` : ''}
                </p>
              </div>
              <Badge variant={isPublished ? 'success' : 'purple'} size="md">
                {isPublished ? 'FINAL EVALUATION PUBLISHED' : 'EVALUATION IN PROGRESS'}
              </Badge>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Grid Layout: Overall Status Card & Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Overall Result Status Summary */}
              <Card className="md:col-span-1 border border-navy-primary/20 bg-subtle/20 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-navy-primary uppercase tracking-wider">
                    <Award className="w-4 h-4" aria-hidden="true" />
                    <span>OVERALL RESULT STATUS</span>
                  </div>

                  {/* Marks Score Box */}
                  <div className="p-3 bg-surface border border-border-main rounded-lg space-y-1">
                    <span className="text-xs font-medium text-text-muted block">
                      TOTAL MARKS SCORED:
                    </span>
                    <div className="text-2xl font-extrabold text-text-main">
                      {isPublished ? obtainedMarks : '—'}{' '}
                      <span className="text-sm font-normal text-text-muted">
                        / {totalMarks}
                      </span>
                    </div>
                  </div>

                  {/* Grade / Percentage Box */}
                  <div className="p-3 bg-surface border border-border-main rounded-lg space-y-1">
                    <span className="text-xs font-medium text-text-muted block">
                      PERCENTAGE & GRADE:
                    </span>
                    {isPublished ? (
                      <div className="text-lg font-bold text-text-main">
                        {percentage}% (Grade {grade})
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-purple-700">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>Pending Evaluation</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Published Date Summary */}
                <div className="pt-3 border-t border-border-main space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                    STATUS:
                  </span>
                  <div className="text-sm font-bold text-navy-primary">
                    {isPublished
                      ? `Published on ${formatDateTime(resultData?.published_at)}`
                      : 'Evaluation In Progress'}
                  </div>
                </div>
              </Card>

              {/* Right Column: Status Details & Notice */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 id="result-status-heading" className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                    <span>RESULT DETAILS</span>
                  </h3>

                  <div className="border border-border-main rounded-lg p-4 bg-surface space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-muted font-medium">Evaluation Status:</span>
                      <span className="font-bold text-text-main">{evaluationStatus}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-border-main pt-2">
                      <span className="text-text-muted font-medium">Total Maximum Marks:</span>
                      <span className="font-bold text-text-main">{totalMarks} Marks</span>
                    </div>
                    {isPublished && (
                      <div className="flex justify-between items-center text-sm border-t border-border-main pt-2">
                        <span className="text-text-muted font-medium">Marks Obtained:</span>
                        <span className="font-bold text-success">{obtainedMarks} Marks</span>
                      </div>
                    )}
                  </div>

                  {isPublished ? (
                    <Alert variant="success" className="text-xs">
                      <strong>Official Result Published:</strong> Your performance report has been verified and finalized by the examination board. You can review your paper by accessing the paper review screen from the dashboard.
                    </Alert>
                  ) : (
                    <Alert variant="info" className="text-xs">
                      <strong>Pending Evaluation Notice:</strong> Your examination paper has been received securely. Official scores and feedback comments will be displayed here once descriptive evaluation is finalized by the course evaluator.
                    </Alert>
                  )}
                </div>

                {/* Paper Review Link if published */}
                {isPublished && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/exam/${scheduleId}/review`)}
                      leftIcon={<CheckCircle className="w-4 h-4 text-success" />}
                    >
                      View Detailed Question Review
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Navigation Button */}
            <div className="pt-4 border-t border-border-main flex justify-end">
              <Button
                id="return-dashboard-btn"
                variant="primary"
                size="md"
                autoFocus={true}
                onClick={() => navigate('/dashboard')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                ariaLabel="Return to Student Dashboard"
              >
                Return to Dashboard (Enter)
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </ExamLayout>
  );
};

export default ResultsPage;
