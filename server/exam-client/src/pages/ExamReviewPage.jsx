import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useExamReview } from '../features/exams/hooks/useExamReview';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTTS } from '../hooks/useTTS';
import {
  Award,
  ArrowLeft,
  MessageSquare,
  Filter,
  Grid,
} from 'lucide-react';

export const ExamReviewPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText } = useTTS();
  const { data: reviewData, isLoading, isError, error, refetch } = useExamReview(scheduleId);
  const [filter, setFilter] = useState('ALL'); // ALL, CORRECT, INCORRECT, UNANSWERED, DESCRIPTIVE
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  useDocumentTitle('Exam Paper Review');
  const pageHeadingRef = useFocusOnMount();

  const studentName = userProfile?.name || userProfile?.full_name || 'Candidate';
  const rollNumber = userProfile?.roll_number || '';

  if (isLoading) {
    return (
      <ExamLayout paperTitle="Loading Review..." sectionTitle="Paper Review">
        <div className="max-w-4xl mx-auto space-y-4 p-4">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={180} />
          <Skeleton variant="rectangular" height={180} />
        </div>
      </ExamLayout>
    );
  }

  if (isError || !reviewData) {
    return (
      <ExamLayout paperTitle="Review Unavailable" sectionTitle="Paper Review">
        <div className="max-w-2xl mx-auto my-8 p-4">
          <ErrorState
            title="Unable to Load Exam Review"
            message={
              error?.response?.data?.message ||
              error?.message ||
              'Exam review is unavailable or results have not been published by the administration yet.'
            }
            actionLabel="Back to Dashboard"
            onAction={() => navigate('/dashboard')}
            onRetry={() => refetch()}
          />
        </div>
      </ExamLayout>
    );
  }

  const {
    subject_name,
    subject_code,
    department_name,
    total_marks,
    obtained_marks,
    percentage,
    grade,
    published_at,
    questions = [],
  } = reviewData;

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'CORRECT') return q.status === 'CORRECT';
    if (filter === 'INCORRECT') return q.status === 'INCORRECT';
    if (filter === 'UNANSWERED') return q.status === 'UNANSWERED';
    if (filter === 'DESCRIPTIVE') return q.question_type === 'DESCRIPTIVE' || String(q.question_type) === 'DESCRIPTIVE';
    return true;
  });

  const correctCount = questions.filter((q) => q.status === 'CORRECT').length;
  const incorrectCount = questions.filter((q) => q.status === 'INCORRECT').length;
  const unansweredCount = questions.filter((q) => q.status === 'UNANSWERED').length;
  const descriptiveCount = questions.filter(
    (q) => q.question_type === 'DESCRIPTIVE' || String(q.question_type) === 'DESCRIPTIVE'
  ).length;

  const speakReviewQuestion = useCallback(
    (q, idx, total) => {
      if (!q) return;
      const isMcq = q.question_type === 'MCQ' || String(q.question_type) === 'MCQ';
      let answerDetail = '';
      if (isMcq && q.options) {
        const userOpt = q.options.find((o) => o.is_selected);
        const correctOpt = q.options.find((o) => o.is_correct);
        answerDetail = `Your answer was ${userOpt ? userOpt.option_text : 'Not Answered'}. ${
          q.status === 'CORRECT'
            ? 'Correct.'
            : `Correct answer is: ${correctOpt ? correctOpt.option_text : 'N/A'}.`
        }`;
      } else {
        answerDetail = `Your submitted answer: ${
          q.saved_answer_text || 'No response'
        }. Evaluator feedback: ${q.evaluator_feedback || 'No comments provided'}.`;
      }
      const text = `Question ${idx + 1} of ${total}. Status: ${q.status}. Score: ${
        q.obtained_marks
      } out of ${q.marks} marks. ${q.question_text}. ${answerDetail}`;
      speakText(text, `Question ${idx + 1} Review`);
    },
    [speakText]
  );

  const scrollToQuestion = useCallback(
    (questionId, index) => {
      setActiveReviewIdx(index);
      const el = document.getElementById(`review-question-${questionId || index}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.focus?.();
      }
      if (filteredQuestions[index]) {
        speakReviewQuestion(filteredQuestions[index], index, filteredQuestions.length);
      }
    },
    [filteredQuestions, speakReviewQuestion]
  );

  const handleNextReviewQ = useCallback(() => {
    if (filteredQuestions.length === 0) return;
    const nextIdx = Math.min(filteredQuestions.length - 1, activeReviewIdx + 1);
    scrollToQuestion(filteredQuestions[nextIdx]?.question_id, nextIdx);
  }, [filteredQuestions, activeReviewIdx, scrollToQuestion]);

  const handlePrevReviewQ = useCallback(() => {
    if (filteredQuestions.length === 0) return;
    const prevIdx = Math.max(0, activeReviewIdx - 1);
    scrollToQuestion(filteredQuestions[prevIdx]?.question_id, prevIdx);
  }, [filteredQuestions, activeReviewIdx, scrollToQuestion]);

  const handleCycleFilter = useCallback(() => {
    const filters = ['ALL', 'CORRECT', 'INCORRECT', 'UNANSWERED', 'DESCRIPTIVE'];
    const currIdx = filters.indexOf(filter);
    const nextFilter = filters[(currIdx + 1) % filters.length];
    setFilter(nextFilter);
    setActiveReviewIdx(0);
    const msg = `Filter changed to ${nextFilter}`;
    speakText(msg, 'Filter Changed');
  }, [filter, speakText]);

  // Register Shortcuts for Paper Review
  useEffect(() => {
    registerHandler('nextQuestion', handleNextReviewQ);
    registerHandler('prevQuestion', handlePrevReviewQ);
    registerHandler('ttsReadQuestion', () => {
      if (filteredQuestions[activeReviewIdx]) {
        speakReviewQuestion(
          filteredQuestions[activeReviewIdx],
          activeReviewIdx,
          filteredQuestions.length
        );
      }
    });
    registerHandler('clearResponse', handleCycleFilter);
    registerHandler('navDashboard', () => navigate('/dashboard'));
    registerHandler('logout', () => {
      logout();
      navigate('/login', { replace: true });
    });

    return () => {
      unregisterHandler('nextQuestion');
      unregisterHandler('prevQuestion');
      unregisterHandler('ttsReadQuestion');
      unregisterHandler('clearResponse');
      unregisterHandler('navDashboard');
      unregisterHandler('logout');
    };
  }, [
    registerHandler,
    unregisterHandler,
    handleNextReviewQ,
    handlePrevReviewQ,
    handleCycleFilter,
    filteredQuestions,
    activeReviewIdx,
    speakReviewQuestion,
    navigate,
    logout,
  ]);

  // Global Key Listener for Zero-Tab Review Navigation
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

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || key === 'J' || key === 'N') {
        e.preventDefault();
        handleNextReviewQ();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || key === 'K' || key === 'P') {
        e.preventDefault();
        handlePrevReviewQ();
      } else if (key === 'F') {
        e.preventDefault();
        handleCycleFilter();
      } else if (key === 'R') {
        e.preventDefault();
        if (filteredQuestions[activeReviewIdx]) {
          speakReviewQuestion(
            filteredQuestions[activeReviewIdx],
            activeReviewIdx,
            filteredQuestions.length
          );
        }
      } else if (e.key === 'Escape' || key === 'D') {
        e.preventDefault();
        navigate('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextReviewQ,
    handlePrevReviewQ,
    handleCycleFilter,
    filteredQuestions,
    activeReviewIdx,
    speakReviewQuestion,
    navigate,
  ]);

  // Auditory Welcome on Mount
  useEffect(() => {
    if (!isLoading && !isError && reviewData) {
      const prompt = `Paper review for ${reviewData.subject_name}. Score: ${reviewData.obtained_marks} of ${reviewData.total_marks}. Press N and P to step through questions.`;
      const timer = setTimeout(() => {
        speakText(prompt, 'Paper Review Orientation');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isError, reviewData, speakText]);
  const sidebarContent = (
    <div className="space-y-5">
      {/* Return to Dashboard Button placed at the VERY TOP for instant access */}
      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={() => navigate('/dashboard')}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>

      {/* Score Summary Box */}
      <div className="p-4 rounded-xl bg-subtle/40 border border-border-main space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-navy-primary flex items-center gap-1.5">
            <Award className="w-4 h-4" aria-hidden="true" />
            Result Summary
          </span>
          {grade && (
            <Badge variant="purple" size="sm">
              Grade {grade}
            </Badge>
          )}
        </div>

        <div>
          <span className="text-xs text-text-muted block font-medium">Score Achieved</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold font-mono text-text-main">
              {obtained_marks}
            </span>
            <span className="text-sm font-mono text-text-muted">/ {total_marks} Marks</span>
            <span className="ml-auto text-xs font-bold text-navy-primary font-mono">
              ({percentage?.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Breakdown Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <span className="text-text-muted block text-[11px] font-medium">Correct</span>
            <span className="text-base font-extrabold font-mono text-green-600 dark:text-green-400">
              {correctCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <span className="text-text-muted block text-[11px] font-medium">Incorrect</span>
            <span className="text-base font-extrabold font-mono text-red-600 dark:text-red-400">
              {incorrectCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-text-muted block text-[11px] font-medium">Unanswered</span>
            <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {unansweredCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-text-muted block text-[11px] font-medium">Descriptive</span>
            <span className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
              {descriptiveCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Questions */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          Filter Questions
        </span>
        <div className="flex flex-col gap-1.5" role="toolbar" aria-label="Question filter tools">
          {[
            { key: 'ALL', label: `All Questions (${questions.length})` },
            { key: 'CORRECT', label: `Correct (${correctCount})` },
            { key: 'INCORRECT', label: `Incorrect (${incorrectCount})` },
            { key: 'UNANSWERED', label: `Unanswered (${unansweredCount})` },
            { key: 'DESCRIPTIVE', label: `Descriptive (${descriptiveCount})` },
          ].map((item) => (
            <Button
              key={item.key}
              variant={filter === item.key ? 'primary' : 'outline'}
              size="sm"
              fullWidth
              className="justify-start text-xs font-medium"
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Question Jump Palette */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Grid className="w-3.5 h-3.5" aria-hidden="true" />
          Question Jump
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const isCorrect = q.status === 'CORRECT';
            const isIncorrect = q.status === 'INCORRECT';
            const isUnanswered = q.status === 'UNANSWERED';

            let btnStyle = 'border-border-main bg-subtle text-text-main';
            if (isCorrect) {
              btnStyle = 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 font-bold';
            } else if (isIncorrect) {
              btnStyle = 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 font-bold';
            } else if (isUnanswered) {
              btnStyle = 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold';
            } else {
              btnStyle = 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold';
            }

            return (
              <button
                key={q.question_id || idx}
                type="button"
                onClick={() => scrollToQuestion(q.question_id, idx)}
                title={`Jump to Question ${idx + 1} (${q.status})`}
                className={`h-8 rounded-lg border text-xs font-mono transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary ${btnStyle}`}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <ExamLayout
      paperTitle={subject_code}
      sectionTitle="Paper Review"
      sidebarContent={sidebarContent}
    >
      <div className="max-w-4xl mx-auto space-y-8 select-none py-2">
        {/* Paper Review Header Banner (Frameless & Clean) */}
        <div className="pb-6 border-b border-border-main">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-navy-primary uppercase tracking-wider">
                {subject_code} • {department_name}
              </span>
              <h1
                ref={pageHeadingRef}
                tabIndex={-1}
                className="text-2xl font-extrabold text-text-main leading-snug mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary rounded"
              >
                {subject_name} — Paper Review
              </h1>
              <p className="text-xs text-text-muted mt-1.5 font-medium">
                Candidate: <strong className="text-text-main">{studentName}</strong> {rollNumber ? `(${rollNumber})` : ''} • Published: {formatDateTime(published_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="purple" size="md">
                Grade: {grade || 'P'} ({percentage?.toFixed(1)}%)
              </Badge>
              <Badge variant="success" size="md">
                Score: {obtained_marks} / {total_marks} Marks
              </Badge>
            </div>
          </div>
        </div>

        {/* Question Review Cards List (Clean frameless visual separation) */}
        <div className="space-y-6" role="region" aria-label="Question by question review list">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => {
              const isMcq = q.question_type === 'MCQ' || String(q.question_type) === 'MCQ';
              const isCorrect = q.status === 'CORRECT';
              const isIncorrect = q.status === 'INCORRECT';
              const isPartial = q.status === 'PARTIAL';

              const statusBadgeVariant = isCorrect
                ? 'success'
                : isIncorrect
                ? 'danger'
                : isPartial
                ? 'purple'
                : 'warning';

              return (
                <div
                  key={q.question_id || idx}
                  id={`review-question-${q.question_id || idx}`}
                  tabIndex={-1}
                  className="pb-6 border-b border-border-main last:border-b-0 space-y-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary rounded-lg p-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-navy-primary uppercase">
                        Question {idx + 1} • {isMcq ? 'Multiple Choice' : 'Descriptive Essay'}
                      </span>
                      <Badge variant={statusBadgeVariant} size="sm">
                        {q.status} ({q.obtained_marks} / {q.marks} Marks)
                      </Badge>
                    </div>

                    <span className="text-xs font-mono font-semibold text-text-muted">
                      Max Marks: {q.marks} {q.negative_marks > 0 ? `(-${q.negative_marks} Neg)` : ''}
                    </span>
                  </div>

                  {/* Question Stem */}
                  <div className="text-base font-medium text-text-main leading-relaxed">
                    {q.question_text}
                  </div>

                  {/* MCQ Options Breakdown */}
                  {isMcq && q.options && q.options.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isUserSelection = opt.is_selected;
                        const isCorrectOption = opt.is_correct;

                        let optionStyle = 'border-border-main bg-subtle/30 text-text-muted';
                        let badgeText = null;
                        let badgeVariant = 'neutral';

                        if (isUserSelection && isCorrectOption) {
                          optionStyle = 'border-green-500/40 bg-green-500/10 text-text-main font-medium';
                          badgeText = 'Your Answer (Correct)';
                          badgeVariant = 'success';
                        } else if (isUserSelection && !isCorrectOption) {
                          optionStyle = 'border-red-500/40 bg-red-500/10 text-text-main font-medium';
                          badgeText = 'Your Answer (Incorrect)';
                          badgeVariant = 'danger';
                        } else if (isCorrectOption) {
                          optionStyle = 'border-blue-500/40 bg-blue-500/10 text-text-main font-medium';
                          badgeText = 'Correct Answer';
                          badgeVariant = 'info';
                        }

                        return (
                          <div
                            key={opt.id || optIdx}
                            className={`p-3 border rounded-lg flex items-center justify-between gap-3 text-sm transition-colors ${optionStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-mono shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt.option_text}</span>
                            </div>

                            {badgeText && (
                              <Badge variant={badgeVariant} size="sm">
                                {badgeText}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Descriptive Answer & Evaluator Feedback Breakdown */}
                  {!isMcq && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 bg-subtle/40 border border-border-main rounded-lg space-y-1">
                        <span className="text-xs font-bold text-navy-primary block uppercase tracking-wider">
                          Candidate Submitted Answer:
                        </span>
                        <p className="text-sm text-text-main whitespace-pre-wrap font-mono leading-relaxed">
                          {q.saved_answer_text || (
                            <span className="italic text-text-muted font-sans">No response submitted for this question.</span>
                          )}
                        </p>
                      </div>

                      {q.evaluator_feedback && (
                        <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-text-main text-sm space-y-1">
                          <span className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                            Evaluator Feedback & Comments:
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed italic">{q.evaluator_feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-text-muted border border-border-main rounded-xl bg-surface">
              No questions found matching the selected filter ({filter}).
            </div>
          )}
        </div>
      </div>
    </ExamLayout>
  );
};

export default ExamReviewPage;
