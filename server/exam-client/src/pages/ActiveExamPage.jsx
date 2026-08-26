import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExamLayout } from '../layouts/ExamLayout';
import { useExam } from '../hooks/useExam';
import { useAuthoritativeTimer } from '../hooks/useAuthoritativeTimer';
import { useExamQuestions } from '../features/exams/hooks/useExamQuestions';
import { useExamSession } from '../features/exams/hooks/useExamSession';
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
import { SYNC_STATUS, SESSION_SYNC_INTERVAL_MS, EXAM_SESSION_STATUS, STORAGE_KEYS } from '../utils/constants';
import { formatDuration } from '../utils/formatters';
import { getItem } from '../utils/storage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  enqueueOfflineAnswer,
  flushOfflineQueue,
  cacheLocalAnswers,
  cacheWorkbenchState,
  restoreWorkbenchState,
  enqueueSubmission,
  flushSubmissionQueue,
  mergeAnswersWithConflictResolution,
} from '../utils/resilienceManager';

export const ActiveExamPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, elevatedToken, syncExamSession } = useExam();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { speakText, togglePauseResume, stopSpeech, repeatSpeech } = useTTS();
  const { toggleDictation } = useSTT();

  useDocumentTitle('Active Examination');

  const { data: apiQuestionsData, isLoading, isError, error, refetch } = useExamQuestions(scheduleId);

  // Periodic server synchronization of the authoritative session + clock offset
  const { data: sessionSnapshot, refetch: refetchSession } = useExamSession(scheduleId, {
    refetchInterval: SESSION_SYNC_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [flaggedSet, setFlaggedSet] = useState(new Set());
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.SAVED);
  const [isConnected, setIsConnected] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmittingPaper, setIsSubmittingPaper] = useState(false);

  const debounceTimerRef = useRef(null);
  const autoSubmitRef = useRef(null);
  const questionHeadingRef = useRef(null);
  const lastAnnouncedQuestionRef = useRef(null);

  // True when the server has frozen the individual timer because the candidate
  // left the exam (page closed/hidden or inactivity fallback). While paused,
  // examination time is not counted and answering is disabled until resume.
  const isPaused =
    sessionSnapshot?.status === EXAM_SESSION_STATUS.IN_PROGRESS &&
    Boolean(sessionSnapshot?.paused_at) &&
    !location.state?.isResumed;

  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const { secondsRemaining, hasExpired } = useAuthoritativeTimer({
    expiresAt: session?.expiresAt || null,
    clockOffsetMs: session?.clockOffsetMs || 0,
    enabled: Boolean(session?.expiresAt) && !isPaused,
    onExpire: () => {
      if (autoSubmitRef.current) autoSubmitRef.current();
    },
  });

  // Fire-and-forget pause signal: freezes the server-side individual timer so
  // examination time is only counted while the candidate is actively present.
  // Reads the token from storage to avoid stale closures in unload handlers.
  const sendPauseSignal = useCallback(() => {
    const storedToken = getItem(STORAGE_KEYS.BASE_TOKEN, sessionStorage);
    if (storedToken && scheduleId) {
      examsApi.pauseExam(scheduleId, storedToken);
    }
  }, [scheduleId]);

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
    return [];
  }, [apiQuestionsData]);

  // Restore answers, review flags and visited set immediately from the local
  // resilience cache so nothing is lost on refresh/restart (Session Recovery)
  useEffect(() => {
    const cached = restoreWorkbenchState(scheduleId);
    setAnswersMap((prev) => ({ ...cached.answersMap, ...prev }));
    if (cached.flaggedSet.size > 0) {
      setFlaggedSet(cached.flaggedSet);
    }
    if (cached.visitedSet.size > 0) {
      setVisitedSet(cached.visitedSet);
    }
  }, [scheduleId]);

  // Once server questions arrive: merge server-saved answers into gaps and
  // restore the current question index, clamped to the real question count
  const hasRestoredIndexRef = useRef(false);
  useEffect(() => {
    if (!apiQuestionsData?.questions || hasRestoredIndexRef.current) return;
    hasRestoredIndexRef.current = true;
    const cached = restoreWorkbenchState(scheduleId);
    const mergedMap = mergeAnswersWithConflictResolution(apiQuestionsData.questions, cached.answersMap);
    setAnswersMap((prev) => ({ ...mergedMap, ...prev }));
    const totalQuestions = apiQuestionsData.questions.length;
    const restoredIndex = Math.min(cached.currentIndex, totalQuestions - 1);
    if (restoredIndex > 0) {
      setCurrentIndex(restoredIndex);
      setVisitedSet((prev) => new Set(prev).add(restoredIndex));
    }
  }, [apiQuestionsData, scheduleId]);

  // Cache the complete workbench state whenever it changes so a refresh,
  // browser restart or power failure loses nothing (Session Recovery).
  // Skip the first run: the restore effects land one commit later, and we
  // must not overwrite the cached state with the empty initial state.
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }
    cacheWorkbenchState(scheduleId, { answersMap, currentIndex, flaggedSet, visitedSet });
  }, [answersMap, currentIndex, flaggedSet, visitedSet, scheduleId]);

  // Final synchronous flush on page unload (browser refresh/restart/power loss)
  // plus a best-effort pause signal so the server freezes the individual timer.
  // If this request never arrives (e.g. hard power loss), the server-side
  // inactivity sweeper pauses the session as a fallback.
  useEffect(() => {
    const flushWorkbench = () => {
      cacheWorkbenchState(scheduleId, { answersMap, currentIndex, flaggedSet, visitedSet });
      sendPauseSignal();
    };
    window.addEventListener('beforeunload', flushWorkbench);
    window.addEventListener('pagehide', flushWorkbench);
    return () => {
      window.removeEventListener('beforeunload', flushWorkbench);
      window.removeEventListener('pagehide', flushWorkbench);
    };
  }, [answersMap, currentIndex, flaggedSet, visitedSet, scheduleId, sendPauseSignal]);

  // Pause the instant the tab/window is hidden (alt-tab, window switch, screen
  // lock): the server freezes the timer and the candidate resumes where they
  // left off. While hidden, the periodic session poll is suspended by the
  // query client, so the inactivity sweeper would otherwise pause after the
  // configured timeout — this makes the pause immediate instead.
  useEffect(() => {
    const handleVisibilityHidden = () => {
      if (document.visibilityState === 'hidden') {
        sendPauseSignal();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityHidden);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityHidden);
    };
  }, [sendPauseSignal]);

  // Network Online/Offline Recovery Listener
  useEffect(() => {
    const handleOnline = async () => {
      setIsConnected(true);
      setSyncStatus(SYNC_STATUS.RECOVERY);
      speakText('Network connection restored. Syncing answers to server.', 'Online');
      try {
        await flushOfflineQueue(elevatedToken);
        await flushSubmissionQueue(elevatedToken);
        // Re-synchronize the authoritative session timer on reconnect
        await refetchSession();
        setSyncStatus(SYNC_STATUS.SAVED);
      } catch (err) {
        setSyncStatus(SYNC_STATUS.LOCAL);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setSyncStatus(SYNC_STATUS.OFFLINE);
      speakText('Network connection lost. Switched to offline mode. Responses are safe locally.', 'Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [elevatedToken, refetchSession, speakText]);

  // Session state is absent or not started: route to the resume/instructions flow
  useEffect(() => {
    if (sessionSnapshot && !sessionSnapshot.status) {
      navigate(`/exam/${scheduleId}/resume`, { replace: true });
    }
  }, [sessionSnapshot, scheduleId, navigate]);

  const currentQuestion = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const currentAnswer = answersMap[currentIndex] || '';
  const isCurrentFlagged = flaggedSet.has(currentIndex);

  // Track visited questions and announce question readout for blind candidates
  useEffect(() => {
    if (!currentQuestion?.id) return;

    setVisitedSet((prev) => {
      if (!prev.has(currentIndex)) {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      }
      return prev;
    });

    const questionKey = `${currentIndex}-${currentQuestion.id}`;
    if (lastAnnouncedQuestionRef.current === questionKey) {
      return;
    }
    lastAnnouncedQuestionRef.current = questionKey;

    const questionNumText = `Question ${currentIndex + 1} of ${totalQuestions}`;
    const sectionText = currentQuestion?.section ? `, ${currentQuestion.section}` : '';

    let speechText = `${questionNumText}${sectionText}. ${currentQuestion?.stem || ''}`;

    if (currentQuestion?.type === 'MCQ' && currentQuestion?.options?.length > 0) {
      const optsText = currentQuestion.options
        .map((opt) => `${opt.prefix}: ${opt.text || opt.option_text}`)
        .join('. ');
      speechText += `. Options: ${optsText}`;
    } else if (currentQuestion?.type === 'DESCRIPTIVE') {
      const ansText = answersMap[currentIndex] || '';
      const wordCount = ansText.trim() ? ansText.trim().split(/\s+/).length : 0;
      speechText += `. Descriptive question.${wordCount > 0 ? ` ${wordCount} words saved.` : ''}`;
    }

    speakText(speechText, `Question ${currentIndex + 1}`);

    // Programmatically move keyboard focus to the question card heading on navigation
    requestAnimationFrame(() => {
      questionHeadingRef.current?.focus({ preventScroll: true });
    });
  }, [currentIndex, totalQuestions, currentQuestion?.id, currentQuestion?.section, currentQuestion?.stem, currentQuestion?.type, speakText]);


  // Synchronize authoritative session + clock offset from periodic snapshot
  useEffect(() => {
    if (!sessionSnapshot?.status) return;
    syncExamSession(sessionSnapshot, sessionSnapshot.server_current_time);
  }, [sessionSnapshot, syncExamSession]);

  // The backend remains authoritative: any terminal server state forces the
  // submitted terminal screen regardless of the local countdown. A paused
  // session (candidate left the exam) routes to the resume screen, where the
  // frozen timer can be restarted.
  useEffect(() => {
    const status = sessionSnapshot?.status;
    if (!status) return;
    if (isPaused) {
      navigate(`/exam/${scheduleId}/resume`, { replace: true });
      return;
    }
    const terminal = [
      EXAM_SESSION_STATUS.SUBMITTED,
      EXAM_SESSION_STATUS.AUTO_SUBMITTED,
      EXAM_SESSION_STATUS.EXPIRED,
      EXAM_SESSION_STATUS.TERMINATED,
    ];
    if (terminal.includes(status)) {
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
  }, [sessionSnapshot, scheduleId, navigate, isPaused]);

  // Debounced & Resilient answer saving to server or offline queue
  const persistAnswerToBackend = useCallback(
    async (questionId, optionId, textValue) => {
      if (hasExpired) return; // stop autosave once the timer reaches zero
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
        const terminal = err?.code === 'SESSION_SUBMITTED' || err?.code === 'SESSION_EXPIRED';
        if (terminal) {
          // Server already considers the session terminal: answers are no longer accepted.
          setSyncStatus(SYNC_STATUS.SAVED);
          navigate(`/exam/${scheduleId}/submitted`, { replace: true });
          return;
        }
        console.warn('Network save error, fallback to offline queue:', err);
        enqueueOfflineAnswer(scheduleId, questionId, optionId, textValue);
        setSyncStatus(SYNC_STATUS.LOCAL);
      }
    },
    [scheduleId, elevatedToken, hasExpired, navigate]
  );

  const handleSelectOption = (optionId) => {
    if (hasExpired) return; // disable answering once time is up
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
    if (hasExpired) return; // disable answering once time is up
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
    if (hasExpired) return; // disable answering once time is up
    setAnswersMap((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      cacheLocalAnswers(scheduleId, next);
      return next;
    });
    if (currentQuestion?.id) {
      persistAnswerToBackend(currentQuestion.id, null, null);
    }
    speakText(`Response cleared for Question ${currentIndex + 1}`, 'Response Cleared');
  };

  const handleToggleReview = () => {
    setFlaggedSet((prev) => {
      const next = new Set(prev);
      const isMarking = !next.has(currentIndex);
      if (isMarking) {
        next.add(currentIndex);
        speakText(`Question ${currentIndex + 1} marked for review`, 'Review Marked');
      } else {
        next.delete(currentIndex);
        speakText(`Question ${currentIndex + 1} review mark removed`, 'Review Unmarked');
      }
      // Synchronous persist so the flag survives a power loss mid-session
      cacheWorkbenchState(scheduleId, { answersMap, currentIndex, flaggedSet: next, visitedSet });
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleManualSave = () => {
    if (hasExpired) return; // disable answering once time is up
    if (currentQuestion?.id) {
      const val = answersMap[currentIndex];
      const optId = currentQuestion.type === 'MCQ' ? val : null;
      const textVal = currentQuestion.type === 'DESCRIPTIVE' ? val : null;
      persistAnswerToBackend(currentQuestion.id, optId, textVal);
      speakText(`Question ${currentIndex + 1} response saved`, 'Response Saved');
    }
  };

  const handleOpenSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(true);
    const ansCount = Object.keys(answersMap).filter((key) => Boolean(answersMap[key])).length;
    const unansCount = totalQuestions - ansCount;
    const revCount = flaggedSet.size;
    const summaryMsg = `Submit confirmation. ${ansCount} answered, ${unansCount} unanswered, ${revCount} marked for review. Press Enter to submit or Escape to cancel.`;
    speakText(summaryMsg, 'Submit Confirmation');
  }, [answersMap, totalQuestions, flaggedSet, speakText]);

  const handleCloseSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(false);
    speakText('Returned to exam.', 'Exam Resumed');
  }, [speakText]);

  const handleConfirmSubmit = async () => {
    setIsSubmittingPaper(true);
    speakText('Submitting examination paper...', 'Submitting');

    try {
      if (navigator.onLine && elevatedToken && scheduleId) {
        await examsApi.submitExam(scheduleId, elevatedToken, false);
      } else {
        enqueueSubmission(scheduleId, false);
      }
    } catch (err) {
      const terminal = err?.code === 'SESSION_SUBMITTED' || err?.code === 'SESSION_EXPIRED';
      console.warn('Submit API error:', err);
      if (!terminal) {
        enqueueSubmission(scheduleId, false);
      }
    } finally {
      setIsSubmittingPaper(false);
      setIsSubmitModalOpen(false);
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
  };

  const handleAutoSubmit = async () => {
    // Guard against a stale local countdown firing while the server has the
    // session paused: the frozen timer must not be ended. Route the candidate
    // to the resume screen instead; the server deadline is shifted on resume.
    if (pausedRef.current) {
      navigate(`/exam/${scheduleId}/resume`, { replace: true });
      return;
    }

    speakText('Time expired. Submitting answers automatically.', 'Auto Submit');

    // Final synchronization: refresh the authoritative session snapshot before submitting
    try {
      if (navigator.onLine && scheduleId) {
        await refetchSession();
      }
    } catch (err) {
      console.warn('Final synchronization before auto-submit failed:', err);
    }

    try {
      if (navigator.onLine && elevatedToken && scheduleId) {
        await examsApi.submitExam(scheduleId, elevatedToken, true);
      } else {
        enqueueSubmission(scheduleId, true);
      }
    } catch (err) {
      const terminal = err?.code === 'SESSION_SUBMITTED' || err?.code === 'SESSION_EXPIRED';
      console.warn('Auto-submit API error:', err);
      if (!terminal) {
        enqueueSubmission(scheduleId, true);
      }
    } finally {
      navigate(`/exam/${scheduleId}/submitted`, { replace: true });
    }
  };

  autoSubmitRef.current = handleAutoSubmit;

  const handleSelectOptionByIndex = useCallback(
    (optionIndex) => {
      if (hasExpired) return;
      if (currentQuestion?.type !== 'MCQ' || !currentQuestion?.options) return;
      if (optionIndex < 0 || optionIndex >= currentQuestion.options.length) return;

      const selectedOpt = currentQuestion.options[optionIndex];
      if (!selectedOpt) return;

      handleSelectOption(selectedOpt.id);
      const prefix = selectedOpt.prefix || String.fromCharCode(65 + optionIndex);
      const text = selectedOpt.text || selectedOpt.option_text || '';
      speakText(`Selected ${prefix}: ${text}`, 'Option Selected');
    },
    [hasExpired, currentQuestion, handleSelectOption, speakText]
  );


  const handleReadQuestion = useCallback(() => {
    if (currentQuestion?.stem) {
      speakText(`Question ${currentIndex + 1}: ${currentQuestion.stem}`, 'Current Question Stem', { force: true });
    }
  }, [currentIndex, currentQuestion?.stem, speakText]);

  const handleReadOptions = useCallback(() => {
    if (currentQuestion?.type === 'MCQ' && currentQuestion?.options?.length > 0) {
      const optionsText = currentQuestion.options
        .map((opt, i) => {
          const prefix = opt.prefix || String.fromCharCode(65 + i);
          const text = opt.text || opt.option_text || '';
          return `Option ${prefix}: ${text}`;
        })
        .join('. ');
      speakText(`Question ${currentIndex + 1} options: ${optionsText}`, 'All Options', { force: true });
    } else {
      speakText(
        `Question ${currentIndex + 1} is a descriptive essay question. Shortcuts: Alt+R reads question stem, Alt+V reads your typed response.`,
        'Descriptive Question Notice',
        { force: true }
      );
    }
  }, [currentIndex, currentQuestion, speakText]);

  const handleReadSelected = useCallback(() => {
    const val = answersMap[currentIndex];
    if (currentQuestion?.type === 'MCQ') {
      const selected = currentQuestion?.options?.find((opt) => String(opt.id) === String(val));
      if (selected) {
        const selectedIdx = currentQuestion.options.findIndex((opt) => String(opt.id) === String(val));
        const prefix = selected.prefix || String.fromCharCode(65 + selectedIdx);
        const text = selected.text || selected.option_text || '';
        speakText(`Selected answer for Question ${currentIndex + 1} is Option ${prefix}: ${text}`, 'Selected Option', { force: true });
      } else {
        speakText(`No option currently selected for Question ${currentIndex + 1}.`, 'No Selection', { force: true });
      }
    } else {
      if (val && val.trim()) {
        const wordCount = val.trim().split(/\s+/).length;
        speakText(`Your descriptive answer for Question ${currentIndex + 1} is: ${val}. Word count: ${wordCount} words.`, 'Descriptive Response', { force: true });
      } else {
        speakText(`No descriptive answer typed yet for Question ${currentIndex + 1}.`, 'No Answer', { force: true });
      }
    }
  }, [currentIndex, currentQuestion, answersMap, speakText]);

  const handleReadTimer = useCallback(() => {
    const timerElem = document.getElementById('timer-display');
    if (timerElem) timerElem.focus();
    speakText(`Remaining examination time: ${formatDuration(secondsRemaining)}`, 'Remaining Time', { force: true });
  }, [secondsRemaining, speakText]);

  const handleFocusPalette = useCallback(() => {
    const grid = document.getElementById('palette-grid-container');
    if (grid) {
      const firstTile = grid.querySelector('button');
      if (firstTile) firstTile.focus();
    }
    speakText(`Question palette focused. ${totalQuestions} questions available. Use arrow keys to navigate.`, 'Palette Focused');
  }, [totalQuestions, speakText]);

  // Single-key Direct Workbench Navigation & Action Keys (when not typing in textarea)
  useEffect(() => {
    const handleWorkbenchKeys = (e) => {
      const isInputElem =
        e.target &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable);

      // If candidate presses Escape inside a text field, blur it to return to command navigation
      if (isInputElem && e.key === 'Escape') {
        e.target.blur();
        speakText('Exited response field. Workbench navigation active.', 'Workbench Navigation');
        return;
      }

      if (isInputElem) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toUpperCase();

      // Arrow keys for Next / Previous question
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevious();
      } else if (key === 'M') {
        e.preventDefault();
        handleToggleReview();
      } else if (key === 'C') {
        e.preventDefault();
        handleClearResponse();
      } else if (key === 'S') {
        e.preventDefault();
        handleManualSave();
      } else if (key === 'R') {
        e.preventDefault();
        handleReadQuestion();
      } else if (key === 'O') {
        e.preventDefault();
        handleReadOptions();
      } else if (key === 'V') {
        e.preventDefault();
        handleReadSelected();
      } else if (key === 'T') {
        e.preventDefault();
        handleReadTimer();
      } else if (key === 'Q') {
        e.preventDefault();
        handleFocusPalette();
      } else if (currentQuestion?.type === 'MCQ' && currentQuestion?.options?.length > 0) {
        let idx = -1;
        if (/^[1-9]$/.test(key)) {
          idx = parseInt(key, 10) - 1;
        } else if (/^[A-Z]$/.test(key)) {
          idx = key.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7...
        }

        if (idx >= 0 && idx < currentQuestion.options.length) {
          e.preventDefault();
          handleSelectOptionByIndex(idx);
        }
      }
    };

    window.addEventListener('keydown', handleWorkbenchKeys);
    return () => window.removeEventListener('keydown', handleWorkbenchKeys);
  }, [
    currentQuestion,
    handleSelectOptionByIndex,
    handleSaveAndNext,
    handlePrevious,
    handleToggleReview,
    handleClearResponse,
    handleManualSave,
    handleReadQuestion,
    handleReadOptions,
    handleReadSelected,
    handleReadTimer,
    handleFocusPalette,
    speakText,
  ]);

  // Register Global Keyboard Shortcuts & Web Speech API TTS/STT Handlers
  useEffect(() => {
    registerHandler('nextQuestion', handleSaveAndNext);
    registerHandler('prevQuestion', handlePrevious);
    
    // Direct Option Selection (Alt+1 through Alt+8)
    registerHandler('selectOptionA', () => handleSelectOptionByIndex(0));
    registerHandler('selectOptionB', () => handleSelectOptionByIndex(1));
    registerHandler('selectOptionC', () => handleSelectOptionByIndex(2));
    registerHandler('selectOptionD', () => handleSelectOptionByIndex(3));
    registerHandler('selectOptionE', () => handleSelectOptionByIndex(4));
    registerHandler('selectOptionF', () => handleSelectOptionByIndex(5));
    registerHandler('selectOptionG', () => handleSelectOptionByIndex(6));
    registerHandler('selectOptionH', () => handleSelectOptionByIndex(7));

    registerHandler('markReview', handleToggleReview);
    registerHandler('clearResponse', handleClearResponse);
    registerHandler('saveResponse', handleManualSave);
    registerHandler('submitExam', handleOpenSubmitModal);

    registerHandler('focusPalette', handleFocusPalette);
    registerHandler('focusTimer', handleReadTimer);

    // STT Dictation Shortcut (Alt+D) - Enabled ONLY for Descriptive Questions
    registerHandler('sttToggle', () => {
      if (currentQuestion?.type === 'DESCRIPTIVE') {
        toggleDictation(({ final }) => {
          if (final) {
            handleTextChange((answersMap[currentIndex] || '') + ' ' + final);
          }
        });
      } else {
        speakText('Speech to Text dictation is only available for descriptive essay questions.', 'STT Notice');
      }
    });

    // TTS Web Speech API Handlers
    registerHandler('ttsReadQuestion', handleReadQuestion);
    registerHandler('ttsReadOptions', handleReadOptions);
    registerHandler('ttsReadSelected', handleReadSelected);
    registerHandler('ttsPauseResume', togglePauseResume);
    registerHandler('ttsStop', stopSpeech);
    registerHandler('ttsRepeat', repeatSpeech);

    return () => {
      unregisterHandler('nextQuestion');
      unregisterHandler('prevQuestion');
      unregisterHandler('selectOptionA');
      unregisterHandler('selectOptionB');
      unregisterHandler('selectOptionC');
      unregisterHandler('selectOptionD');
      unregisterHandler('selectOptionE');
      unregisterHandler('selectOptionF');
      unregisterHandler('selectOptionG');
      unregisterHandler('selectOptionH');
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
    };
  }, [
    registerHandler,
    unregisterHandler,
    handleSaveAndNext,
    handlePrevious,
    handleSelectOptionByIndex,
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
      paperTitle={apiQuestionsData?.subject_code || 'EXAM'}
      sectionTitle={currentQuestion?.section || 'Questions'}
      timerSlot={<Timer secondsRemaining={secondsRemaining} />}
      hideFooter={false}
      footerSlot={<ExamStatusBar syncStatus={syncStatus} isConnected={isConnected} />}
      sidebarContent={
        <QuestionPalette
          totalQuestions={totalQuestions}
          currentIndex={currentIndex}
          answersMap={answersMap}
          flaggedSet={flaggedSet}
          visitedSet={visitedSet}
          questions={questions}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          onSubmitExam={handleOpenSubmitModal}
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
            isDisabled={hasExpired}
            headingRef={questionHeadingRef}
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
      </div>

      {/* Screen 7: Submit Confirmation Modal Dialog */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={handleCloseSubmitModal}
        title="CONFIRM FINAL SUBMISSION"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="md" onClick={handleCloseSubmitModal}>
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
