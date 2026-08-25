import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { Clock, ArrowLeft, Award, FileText } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTTS } from '../hooks/useTTS';
import { announceToScreenReader } from '../utils/ariaAnnounce';

const MOCK_RESULTS = {
  mixed: {
    subjectCode: 'CS-401',
    subjectName: 'Algorithms & Data Structures',
    paperType: 'MIXED', // MIXED or MCQ_ONLY
    totalMarks: 100,
    objectiveMarksObtained: 36,
    objectiveMaxMarks: 40,
    descriptiveMaxMarks: 60,
    status: 'EVALUATION IN PROGRESS', // EVALUATION IN PROGRESS or COMPLETED
    sections: [
      {
        id: 'sec-a',
        title: 'Section A: MCQs',
        type: 'MCQ',
        totalQuestions: 20,
        maxMarks: 40,
        obtainedMarks: 36,
        status: 'FINAL',
      },
      {
        id: 'sec-b',
        title: 'Section B: Essay Questions',
        type: 'DESCRIPTIVE',
        totalQuestions: 2,
        maxMarks: 60,
        obtainedMarks: null,
        status: 'PENDING',
      },
    ],
    submittedAt: '2026-07-27 16:45 UTC',
  },
  mcq: {
    subjectCode: 'MA-301',
    subjectName: 'Applied Mathematics III',
    paperType: 'MCQ_ONLY',
    totalMarks: 50,
    objectiveMarksObtained: 44,
    objectiveMaxMarks: 50,
    descriptiveMaxMarks: 0,
    status: 'COMPLETED',
    sections: [
      {
        id: 'sec-a',
        title: 'Section A: Multiple Choice Questions',
        type: 'MCQ',
        totalQuestions: 25,
        maxMarks: 50,
        obtainedMarks: 44,
        status: 'FINAL',
      },
    ],
    submittedAt: '2026-07-20 11:30 UTC',
  },
};

export const ResultsPage = () => {
  const { scheduleId = 'cs-401' } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText } = useTTS();

  // Interactive toggle to switch mock view between Mixed paper and MCQ-only paper
  const [selectedType, setSelectedType] = useState('mixed');

  const studentName = userProfile?.name || 'Alex Smith';
  const rollNumber = userProfile?.roll_number || 'STU-2026-8941';
  const data = MOCK_RESULTS[selectedType];

  const isMixed = data.paperType === 'MIXED';

  useDocumentTitle('Performance Report');
  const pageHeadingRef = useFocusOnMount();

  const handleReadScoreAloud = () => {
    const text = isMixed
      ? `Performance Report for ${data.subjectName}. Objective score: ${data.objectiveMarksObtained} out of ${data.objectiveMaxMarks} marks. Descriptive evaluation is pending. Total evaluated so far: ${data.objectiveMarksObtained} out of ${data.totalMarks} marks.`
      : `Performance Report for ${data.subjectName}. Final Score: ${data.objectiveMarksObtained} out of ${data.totalMarks} marks. All questions evaluated and finalized.`;
    speakText(text, 'Performance Report Summary');
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
  }, [registerHandler, unregisterHandler, data, isMixed, navigate, logout]);

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
    const prompt = `Performance Report for ${data.subjectName}. Press R to hear score summary, or press Enter to return to the Dashboard.`;
    announceToScreenReader(prompt, 'polite');
  }, [data.subjectName]);

  return (
    <ExamLayout paperTitle={data.subjectCode} sectionTitle="Performance Report">
      <div className="max-w-[900px] mx-auto space-y-6 select-none my-4">
        {/* Toggle Mode Control Bar (For Demonstration & Testing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-subtle/80 border border-border-main rounded-lg text-xs">
          <span className="font-semibold text-text-muted">Demonstration Mock Selector:</span>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedType === 'mixed' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('mixed')}
            >
              Mixed Paper (MCQ + Descriptive)
            </Button>
            <Button
              variant={selectedType === 'mcq' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('mcq')}
            >
              MCQ-Only Paper
            </Button>
          </div>
        </div>

        {/* Paper Header Card */}
        <Card className="border-border-main bg-surface shadow-sm">
          <CardHeader className="bg-subtle/40 border-b border-border-main pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-navy-primary uppercase tracking-wider">
                  {data.subjectCode} • PERFORMANCE REPORT
                </span>
                <h2
                  ref={pageHeadingRef}
                  tabIndex={-1}
                  className="text-2xl font-extrabold text-text-main leading-snug mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
                >
                  {data.subjectName}
                </h2>
                <p className="text-xs text-text-muted mt-1 font-medium">
                  Candidate: {studentName} ({rollNumber})
                </p>
              </div>
              <Badge variant={isMixed ? 'purple' : 'success'} size="md">
                {isMixed ? 'EVALUATION IN PROGRESS' : 'FINAL EVALUATION COMPLETE'}
              </Badge>
            </div>
          </CardHeader>

          <CardBody className="p-6 space-y-6">
            {/* Grid Layout: Overall Status Card & Section Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Overall Result Status Summary */}
              <Card className="md:col-span-1 border border-navy-primary/20 bg-subtle/20 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-navy-primary uppercase tracking-wider">
                    <Award className="w-4 h-4" aria-hidden="true" />
                    <span>OVERALL RESULT STATUS</span>
                  </div>

                  {/* Objective Score Box */}
                  <div className="p-3 bg-surface border border-border-main rounded-lg space-y-1">
                    <span className="text-xs font-medium text-text-muted block">
                      OBJECTIVE MARKS (MCQ):
                    </span>
                    <div className="text-2xl font-extrabold text-text-main">
                      {data.objectiveMarksObtained}{' '}
                      <span className="text-sm font-normal text-text-muted">
                        / {data.objectiveMaxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Descriptive Score Box */}
                  <div className="p-3 bg-surface border border-border-main rounded-lg space-y-1">
                    <span className="text-xs font-medium text-text-muted block">
                      DESCRIPTIVE MARKS:
                    </span>
                    {isMixed ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-purple-700">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>Pending Manual Eval</span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-text-muted">
                        N/A (Objective Only)
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Summary Status */}
                <div className="pt-3 border-t border-border-main space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                    TOTAL EVALUATED:
                  </span>
                  <div className="text-xl font-black text-navy-primary">
                    {isMixed ? `${data.objectiveMarksObtained} / ${data.totalMarks}*` : `${data.objectiveMarksObtained} / ${data.totalMarks}`}
                  </div>
                  {isMixed && (
                    <span className="text-[11px] text-text-muted italic block">
                      *Excludes pending descriptive evaluation
                    </span>
                  )}
                </div>
              </Card>

              {/* Right Column: Section Breakdown Table */}
              <div className="md:col-span-2 space-y-4">
                <h3 id="section-breakdown-heading" className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-navy-primary" aria-hidden="true" />
                  <span>SECTION BREAKDOWN:</span>
                </h3>

                <div className="border border-border-main rounded-lg overflow-hidden bg-surface">
                  <table className="w-full text-left text-xs" aria-labelledby="section-breakdown-heading">
                    <caption className="sr-only">Examination section breakdown score table</caption>
                    <thead className="bg-subtle text-text-muted font-semibold uppercase tracking-wider border-b border-border-main">
                      <tr>
                        <th scope="col" className="px-4 py-3">Section Title</th>
                        <th scope="col" className="px-4 py-3">Type</th>
                        <th scope="col" className="px-4 py-3">Max Marks</th>
                        <th scope="col" className="px-4 py-3">Evaluation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main text-text-main">
                      {data.sections.map((section) => (
                        <tr key={section.id} className="hover:bg-subtle/30">
                          <th scope="row" className="px-4 py-3 font-semibold text-text-main text-left">
                            {section.title}
                          </th>
                          <td className="px-4 py-3 font-mono font-medium text-text-muted">
                            {section.type}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {section.maxMarks}
                          </td>
                          <td className="px-4 py-3">
                            {section.status === 'FINAL' ? (
                              <Badge variant="success" size="sm">
                                {section.obtainedMarks} Marks (Final)
                              </Badge>
                            ) : (
                              <Badge variant="purple" size="sm">
                                PENDING EVALUATION
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mixed Paper Pending Evaluation Notice */}
                {isMixed ? (
                  <Alert variant="info" className="text-xs">
                    <strong>Pending Evaluation Notice:</strong> Your objective MCQ responses have been automatically scored. Final paper transcript and official grade will be published after manual evaluation of descriptive answers by the course evaluator.
                  </Alert>
                ) : (
                  <Alert variant="success" className="text-xs">
                    <strong>Final Evaluation Complete:</strong> This examination paper contained objective multiple-choice questions only. All responses have been evaluated and finalized.
                  </Alert>
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
