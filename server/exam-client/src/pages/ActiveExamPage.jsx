import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { useExam } from '../hooks/useExam';
import { useExamQuestions } from '../features/exams/hooks/useExamQuestions';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';
import { examsApi } from '../features/exams/api/examsApi';
import {
  QuestionCard,
  QuestionPalette,
  NavigationControls,
  Timer,
  ExamStatusBar,
} from '../components/exam';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { SYNC_STATUS } from '../utils/constants';
import { announceToScreenReader } from '../utils/ariaAnnounce';
import { formatDuration } from '../utils/formatters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  enqueueOfflineAnswer,
  flushOfflineQueue,
  cacheLocalAnswers,
  restoreLocalAnswers,
  enqueueSubmission,
  flushSubmissionQueue,
  mergeAnswersWithConflictResolution,
} from '../utils/resilienceManager';

const MOCK_QUESTIONS = [
  {
    id: 'q-1',
    type: 'MCQ',
    section: 'SEC A: MCQs',
    marks: 3,
    negativeMarks: 1,
    stem: 'A train traveling at a constant speed of 72 km/h passes a stationary platform in 24 seconds. If the length of the train is 180 meters, what is the length of the platform in meters?',
    options: [
      { id: 'opt-1-a', prefix: 'A', text: '240 meters' },
      { id: 'opt-1-b', prefix: 'B', text: '300 meters' },
      { id: 'opt-1-c', prefix: 'C', text: '360 meters' },
      { id: 'opt-1-d', prefix: 'D', text: '400 meters' },
    ],
  },
  {
    id: 'q-2',
    type: 'DESCRIPTIVE',
    section: 'SEC B: Essay Questions',
    marks: 10,
    negativeMarks: 0,
    maxWords: 500,
    maxLength: 2500,
    stem: "Explain Dijkstra's shortest path algorithm for a weighted directed graph with non-negative edge weights. Include its algorithmic steps, time complexity analysis with a min-priority queue, and pseudocode.",
  },
  {
    id: 'q-3',
    type: 'MCQ',
    section: 'SEC A: MCQs',
    marks: 2,
    negativeMarks: 0.5,
    stem: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) containing N nodes?',
    options: [
      { id: 'opt-2-a', prefix: 'A', text: 'O(1)' },
      { id: 'opt-2-b', prefix: 'B', text: 'O(log N)' },
      { id: 'opt-2-c', prefix: 'C', text: 'O(N)' },
      { id: 'opt-2-d', prefix: 'D', text: 'O(N log N)' },
    ],
  },
  {
    id: 'q-4',
    type: 'DESCRIPTIVE',
    section: 'SEC B: Essay Questions',
    marks: 15,
    negativeMarks: 0,
    maxWords: 1000,
    maxLength: 5000,
    stem: 'Formulate the 0/1 Knapsack Problem using Dynamic Programming. Write down the recurrence relation, state representation matrix, space-optimized 1D array approach, and trace a numerical example with 4 items.',
  },
  {
    id: 'q-5',
    type: 'MCQ',
    section: 'SEC A: MCQs',
    marks: 4,
    negativeMarks: 1,
    stem: 'Which of the following greedy algorithm design paradigms guarantees finding a Minimum Spanning Tree (MST) in a connected, undirected weighted graph?',
    options: [
      { id: 'opt-4-a', prefix: 'A', text: "Kruskal's Algorithm" },
      { id: 'opt-4-b', prefix: 'B', text: "Bellman-Ford Algorithm" },
      { id: 'opt-4-c', prefix: 'C', text: "Floyd-Warshall Algorithm" },
      { id: 'opt-4-d', prefix: 'D', text: 'Depth-First Search (DFS)' },
    ],
  },
];

export const ActiveExamPage = () => {
  const { scheduleId = 'cs-401' } = useParams();
  const navigate = useNavigate();
  const { endTime, elevatedToken } = useExam();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText, togglePauseResume, stopSpeech, repeatSpeech } = useTTS();
  const { toggleDictation } = useSTT();

  useDocumentTitle('Active Examination');

  const { data: apiQuestionsData, isLoading, isError, error, refetch } = useExamQuestions(scheduleId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [flaggedSet, setFlaggedSet] = useState(new Set());
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.SAVED);
  const [isConnected, setIsConnected] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmittingPaper, setIsSubmittingPaper] = useState(false);

  const debounceTimerRef = useRef(null);

  // Process live backend questions or fallback to mock questions
  const questions = useMemo(() => {
    if (apiQuestionsData?.questions && apiQuestionsData.questions.length > 0) {
      return apiQuestionsData.questions.map((q, idx) => ({
        id: q.id,
        type: q.question_type || 'MCQ',
        section: (q.question_type || 'MCQ') === 'MCQ' ? 'SEC A: MCQs' : 'SEC B: Essay Questions',
        marks: q.marks || 1,
        negativeMarks: q.negative_marks || 0,
        maxWords: q.max_characters ? Math.floor(q.max_characters / 5) : 500,
        maxLength: q.max_characters || 2500,
        stem: q.question_text,
        options: (q.options || []).map((opt, optIdx) => ({
          id: opt.id,
          prefix: String.fromCharCode(65 + optIdx),
          text: opt.option_text,
        })),
        savedAnswerOptionId: q.saved_answer_option_id,
        savedAnswerText: q.saved_answer_text,
      }));
    }
    return MOCK_QUESTIONS;
  }, [apiQuestionsData]);

  // Restore unsaved responses & merge with server state on initial load (Session Recovery)
  useEffect(() => {
    const cachedLocal = restoreLocalAnswers(scheduleId);
    if (apiQuestionsData?.questions) {
      const mergedMap = mergeAnswersWithConflictResolution(apiQuestionsData.questions, cachedLocal);
      setAnswersMap(mergedMap);
    } else if (Object.keys(cachedLocal).length > 0) {
      setAnswersMap(cachedLocal);
    }
  }, [apiQuestionsData, scheduleId]);

  // Cache answers locally whenever answersMap changes
  useEffect(() => {
    if (Object.keys(answersMap).length > 0) {
      cacheLocalAnswers(scheduleId, answersMap);
    }
  }, [answersMap, scheduleId]);

  // Network Online/Offline Recovery Listener
  useEffect(() => {
    const handleOnline = async () => {
      setIsConnected(true);
      setSyncStatus(SYNC_STATUS.RECOVERY);
      announceToScreenReader('Network connection restored. Syncing offline answers to server...', 'assertive');
      try {
        await flushOfflineQueue(elevatedToken);
        await flushSubmissionQueue(elevatedToken);
        setSyncStatus(SYNC_STATUS.SAVED);
      } catch (err) {
        setSyncStatus(SYNC_STATUS.LOCAL);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setSyncStatus(SYNC_STATUS.OFFLINE);
      announceToScreenReader('Network connection lost. Switched to offline resilience mode. Your answers are safe locally.', 'assertive');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [elevatedToken]);

  // Initialize server-authoritative countdown duration from server endTime
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (endTime) {
      const remainingMs = new Date(endTime).getTime() - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    }
    return 8140; // Baseline 2h 15m 40s
  });

  const currentQuestion = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const currentAnswer = answersMap[currentIndex] || '';
  const isCurrentFlagged = flaggedSet.has(currentIndex);

  // Track visited questions and announce full question & options readout for blind candidates
  useEffect(() => {
    setVisitedSet((prev) => {
      if (!prev.has(currentIndex)) {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      }
      return prev;
    });

    announceToScreenReader(`Question ${currentIndex + 1} of ${totalQuestions}. ${currentQuestion?.section || ''}`);

    let speechText = `Question ${currentIndex + 1} of ${totalQuestions}. ${currentQuestion?.section || ''}. Marks: ${currentQuestion?.marks || 1}. Stem: ${currentQuestion?.stem || ''}`;
    
    if (currentQuestion?.type === 'MCQ' && currentQuestion?.options?.length > 0) {
      const optsText = currentQuestion.options
        .map((opt) => `Option ${opt.prefix}: ${opt.text || opt.option_text}`)
        .join('. ');
      speechText += `. Options: ${optsText}`;
    } else if (currentQuestion?.type === 'DESCRIPTIVE') {
      const ansText = answersMap[currentIndex] || '';
      speechText += `. Descriptive question. ${ansText ? `Your current saved answer: ${ansText}` : 'No answer entered yet.'}`;
    }

    speakText(speechText, `Question ${currentIndex + 1}`);
  }, [currentIndex, totalQuestions, currentQuestion]);

  // Server-authoritative timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === 300) {
          announceToScreenReader('Attention candidate: 5 minutes remaining in examination session.', 'assertive');
        }
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduleId, navigate, elevatedToken]);

  // Debounced & Resilient answer saving to server or offline queue
  const persistAnswerToBackend = useCallback(
    async (questionId, optionId, textValue) => {
      setSyncStatus(SYNC_STATUS.SAVING);

      if (!navigator.onLine) {
        enqueueOfflineAnswer(scheduleId, questionId, optionId, textValue);
        setSyncStatus(SYNC_STATUS.LOCAL);
        return;
      }

      try {
        if (elevatedToken && questionId) {
          await examsApi.saveAnswer(questionId, optionId, textValue, elevatedToken);
        }
        setSyncStatus(SYNC_STATUS.SAVED);
      } catch (err) {
        console.warn('Network save error, fallback to offline queue:', err);
        enqueueOfflineAnswer(scheduleId, questionId, optionId, textValue);
        setSyncStatus(SYNC_STATUS.LOCAL);
      }
    },
    [scheduleId, elevatedToken]
  );

  const handleSelectOption = (optionId) => {
    setAnswersMap((prev) => {
      const updated = { ...prev, [currentIndex]: optionId };
      cacheLocalAnswers(scheduleId, updated);
      return updated;
    });

    if (currentQuestion?.id) {
      persistAnswerToBackend(currentQuestion.id, optionId, null);
    }
  };

  const handleTextChange = (text) => {
    setAnswersMap((prev) => {
      const updated = { ...prev, [currentIndex]: text };
      cacheLocalAnswers(scheduleId, updated);
      return updated;
    });

    setSyncStatus(SYNC_STATUS.SAVING);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (currentQuestion?.id) {
        persistAnswerToBackend(currentQuestion.id, null, text);
      }
    }, 500);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleClearResponse = () => {
    setAnswersMap((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      cacheLocalAnswers(scheduleId, next);
      return next;
    });
    if (currentQuestion?.id) {
      persistAnswerToBackend(currentQuestion.id, null, null);
    }
    announceToScreenReader(`Cleared response for question ${currentIndex + 1}`);
    speakText(`Response cleared for Question ${currentIndex + 1}`, 'Response Cleared');
  };

  const handleToggleReview = () => {
    setFlaggedSet((prev) => {
      const next = new Set(prev);
      const isMarking = !next.has(currentIndex);
      if (isMarking) {
        next.add(currentIndex);
        announceToScreenReader(`Question ${currentIndex + 1} marked for review`);
        speakText(`Question ${currentIndex + 1} marked for review`, 'Review Marked');
      } else {
        next.delete(currentIndex);
        announceToScreenReader(`Question ${currentIndex + 1} review mark removed`);
        speakText(`Question ${currentIndex + 1} review mark removed`, 'Review Unmarked');
      }
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleManualSave = () => {
    if (currentQuestion?.id) {
      const val = answersMap[currentIndex];
      const optId = currentQuestion.type === 'MCQ' ? val : null;
      const textVal = currentQuestion.type === 'DESCRIPTIVE' ? val : null;
      persistAnswerToBackend(currentQuestion.id, optId, textVal);
      announceToScreenReader(`Response for question ${currentIndex + 1} manually saved`);
      speakText(`Response for Question ${currentIndex + 1} manually saved to server`, 'Response Saved');
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmittingPaper(true);
    announceToScreenReader('Submitting examination paper to server...', 'assertive');
    speakText('Submitting examination paper to server...', 'Submitting Exam');

    try {
      if (navigator.onLine && elevatedToken && scheduleId) {
        await examsApi.submitExam(scheduleId, elevatedToken, false);
      } else {
        enqueueSubmission(scheduleId, false);
      }
    } catch (err) {
      console.warn('Submit API network error, enqueued for recovery:', err);
      enqueueSubmission(scheduleId, false);
    } finally {
      setIsSubmittingPaper(false);
      setIsSubmitModalOpen(false);
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
  };

  const handleAutoSubmit = async () => {
    announceToScreenReader('Examination time expired. Submitting answers automatically...', 'assertive');
    speakText('Examination time expired. Submitting answers automatically...', 'Auto Submitting Exam');

    try {
      if (navigator.onLine && elevatedToken && scheduleId) {
        await examsApi.submitExam(scheduleId, elevatedToken, true);
      } else {
        enqueueSubmission(scheduleId, true);
      }
    } catch (err) {
      console.warn('Auto-submit API network error, enqueued for recovery:', err);
      enqueueSubmission(scheduleId, true);
    } finally {
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
  };

  // Register Global Keyboard Shortcuts & Web Speech API TTS/STT Handlers
  useEffect(() => {
    registerHandler('nextQuestion', handleSaveAndNext);
    registerHandler('prevQuestion', handlePrevious);
    registerHandler('markReview', handleToggleReview);
    registerHandler('clearResponse', handleClearResponse);
    registerHandler('saveResponse', handleManualSave);
    registerHandler('submitExam', () => {
      setIsSubmitModalOpen(true);
      announceToScreenReader('Opened final submission confirmation dialog', 'assertive');
      speakText('Opened final submission confirmation dialog', 'Submit Dialog Opened');
    });

    registerHandler('focusPalette', () => {
      const grid = document.getElementById('palette-grid-container');
      if (grid) {
        const firstTile = grid.querySelector('button');
        if (firstTile) firstTile.focus();
      }
      announceToScreenReader(`Question palette focused. ${totalQuestions} questions available.`);
      speakText(`Question palette focused. ${totalQuestions} questions available. Use arrow keys to navigate.`, 'Palette Focused');
    });

    registerHandler('focusTimer', () => {
      const timerElem = document.getElementById('timer-display');
      if (timerElem) timerElem.focus();
      announceToScreenReader(`Remaining examination time: ${formatDuration(secondsRemaining)}`);
      speakText(`Remaining examination time: ${formatDuration(secondsRemaining)}`, 'Remaining Time');
    });

    // STT Dictation Shortcut (Alt+D) - Enabled ONLY for Descriptive Questions
    registerHandler('sttToggle', () => {
      if (currentQuestion?.type === 'DESCRIPTIVE') {
        toggleDictation(({ final }) => {
          if (final) {
            handleTextChange((answersMap[currentIndex] || '') + ' ' + final);
          }
        });
      } else {
        announceToScreenReader('Speech to Text dictation is only available for descriptive essay questions.');
        speakText('Speech to Text dictation is only available for descriptive essay questions.', 'STT Notice');
      }
    });

    // TTS Web Speech API Handlers
    registerHandler('ttsReadQuestion', () => {
      if (currentQuestion?.stem) {
        speakText(`Question ${currentIndex + 1}: ${currentQuestion.stem}`, 'Current Question Stem');
      }
    });

    registerHandler('ttsReadOptions', () => {
      if (currentQuestion?.type === 'MCQ' && currentQuestion?.options?.length > 0) {
        const optionsText = currentQuestion.options
          .map((opt) => `Option ${opt.prefix}: ${opt.text || opt.option_text}`)
          .join('. ');
        speakText(`Question ${currentIndex + 1} options: ${optionsText}`, 'All Options');
      } else {
        speakText(`Question ${currentIndex + 1} is a descriptive essay question. Shortcuts: Alt+R reads question stem, Alt+V reads your typed response.`, 'Descriptive Question Notice');
      }
    });

    registerHandler('ttsReadSelected', () => {
      const val = answersMap[currentIndex];
      if (currentQuestion?.type === 'MCQ') {
        const selected = currentQuestion?.options?.find((opt) => String(opt.id) === String(val));
        if (selected) {
          speakText(`Selected answer for Question ${currentIndex + 1} is Option ${selected.prefix}: ${selected.text || selected.option_text}`, 'Selected Option');
        } else {
          speakText(`No option currently selected for Question ${currentIndex + 1}.`, 'No Selection');
        }
      } else {
        if (val && val.trim()) {
          const wordCount = val.trim().split(/\s+/).length;
          speakText(`Your descriptive answer for Question ${currentIndex + 1} is: ${val}. Word count: ${wordCount} words.`, 'Descriptive Response');
        } else {
          speakText(`No descriptive answer typed yet for Question ${currentIndex + 1}.`, 'No Answer');
        }
      }
    });

    registerHandler('ttsPauseResume', togglePauseResume);
    registerHandler('ttsStop', stopSpeech);
    registerHandler('ttsRepeat', repeatSpeech);

    // Register Alt+1 through Alt+9 question jumps
    for (let i = 1; i <= 9; i++) {
      registerHandler(`jumpQuestion${i}`, () => {
        const targetIndex = i - 1;
        if (targetIndex < totalQuestions) {
          setCurrentIndex(targetIndex);
          announceToScreenReader(`Jumped to Question ${i}`);
        }
      });
    }

    return () => {
      unregisterHandler('nextQuestion');
      unregisterHandler('prevQuestion');
      unregisterHandler('markReview');
      unregisterHandler('clearResponse');
      unregisterHandler('saveResponse');
      unregisterHandler('submitExam');
      unregisterHandler('focusPalette');
      unregisterHandler('focusTimer');

      unregisterHandler('sttToggle');

      unregisterHandler('ttsReadQuestion');
      unregisterHandler('ttsReadOptions');
      unregisterHandler('ttsReadSelected');
      unregisterHandler('ttsPauseResume');
      unregisterHandler('ttsStop');
      unregisterHandler('ttsRepeat');

      for (let i = 1; i <= 9; i++) {
        unregisterHandler(`jumpQuestion${i}`);
      }
    };
  }, [
    registerHandler,
    unregisterHandler,
    handleSaveAndNext,
    handlePrevious,
    handleToggleReview,
    handleClearResponse,
    handleManualSave,
    speakText,
    togglePauseResume,
    stopSpeech,
    repeatSpeech,
    toggleDictation,
    currentQuestion,
    currentIndex,
    answersMap,
    totalQuestions,
    secondsRemaining,
  ]);

  if (isLoading) {
    return (
      <ExamLayout paperTitle="CS-401" sectionTitle="Loading Questions..." hideFooter={true}>
        <div className="space-y-6 max-w-2xl mx-auto my-4">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={220} />
        </div>
      </ExamLayout>
    );
  }

  if (isError) {
    return (
      <ExamLayout paperTitle="CS-401" sectionTitle="Error Loading Paper" hideFooter={true}>
        <div className="max-w-[600px] mx-auto my-6">
          <ErrorState
            title="Failed to Load Exam Questions"
            message={error?.message || 'Could not fetch sanitized questions from backend server.'}
            onRetry={() => refetch()}
          />
        </div>
      </ExamLayout>
    );
  }

  // Compute statistics for submission summary modal
  const answeredCount = Object.keys(answersMap).filter((key) => Boolean(answersMap[key])).length;
  const reviewCount = flaggedSet.size;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <ExamLayout
      paperTitle="CS-401"
      sectionTitle={currentQuestion.section}
      timerSlot={<Timer secondsRemaining={secondsRemaining} />}
      hideFooter={true}
      sidebarContent={
        <QuestionPalette
          totalQuestions={totalQuestions}
          currentIndex={currentIndex}
          answersMap={answersMap}
          flaggedSet={flaggedSet}
          visitedSet={visitedSet}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          onSubmitExam={() => setIsSubmitModalOpen(true)}
          isSubmitting={isSubmittingPaper}
        />
      }
    >
      <div className="flex flex-col justify-between h-full space-y-6">
        {/* Question Card Display Area */}
        <div className="flex-1">
          <QuestionCard
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            sectionTitle={currentQuestion.section}
            questionId={currentQuestion.id}
            marks={currentQuestion.marks}
            negativeMarks={currentQuestion.negativeMarks}
            maxWords={currentQuestion.maxWords}
            maxLength={currentQuestion.maxLength}
            isMarkedForReview={isCurrentFlagged}
            questionType={currentQuestion.type}
            questionText={currentQuestion.stem}
            options={currentQuestion.options}
            selectedOptionId={currentQuestion.type === 'MCQ' ? currentAnswer : ''}
            onSelectOption={handleSelectOption}
            answerText={currentQuestion.type === 'DESCRIPTIVE' ? currentAnswer : ''}
            onChangeAnswerText={handleTextChange}
          />
        </div>

        {/* Action Bar Navigation Controls */}
        <NavigationControls
          onPrevious={handlePrevious}
          hasPrevious={currentIndex > 0}
          onClearResponse={handleClearResponse}
          onToggleMarkReview={handleToggleReview}
          isMarkedForReview={isCurrentFlagged}
          onSaveNext={handleSaveAndNext}
          hasNext={currentIndex < totalQuestions - 1}
        />

        {/* Telemetry Status Bar */}
        <ExamStatusBar syncStatus={syncStatus} isConnected={isConnected} />
      </div>

      {/* Screen 7: Submit Confirmation Modal Dialog */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="CONFIRM FINAL SUBMISSION"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="md" onClick={() => setIsSubmitModalOpen(false)}>
              Return to Exam
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmittingPaper}
              onClick={handleConfirmSubmit}
            >
              FINAL SUBMIT
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs select-none">
          {/* Answer Summary Table */}
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">
            SUMMARY OF ANSWERS:
          </h3>
          <div className="p-3 border border-border-main bg-subtle/50 rounded-md space-y-2.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-semibold">Total Questions:</span>
              <span className="font-bold text-text-main">{totalQuestions}</span>
            </div>
            <hr className="border-border-main" />
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-bold">✓ Answered:</span>
              <span className="font-bold text-green-700">{answeredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-700 font-bold">! Unanswered:</span>
              <span className="font-bold text-amber-700">{unansweredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-700 font-bold">* Marked for Review:</span>
              <span className="font-bold text-purple-700">{reviewCount}</span>
            </div>
          </div>

          {/* Irreversible Action Warning */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-md font-medium">
            <span className="text-base leading-none mt-0.5" aria-hidden="true">⚠</span>
            <span>Once submitted, answers cannot be edited or re-submitted. Ensure all responses are final before proceeding.</span>
          </div>
        </div>
      </Modal>
    </ExamLayout>
  );
};

export default ActiveExamPage;
