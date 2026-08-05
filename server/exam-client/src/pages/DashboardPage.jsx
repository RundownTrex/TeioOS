import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAssignedExams } from '../features/exams/hooks/useAssignedExams';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ArrowRight, User, Clock, Lock, RotateCcw } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { EXAM_SESSION_STATUS } from '../utils/constants';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: assignedExams, isLoading, isError, error, refetch } = useAssignedExams();
  const [now, setNow] = useState(() => Date.now());

  useDocumentTitle('Student Dashboard');
  const pageHeadingRef = useFocusOnMount();

  // 1-second ticker for real-time kiosk schedule status auto-unlocking
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const student = {
    name: userProfile?.name || userProfile?.full_name || 'Candidate',
    rollNumber: userProfile?.roll_number || '',
    department: userProfile?.department_name || '',
    className: userProfile?.class_name || '',
  };

  const isTerminalSession = (exam) => {
    const status = exam?.session?.status;
    return [
      EXAM_SESSION_STATUS.SUBMITTED,
      EXAM_SESSION_STATUS.AUTO_SUBMITTED,
      EXAM_SESSION_STATUS.EXPIRED,
      EXAM_SESSION_STATUS.TERMINATED,
    ].includes(status);
  };

  const isInProgress = (exam) => exam?.session?.status === EXAM_SESSION_STATUS.IN_PROGRESS;

  // Filter out any completed, submitted, expired or cancelled exams
  const activeExams = (assignedExams || []).filter((exam) => {
    if (isTerminalSession(exam)) return false;
    if (exam.status === 'COMPLETED' || exam.status === 'SUBMITTED' || exam.status === 'CANCELLED') return false;
    if (isInProgress(exam)) return true;
    if (!exam.end_time) return true;
    const endTimeMs = new Date(exam.end_time).getTime();
    return endTimeMs > now;
  });

  const completedExams = (assignedExams || []).filter((exam) => {
    if (isTerminalSession(exam)) return true;
    if (exam.status === 'COMPLETED' || exam.status === 'SUBMITTED') return true;
    if (exam.end_time) {
      const endTimeMs = new Date(exam.end_time).getTime();
      return endTimeMs <= now;
    }
    return false;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={100} />
        <Skeleton variant="rectangular" height={220} />
        <Skeleton variant="rectangular" height={150} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Examinations"
        message={error?.message || 'Unable to fetch assigned examination schedules from the backend server.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* STUDENT INFORMATION BANNER (Text-only, High Contrast) */}
      <Card className="border-border-main bg-surface shadow-sm">
        <CardHeader className="bg-subtle/50 pb-2">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-navy-primary" aria-hidden="true" />
            STUDENT INFORMATION
          </h3>
        </CardHeader>
        <CardBody className="py-4">
          <div className="text-sm font-medium text-text-main leading-relaxed">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span><strong>Name:</strong> {student.name}</span>
              {student.rollNumber && (
                <>
                  <span className="text-border-strong hidden sm:inline">│</span>
                  <span><strong>Roll Number:</strong> {student.rollNumber}</span>
                </>
              )}
              {student.department && (
                <>
                  <span className="text-border-strong hidden sm:inline">│</span>
                  <span><strong>Department:</strong> {student.department}</span>
                </>
              )}
              {student.className && (
                <>
                  <span className="text-border-strong hidden sm:inline">│</span>
                  <span><strong>Class:</strong> {student.className}</span>
                </>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* PRIMARY SECTION: AVAILABLE EXAMINATIONS */}
      <section aria-labelledby="available-exams-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="available-exams-heading"
            ref={pageHeadingRef}
            tabIndex={-1}
            className="text-lg font-extrabold text-text-main tracking-tight uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
          >
            AVAILABLE EXAMINATIONS
          </h2>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh List
          </Button>
        </div>

        {activeExams.length === 0 ? (
          <EmptyState
            title="No Examinations Currently Available"
            description="There are no active or scheduled examination papers assigned to your student profile at this time."
            actionLabel="Refresh List"
            onAction={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            {activeExams.map((exam) => {
              const startTimeMs = exam.start_time ? new Date(exam.start_time).getTime() : 0;
              const isUpcoming = startTimeMs > now;
              const resumeActive = isInProgress(exam);
              const statusText = resumeActive
                ? 'IN PROGRESS'
                : isUpcoming
                  ? 'SCHEDULED'
                  : (exam.status || 'READY TO START');
              const badgeVariant = resumeActive ? 'info' : isUpcoming ? 'info' : 'success';

              return (
                <Card key={exam.schedule_id} className="border border-navy-primary/30 hover:border-navy-primary bg-surface shadow-sm transition-all duration-normal">
                  <CardHeader className="flex flex-wrap items-start justify-between gap-3 bg-subtle/30 pb-3">
                    <div>
                      <span className="text-xs font-mono font-semibold text-navy-primary uppercase">
                        {exam.subject_code} • {exam.department_name}
                      </span>
                      <h3 className="text-xl font-bold text-text-main leading-snug">
                        {exam.subject_name}
                      </h3>
                    </div>
                    <Badge variant={badgeVariant} size="md">
                      {statusText}
                    </Badge>
                  </CardHeader>

                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-text-muted font-medium pt-1">
                      <div><strong>Window:</strong> {formatDateTime(exam.start_time)}</div>
                      <div><strong>Duration:</strong> {exam.duration_minutes} Mins</div>
                      <div><strong>Total Marks:</strong> {exam.total_marks}</div>
                    </div>

                    {resumeActive && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-300 text-blue-900 text-xs rounded-md">
                        <Clock className="w-4 h-4 shrink-0 text-navy-primary" aria-hidden="true" />
                        <span>An active examination session was detected for this paper. Resume to continue without losing any time.</span>
                      </div>
                    )}

                    {isUpcoming && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-md">
                        <Clock className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
                        <span>Examination scheduled to start at {formatDateTime(exam.start_time)}. Instructions can be reviewed in advance.</span>
                      </div>
                    )}

                    <div className="pt-2">
                      {resumeActive ? (
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth={true}
                          onClick={() => navigate(`/exam/${exam.schedule_id}/resume`)}
                          rightIcon={<RotateCcw className="w-4 h-4" />}
                          ariaLabel={`Resume active examination for ${exam.subject_name}`}
                        >
                          Resume Examination
                        </Button>
                      ) : (
                        <Button
                          variant={isUpcoming ? 'secondary' : 'primary'}
                          size="lg"
                          fullWidth={true}
                          onClick={() => navigate(`/exam/${exam.schedule_id}/instructions`)}
                          rightIcon={isUpcoming ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          ariaLabel={`Proceed to Examination Instructions for ${exam.subject_name}`}
                        >
                          {isUpcoming ? 'Read Instructions (Exam Scheduled)' : 'Proceed to Examination Instructions'}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECONDARY SECTION: COMPLETED PAPERS */}
      <section aria-labelledby="completed-exams-heading" className="space-y-4 pt-4 border-t border-border-main">
        <h2 id="completed-exams-heading" className="text-base font-bold text-text-main tracking-tight uppercase">
          COMPLETED PAPERS
        </h2>

        <Card className="border-border-main bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-labelledby="completed-exams-heading">
              <caption className="sr-only">Completed examinations history table</caption>
              <thead className="bg-subtle text-text-muted font-semibold uppercase tracking-wider border-b border-border-main">
                <tr>
                  <th scope="col" className="px-4 py-3">Code</th>
                  <th scope="col" className="px-4 py-3">Subject Title</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-text-main">
                {completedExams.length > 0 ? (
                  completedExams.map((exam) => (
                    <tr key={exam.schedule_id} className="hover:bg-subtle/40">
                      <th scope="row" className="px-4 py-3 font-mono font-bold text-navy-primary text-left">
                        {exam.subject_code}
                      </th>
                      <td className="px-4 py-3 font-medium">{exam.subject_name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {exam.start_time ? new Date(exam.start_time).toISOString().split('T')[0] : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="purple" size="sm">
                          Submitted (Evaluation Pending)
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-muted font-medium">
                      No completed examination papers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
