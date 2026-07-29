import { STORAGE_KEYS } from './constants';
import { getItem, setItem } from './storage';
import { examsApi } from '../features/exams/api/examsApi';
import { announceToScreenReader } from './ariaAnnounce';

/**
 * Examination Resilience Manager for TeioOS
 * Handles Offline Queueing, Network Recovery, Conflict Resolution, and Draft Caching
 */

export const getOfflineQueue = () => {
  return getItem(STORAGE_KEYS.OFFLINE_QUEUE, localStorage) || [];
};

export const saveOfflineQueue = (queue) => {
  setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue, localStorage);
};

export const enqueueOfflineAnswer = (scheduleId, questionId, optionId, textValue) => {
  const queue = getOfflineQueue();
  const timestamp = Date.now();

  // Deduplicate queue by replacing previous pending item for same question
  const existingIdx = queue.findIndex(
    (item) => item.scheduleId === scheduleId && item.questionId === questionId
  );

  const payload = {
    scheduleId,
    questionId,
    optionId,
    textValue,
    timestamp,
  };

  if (existingIdx !== -1) {
    queue[existingIdx] = payload;
  } else {
    queue.push(payload);
  }

  saveOfflineQueue(queue);
  announceToScreenReader('Network offline. Answer saved locally to resilience queue.');
};

export const flushOfflineQueue = async (elevatedToken, onProgress) => {
  const queue = getOfflineQueue();
  if (!queue || queue.length === 0) return { syncedCount: 0, errorCount: 0 };

  let syncedCount = 0;
  let errorCount = 0;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      if (elevatedToken && item.questionId) {
        await examsApi.saveAnswer(
          item.questionId,
          item.optionId,
          item.textValue,
          elevatedToken
        );
      }
      syncedCount++;
      if (onProgress) onProgress({ syncedCount, total: queue.length });
    } catch (err) {
      console.warn('Failed to flush offline answer item:', item, err);
      errorCount++;
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);

  if (syncedCount > 0) {
    announceToScreenReader(
      `Network recovered. Successfully synchronized ${syncedCount} offline answers with examination server.`
    );
  }

  return { syncedCount, errorCount };
};

export const cacheLocalAnswers = (scheduleId, answersMap) => {
  if (!scheduleId) return;
  const cacheKey = `${STORAGE_KEYS.EXAM_ANSWERS_CACHE}${scheduleId}`;
  setItem(
    cacheKey,
    {
      answersMap,
      updatedAt: Date.now(),
    },
    localStorage
  );
};

export const restoreLocalAnswers = (scheduleId) => {
  if (!scheduleId) return {};
  const cacheKey = `${STORAGE_KEYS.EXAM_ANSWERS_CACHE}${scheduleId}`;
  const data = getItem(cacheKey, localStorage);
  return data?.answersMap || {};
};

export const enqueueSubmission = (scheduleId, isAutoSubmit = false) => {
  const queue = getItem(STORAGE_KEYS.SUBMISSION_QUEUE, localStorage) || [];
  const payload = {
    scheduleId,
    isAutoSubmit,
    timestamp: Date.now(),
  };
  const updated = queue.filter((item) => item.scheduleId !== scheduleId);
  updated.push(payload);
  setItem(STORAGE_KEYS.SUBMISSION_QUEUE, updated, localStorage);
  announceToScreenReader('Network offline. Final paper submission queued for automatic background recovery.');
};

export const flushSubmissionQueue = async (elevatedToken) => {
  const queue = getItem(STORAGE_KEYS.SUBMISSION_QUEUE, localStorage) || [];
  if (!queue || queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      if (elevatedToken && item.scheduleId) {
        await examsApi.submitExam(item.scheduleId, elevatedToken, item.isAutoSubmit);
      }
    } catch (err) {
      console.warn('Failed to flush submission item:', item, err);
      remaining.push(item);
    }
  }

  setItem(STORAGE_KEYS.SUBMISSION_QUEUE, remaining, localStorage);
};

export const mergeAnswersWithConflictResolution = (apiQuestions = [], cachedLocalAnswers = {}) => {
  const mergedMap = {};

  apiQuestions.forEach((q, idx) => {
    const serverVal = q.saved_answer_option_id || q.saved_answer_text || null;
    const localVal = cachedLocalAnswers[idx] || null;

    // Conflict Resolution Strategy: Prefer local draft if user typed/selected locally, otherwise use server answer
    if (localVal !== null && localVal !== undefined) {
      mergedMap[idx] = localVal;
    } else if (serverVal !== null && serverVal !== undefined) {
      mergedMap[idx] = serverVal;
    }
  });

  return mergedMap;
};
