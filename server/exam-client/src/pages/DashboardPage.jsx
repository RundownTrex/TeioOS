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
import { DashboardSection } from '../components/layout/DashboardSection';
import { ArrowRight, User, Clock, Lock, RotateCcw, RefreshCw } from 'lucide-react';
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

  // The primary active paper is the first in-progress or available exam
  const primaryExam = activeExams[0];
  const upcomingExams = activeExams.slice(1);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      {/* ── PRIMARY COLUMN (8 COLS ON DESKTOP) ── */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        {/* SECTION 1: CURRENT / ACTIVE EXAMINATION HERO */}
        <DashboardSection
          id="current-exam"
          title="CURRENT EXAMINATION"
          headingRef={pageHeadingRef}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh List
            </Button>
          }
        >
          {primaryExam ? (
            (() => {
              const startTimeMs = primaryExam.start_time ? new Date(primaryExam.start_time).getTime() : 0;
              const isUpcoming = startTimeMs > now;
              const resumeActive = isInProgress(primaryExam);
              const statusText = resumeActive
                ? 'IN PROGRESS'
                : isUpcoming
                  ? 'SCHEDULED'
                  : (primaryExam.status || 'READY TO START');
              const badgeVariant = resumeActive ? 'info' : isUpcoming ? 'info' : 'success';

              return (
                <Card className="border border-border-main bg-surface shadow-sm">
                  <CardHeader className="flex flex-wrap items-start justify-between gap-3 bg-subtle/30 pb-3">
                    <div>
                      <span className="text-xs font-mono font-semibold text-navy-primary uppercase">
                        {primaryExam.subject_code} • {primaryExam.department_name}
                      </span>
                      <h3 className="text-xl font-bold text-text-main leading-snug">
                        {primaryExam.subject_name}
                      </h3>
                    </div>
                    <Badge variant={badgeVariant} size="md">
                      {statusText}
                    </Badge>
                  </CardHeader>

                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-text-muted font-medium pt-1">
                      <div><strong>Window:</strong> {formatDateTime(primaryExam.start_time)}</div>
                      <div><strong>Duration:</strong> {primaryExam.duration_minutes} Mins</div>
                      <div><strong>Total Marks:</strong> {primaryExam.total_marks}</div>
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
                        <span>Examination scheduled to start at {formatDateTime(primaryExam.start_time)}. Instructions can be reviewed in advance.</span>
                      </div>
                    )}

                    <div className="pt-2">
                      {resumeActive ? (
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth={true}
                          onClick={() => navigate(`/exam/${primaryExam.schedule_id}/resume`)}
                          rightIcon={<RotateCcw className="w-4 h-4" />}
                          ariaLabel={`Resume active examination for ${primaryExam.subject_name}`}
                        >
                          Resume Examination
                        </Button>
                      ) : (
                        <Button
                          variant={isUpcoming ? 'secondary' : 'primary'}
                          size="lg"
                          fullWidth={true}
                          onClick={() => navigate(`/exam/${primaryExam.schedule_id}/instructions`)}
                          rightIcon={isUpcoming ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          ariaLabel={`Proceed to Examination Instructions for ${primaryExam.subject_name}`}
                        >
                          {isUpcoming ? 'Read Instructions (Exam Scheduled)' : 'Proceed to Examination Instructions'}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })()
          ) : (
            <EmptyState
              title="No Active Examinations Available"
              description="There are no active or scheduled examination papers assigned to your student profile at this time."
              actionLabel="Refresh List"
              onAction={() => refetch()}
            />
          )}
        </DashboardSection>

        {/* SECTION 2: UPCOMING EXAMINATIONS GRID (WHEN > 1 PAPER) */}
        {upcomingExams.length > 0 && (
          <DashboardSection id="upcoming-exams" title="UPCOMING EXAMINATIONS">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingExams.map((exam) => {
                const startTimeMs = exam.start_time ? new Date(exam.start_time).getTime() : 0;
                const isUpcoming = startTimeMs > now;
                return (
                  <Card key={exam.schedule_id} className="border border-border-main bg-surface shadow-sm">
                    <CardHeader className="bg-subtle/30 pb-2">
                      <span className="text-[11px] font-mono font-semibold text-navy-primary uppercase">
                        {exam.subject_code}
                      </span>
                      <h4 className="text-sm font-bold text-text-main leading-tight truncate">
                        {exam.subject_name}
                      </h4>
                    </CardHeader>
                    <CardBody className="space-y-3 pt-2">
                      <div className="text-xs text-text-muted space-y-1">
                        <div><strong>Start:</strong> {formatDateTime(exam.start_time)}</div>
                        <div><strong>Duration:</strong> {exam.duration_minutes} Mins</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth={true}
                        onClick={() => navigate(`/exam/${exam.schedule_id}/instructions`)}
                        rightIcon={isUpcoming ? <Lock className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isUpcoming ? 'View Schedule' : 'Start Exam'}
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </DashboardSection>
        )}
      </div>

      {/* ── SIDEBAR COLUMN (4 COLS ON DESKTOP) ── */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        {/* SECTION 3: COMPACT STUDENT PROFILE */}
        <DashboardSection id="student-profile" title="STUDENT PROFILE">
          <Card className="border-border-main bg-surface shadow-sm">
            <CardBody className="py-3 px-4">
              <div className="text-xs font-medium text-text-main leading-relaxed space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-navy-primary shrink-0" aria-hidden="true" />
                  <span className="font-bold text-sm text-text-main">{student.name}</span>
                </div>
                {student.rollNumber && (
                  <div className="text-text-muted">
                    <strong className="text-text-main">Roll No:</strong> {student.rollNumber}
                  </div>
                )}
                {student.department && (
                  <div className="text-text-muted">
                    <strong className="text-text-main">Dept:</strong> {student.department} {student.className ? `(${student.className})` : ''}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </DashboardSection>

        {/* SECTION 4: COMPLETED PAPERS */}
        <DashboardSection id="completed-exams" title="COMPLETED PAPERS">
          {completedExams.length > 0 ? (
            <Card className="border-border-main bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" aria-labelledby="completed-exams-heading">
                  <caption className="sr-only">Completed examinations history table</caption>
                  <thead className="bg-subtle text-text-muted font-semibold uppercase tracking-wider border-b border-border-main">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Code</th>
                      <th scope="col" className="px-3 py-2.5">Title</th>
                      <th scope="col" className="px-3 py-2.5">Status</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main text-text-main">
                    {completedExams.map((exam) => {
                      const result = exam.session?.result;
                      const isPublished = Boolean(result?.is_published);
                      const obtainedMarks = result?.obtained_marks;
                      const totalMarks = result?.total_marks ?? exam.total_marks;

                      return (
                        <tr key={exam.schedule_id} className="hover:bg-subtle/40">
                          <th scope="row" className="px-3 py-2.5 font-mono font-bold text-navy-primary text-left">
                            {exam.subject_code}
                          </th>
                          <td className="px-3 py-2.5 font-medium truncate max-w-[120px]" title={exam.subject_name}>
                            {exam.subject_name}
                          </td>
                          <td className="px-3 py-2.5">
                            {isPublished ? (
                              <Badge variant="success" size="sm" title={`Result Published (${obtainedMarks}/${totalMarks})`}>
                                {obtainedMarks !== undefined && obtainedMarks !== null
                                  ? `Published (${obtainedMarks}/${totalMarks})`
                                  : 'Result Published'}
                              </Badge>
                            ) : (
                              <Badge variant="purple" size="sm">
                                Submitted (Pending)
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {isPublished ? (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => navigate(`/exam/${exam.schedule_id}/review`)}
                                ariaLabel={`Review paper for ${exam.subject_name}`}
                              >
                                Review
                              </Button>
                            ) : (
                              <span className="text-[11px] text-text-muted italic">In Eval</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No Completed Papers"
              description="You have not completed or submitted any examination papers yet."
            />
          )}
        </DashboardSection>
      </div>
    </div>
  );
};

export default DashboardPage;
