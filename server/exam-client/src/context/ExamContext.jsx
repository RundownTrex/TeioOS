import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem, removeItem } from '../utils/storage';

export const ExamContext = createContext(null);

const toISO = (value) => (value ? new Date(value).toISOString() : null);

const buildPayload = (scheduleId, session, clockOffsetMs) => ({
  scheduleId,
  assignmentId: session?.assignment_id || null,
  status: session?.status || null,
  startedAt: toISO(session?.started_at),
  expiresAt: toISO(session?.expires_at),
  submittedAt: toISO(session?.submitted_at),
  lastActivityAt: toISO(session?.last_activity_at),
  pausedAt: toISO(session?.paused_at),
  duration: session?.duration || null,
  clockOffsetMs,
  fetchedAt: Date.now(),
});

export const ExamProvider = ({ children }) => {
  const [elevatedToken, setElevatedToken] = useState(() => getItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage));
  const [activeScheduleId, setActiveScheduleId] = useState(() => getItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage));
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [flaggedSet, setFlaggedSet] = useState(new Set());
  const [session, setSession] = useState(() => getItem(STORAGE_KEYS.EXAM_SESSION_PAYLOAD, localStorage) || null);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const [isExamActive, setIsExamActive] = useState(Boolean(elevatedToken && activeScheduleId));

  useEffect(() => {
    if (elevatedToken && activeScheduleId) {
      setItem(STORAGE_KEYS.ELEVATED_TOKEN, elevatedToken, sessionStorage);
      setItem(STORAGE_KEYS.ACTIVE_EXAM_ID, activeScheduleId, sessionStorage);
      setIsExamActive(true);
    } else {
      setIsExamActive(false);
    }
  }, [elevatedToken, activeScheduleId]);

  // Stable identity: reads the latest session through a ref so the callback
  // never changes between renders. Without this, ActiveExamPage's sync effect
  // would re-run on every session change, re-syncing in an infinite loop and
  // freezing the countdown timer.
  const syncExamSession = useCallback((sessionData, serverCurrentTime) => {
    if (!sessionData?.expires_at) return;

    const clockOffsetMs = serverCurrentTime
      ? new Date(serverCurrentTime).getTime() - Date.now()
      : (sessionRef.current?.clockOffsetMs || 0);

    const nextSession = buildPayload(activeScheduleId, sessionData, clockOffsetMs);
    setSession(nextSession);
    setItem(STORAGE_KEYS.EXAM_SESSION_PAYLOAD, nextSession, localStorage);
  }, [activeScheduleId]);

  const initExamSession = ({ token, scheduleId, questionsData, remainingSeconds, session: sessionData, serverCurrentTime }) => {
    // Synchronously write to storage and state to eliminate navigation frame race conditions
    if (token) {
      setElevatedToken(token);
      setItem(STORAGE_KEYS.ELEVATED_TOKEN, token, sessionStorage);
    }
    if (scheduleId) {
      setActiveScheduleId(scheduleId);
      setItem(STORAGE_KEYS.ACTIVE_EXAM_ID, scheduleId, sessionStorage);
    }
    setIsExamActive(true);

    if (questionsData) setQuestions(questionsData);

    let clockOffsetMs = 0;
    let sessionPayload = session;

    if (sessionData?.expires_at) {
      if (serverCurrentTime) {
        clockOffsetMs = new Date(serverCurrentTime).getTime() - Date.now();
      } else {
        clockOffsetMs = session?.clockOffsetMs || 0;
      }
      sessionPayload = buildPayload(scheduleId, sessionData, clockOffsetMs);
    } else if (remainingSeconds) {
      // Legacy fallback: derive an absolute expiry from a computed remaining duration
      sessionPayload = {
        scheduleId,
        assignmentId: null,
        status: 'in_progress',
        startedAt: null,
        expiresAt: new Date(Date.now() + remainingSeconds * 1000).toISOString(),
        submittedAt: null,
        lastActivityAt: null,
        duration: null,
        clockOffsetMs: 0,
        fetchedAt: Date.now(),
      };
    }

    setSession(sessionPayload);
    if (sessionPayload) {
      setItem(STORAGE_KEYS.EXAM_SESSION_PAYLOAD, sessionPayload, localStorage);
    }
  };

  const setAnswer = (questionId, answerData) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...answerData,
      },
    }));
  };

  const toggleFlagQuestion = (questionId) => {
    setFlaggedSet((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const clearExamSession = () => {
    const scheduleIdToPurge = activeScheduleId;
    setElevatedToken(null);
    setActiveScheduleId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswersMap({});
    setFlaggedSet(new Set());
    setSession(null);
    setIsExamActive(false);
    removeItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage);
    removeItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage);
    removeItem(STORAGE_KEYS.EXAM_SESSION_PAYLOAD, localStorage);
    // Purge the cached workbench state so a future attempt starts clean
    if (scheduleIdToPurge) {
      removeItem(`${STORAGE_KEYS.EXAM_ANSWERS_CACHE}${scheduleIdToPurge}`, localStorage);
    }
  };

  const value = {
    elevatedToken,
    activeScheduleId,
    questions,
    currentIndex,
    answersMap,
    flaggedSet,
    session,
    endTime: session?.expiresAt || null,
    isExamActive,
    setQuestions,
    setCurrentIndex,
    setAnswer,
    toggleFlagQuestion,
    initExamSession,
    syncExamSession,
    clearExamSession,
    setEndTime: () => {},
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export default ExamProvider;
