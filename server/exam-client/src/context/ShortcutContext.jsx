import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem } from '../utils/storage';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const ShortcutContext = createContext(null);

export const DEFAULT_SHORTCUTS = {
  nextQuestion: { key: 'N', alt: true, ctrl: false, shift: false, label: 'Next Question', category: 'Exam Navigation' },
  prevQuestion: { key: 'P', alt: true, ctrl: false, shift: false, label: 'Previous Question', category: 'Exam Navigation' },
  
  // Direct MCQ Option Selection Hotkeys (Options A through H)
  selectOptionA: { key: '1', alt: true, ctrl: false, shift: false, label: 'Select Option A / 1', category: 'MCQ Option Selection' },
  selectOptionB: { key: '2', alt: true, ctrl: false, shift: false, label: 'Select Option B / 2', category: 'MCQ Option Selection' },
  selectOptionC: { key: '3', alt: true, ctrl: false, shift: false, label: 'Select Option C / 3', category: 'MCQ Option Selection' },
  selectOptionD: { key: '4', alt: true, ctrl: false, shift: false, label: 'Select Option D / 4', category: 'MCQ Option Selection' },
  selectOptionE: { key: '5', alt: true, ctrl: false, shift: false, label: 'Select Option E / 5', category: 'MCQ Option Selection' },
  selectOptionF: { key: '6', alt: true, ctrl: false, shift: false, label: 'Select Option F / 6', category: 'MCQ Option Selection' },
  selectOptionG: { key: '7', alt: true, ctrl: false, shift: false, label: 'Select Option G / 7', category: 'MCQ Option Selection' },
  selectOptionH: { key: '8', alt: true, ctrl: false, shift: false, label: 'Select Option H / 8', category: 'MCQ Option Selection' },

  markReview: { key: 'M', alt: true, ctrl: false, shift: false, label: 'Mark for Review', category: 'Question Actions' },
  clearResponse: { key: 'C', alt: true, ctrl: false, shift: false, label: 'Clear Response', category: 'Question Actions' },
  saveResponse: { key: 'S', alt: true, ctrl: false, shift: false, label: 'Save Response to Server', category: 'Question Actions' },
  focusPalette: { key: 'Q', alt: true, ctrl: false, shift: false, label: 'Focus Question Palette Grid', category: 'Quick Focus' },
  focusTimer: { key: 'T', alt: true, ctrl: false, shift: false, label: 'Announce Remaining Time', category: 'Quick Focus' },
  submitExam: { key: 'Enter', alt: false, ctrl: true, shift: false, label: 'Submit Examination', category: 'Question Actions' },

  // Portal & Dashboard Navigation
  dashboardStartExam: { key: 'S', alt: true, ctrl: false, shift: false, label: 'Start / Resume Active Exam (Dashboard)', category: 'Portal Navigation' },
  dashboardSection1: { key: '1', alt: true, ctrl: false, shift: false, label: 'Jump to Current Exam (Dashboard)', category: 'Portal Navigation' },
  dashboardSection2: { key: '2', alt: true, ctrl: false, shift: false, label: 'Jump to Upcoming Exams (Dashboard)', category: 'Portal Navigation' },
  dashboardSection3: { key: '3', alt: true, ctrl: false, shift: false, label: 'Jump to Completed Papers (Dashboard)', category: 'Portal Navigation' },
  dashboardProfile: { key: 'U', alt: true, ctrl: false, shift: false, label: 'Jump to Student Profile (Dashboard)', category: 'Portal Navigation' },
  dashboardRefresh: { key: 'R', alt: true, ctrl: false, shift: false, label: 'Refresh Examination Schedules (Dashboard)', category: 'Portal Navigation' },
  navDashboard: { key: 'D', alt: true, ctrl: false, shift: false, label: 'Return to Dashboard', category: 'Portal Navigation' },
  logout: { key: 'L', alt: true, ctrl: false, shift: false, label: 'Sign Out / Log Out', category: 'Portal Navigation' },

  // System & Accessibility
  accessibility: { key: 'A', alt: true, ctrl: false, shift: false, label: 'Accessibility Preferences', category: 'System' },
  showHelp: { key: 'H', alt: true, ctrl: false, shift: false, label: 'Keyboard Shortcuts Help', category: 'System' },
  audioTour: { key: 'I', alt: true, ctrl: false, shift: false, label: 'Play Spoken Audio Navigation Guide', category: 'Audio & Speech' },

  // Speech-to-Text (STT) Dictation Shortcut
  sttToggle: { key: 'D', alt: true, ctrl: false, shift: false, label: 'Toggle Speech Dictation (Descriptive Answers)', category: 'Speech-to-Text' },

  // Text-to-Speech (TTS) Shortcuts
  ttsReadQuestion: { key: 'R', alt: true, ctrl: false, shift: false, label: 'Read Current Question Stem', category: 'Text-to-Speech' },
  ttsReadOptions: { key: 'O', alt: true, ctrl: false, shift: false, label: 'Read All Answer Options', category: 'Text-to-Speech' },
  ttsReadSelected: { key: 'V', alt: true, ctrl: false, shift: false, label: 'Read Selected Option / Answer', category: 'Text-to-Speech' },
  ttsPauseResume: { key: 'K', alt: true, ctrl: false, shift: false, label: 'Pause / Resume Speech', category: 'Text-to-Speech' },
  ttsStop: { key: 'X', alt: true, ctrl: false, shift: false, label: 'Stop Speech', category: 'Text-to-Speech' },
  ttsRepeat: { key: 'E', alt: true, ctrl: false, shift: false, label: 'Repeat Last Spoken Text', category: 'Text-to-Speech' },
};

export const ShortcutProvider = ({ children }) => {
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = getItem(STORAGE_KEYS.SHORTCUT_SETTINGS, localStorage);
    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? { ...DEFAULT_SHORTCUTS, ...saved }
      : DEFAULT_SHORTCUTS;
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const handlersRef = useRef({});

  // Persist customized shortcuts to localStorage
  useEffect(() => {
    setItem(STORAGE_KEYS.SHORTCUT_SETTINGS, shortcuts, localStorage);
  }, [shortcuts]);

  const openHelp = useCallback(() => {
    setIsHelpOpen(true);
    announceToScreenReader('Opened Keyboard Shortcuts Help Dialog');
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => {
      const next = !prev;
      if (next) announceToScreenReader('Opened Keyboard Shortcuts Help Dialog');
      return next;
    });
  }, []);

  const registerHandler = useCallback((actionName, callback) => {
    handlersRef.current[actionName] = callback;
  }, []);

  const unregisterHandler = useCallback((actionName) => {
    delete handlersRef.current[actionName];
  }, []);

  const updateShortcut = useCallback((actionName, newConfig) => {
    setShortcuts((prev) => {
      const updated = {
        ...prev,
        [actionName]: {
          ...prev[actionName],
          ...newConfig,
        },
      };
      announceToScreenReader(`Updated shortcut for ${prev[actionName]?.label || actionName}`);
      return updated;
    });
  }, []);

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    announceToScreenReader('Reset all keyboard shortcuts to factory defaults');
  }, []);

  // Global Central Keydown Handler with Collision & Textarea Protection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e || !e.key) return;

      const isInputElem =
        e.target &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable);

      // Match event against shortcut configurations
      const pressedKey = e.key.toUpperCase();
      const isAlt = Boolean(e.altKey);
      const isCtrl = Boolean(e.ctrlKey || e.metaKey);
      const isShift = Boolean(e.shiftKey);

      // Special Check for Help Modal Shortcut (Alt+H)
      if (isAlt && pressedKey === 'H') {
        e.preventDefault();
        toggleHelp();
        return;
      }

      // Check registered shortcut actions
      for (const [actionName, config] of Object.entries(shortcuts || {})) {
        if (!config || typeof config !== 'object' || !config.key) continue;

        const keyMatch = config.key.toUpperCase() === pressedKey;
        const altMatch = Boolean(config.alt) === isAlt;
        const ctrlMatch = Boolean(config.ctrl) === isCtrl;
        const shiftMatch = Boolean(config.shift) === isShift;

        if (keyMatch && altMatch && ctrlMatch && shiftMatch) {
          // If candidate is typing inside a text field, ensure non-modifier shortcuts don't swallow normal typing
          if (isInputElem && !isAlt && !isCtrl) {
            continue;
          }

          const handler = handlersRef.current[actionName];
          if (handler) {
            e.preventDefault();
            e.stopPropagation();
            handler(e);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [shortcuts, toggleHelp]);

  const value = {
    shortcuts,
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    registerHandler,
    unregisterHandler,
    updateShortcut,
    resetShortcuts,
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
};

export default ShortcutProvider;
