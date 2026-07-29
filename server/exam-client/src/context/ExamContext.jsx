import React, { createContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem, removeItem } from '../utils/storage';

export const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const [elevatedToken, setElevatedToken] = useState(() => getItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage));
  const [activeScheduleId, setActiveScheduleId] = useState(() => getItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage));
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [flaggedSet, setFlaggedSet] = useState(new Set());
  const [endTime, setEndTime] = useState(null);
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

  const initExamSession = ({ token, scheduleId, questionsData, remainingSeconds }) => {
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
    if (remainingSeconds) {
      const calculatedEnd = new Date(Date.now() + remainingSeconds * 1000).toISOString();
      setEndTime(calculatedEnd);
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
    setElevatedToken(null);
    setActiveScheduleId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswersMap({});
    setFlaggedSet(new Set());
    setEndTime(null);
    setIsExamActive(false);
    removeItem(STORAGE_KEYS.ELEVATED_TOKEN, sessionStorage);
    removeItem(STORAGE_KEYS.ACTIVE_EXAM_ID, sessionStorage);
  };

  const value = {
    elevatedToken,
    activeScheduleId,
    questions,
    currentIndex,
    answersMap,
    flaggedSet,
    endTime,
    isExamActive,
    setQuestions,
    setCurrentIndex,
    setAnswer,
    toggleFlagQuestion,
    initExamSession,
    clearExamSession,
    setEndTime,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
