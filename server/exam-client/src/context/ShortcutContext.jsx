import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem } from '../utils/storage';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const ShortcutContext = createContext(null);

export const SHORTCUTS_SCHEMA_VERSION = 2;

export const DEFAULT_SHORTCUTS = {
  // Exam Navigation
  nextQuestion: {
    key: 'N',
    alt: true,
    ctrl: false,
    shift: false,
    label: 'Next Question',
    category: 'Exam Navigation',
    primaryKey: 'Right Arrow / Enter',
    secondaryKeys: ['PageDown', 'Alt + N'],
    description: 'Save current response and advance to next question',
  },
  prevQuestion: {
    key: 'P',
    alt: true,
    ctrl: false,
    shift: false,
    label: 'Previous Question',
    category: 'Exam Navigation',
    primaryKey: 'Left Arrow',
    secondaryKeys: ['PageUp', 'Alt + P'],
    description: 'Return to previous question in paper',
  },
  
  // Direct MCQ Option Selection Hotkeys (Options A through H)
  selectOptionA: { key: '1', alt: true, ctrl: false, shift: false, label: 'Select Option A / 1', category: 'MCQ Option Selection', primaryKey: '1 or A', chordKey: 'Alt + 1', description: 'Choose Option A directly' },
  selectOptionB: { key: '2', alt: true, ctrl: false, shift: false, label: 'Select Option B / 2', category: 'MCQ Option Selection', primaryKey: '2 or B', chordKey: 'Alt + 2', description: 'Choose Option B directly' },
  selectOptionC: { key: '3', alt: true, ctrl: false, shift: false, label: 'Select Option C / 3', category: 'MCQ Option Selection', primaryKey: '3 or C', chordKey: 'Alt + 3', description: 'Choose Option C directly' },
  selectOptionD: { key: '4', alt: true, ctrl: false, shift: false, label: 'Select Option D / 4', category: 'MCQ Option Selection', primaryKey: '4 or D', chordKey: 'Alt + 4', description: 'Choose Option D directly' },
  selectOptionE: { key: '5', alt: true, ctrl: false, shift: false, label: 'Select Option E / 5', category: 'MCQ Option Selection', primaryKey: '5 or E', chordKey: 'Alt + 5', description: 'Choose Option E directly' },
  selectOptionF: { key: '6', alt: true, ctrl: false, shift: false, label: 'Select Option F / 6', category: 'MCQ Option Selection', primaryKey: '6 or F', chordKey: 'Alt + 6', description: 'Choose Option F directly' },
  selectOptionG: { key: '7', alt: true, ctrl: false, shift: false, label: 'Select Option G / 7', category: 'MCQ Option Selection', primaryKey: '7 or G', chordKey: 'Alt + 7', description: 'Choose Option G directly' },
  selectOptionH: { key: '8', alt: true, ctrl: false, shift: false, label: 'Select Option H / 8', category: 'MCQ Option Selection', primaryKey: '8 or H', chordKey: 'Alt + 8', description: 'Choose Option H directly' },

  // Question Actions
  markReview: { key: 'M', alt: true, ctrl: false, shift: false, label: 'Mark / Unmark for Review', category: 'Question Actions', primaryKey: 'M', chordKey: 'Alt + M', description: 'Toggle review flag on current question' },
  clearResponse: { key: 'C', alt: true, ctrl: false, shift: false, label: 'Clear Selected Response', category: 'Question Actions', primaryKey: 'C', chordKey: 'Alt + C', description: 'Clear response selection' },
  saveResponse: { key: 'S', alt: true, ctrl: false, shift: false, label: 'Save Response to Server', category: 'Question Actions', primaryKey: 'S', chordKey: 'Alt + S', description: 'Manually flush response to backend' },
  focusPalette: { key: 'Q', alt: true, ctrl: false, shift: false, label: 'Focus Question Palette Grid', category: 'Quick Focus', primaryKey: 'Q', chordKey: 'Alt + Q', description: 'Jump focus to palette; use arrows to move tiles' },
  focusTimer: { key: 'T', alt: true, ctrl: false, shift: false, label: 'Announce Remaining Time', category: 'Quick Focus', primaryKey: 'T', chordKey: 'Alt + T', description: 'Speak remaining examination duration without shifting keyboard focus' },
  submitExam: { key: 'Enter', alt: false, ctrl: true, shift: false, label: 'Submit Examination', category: 'Question Actions', primaryKey: 'Ctrl + Enter', chordKey: 'Ctrl + Enter', description: 'Open final submission confirmation dialog' },

  // Portal & Dashboard Navigation
  dashboardStartExam: { key: 'S', alt: true, ctrl: false, shift: false, label: 'Start / Resume Active Exam', category: 'Portal Navigation', primaryKey: 'Enter / Space / S', chordKey: 'Alt + S', description: 'Begin or resume primary scheduled exam' },
  dashboardSection1: { key: '1', alt: true, ctrl: false, shift: false, label: 'Jump to Current Exam Tab', category: 'Portal Navigation', primaryKey: '1', chordKey: 'Alt + 1', description: 'Navigate directly to current scheduled exams' },
  dashboardSection2: { key: '2', alt: true, ctrl: false, shift: false, label: 'Jump to Upcoming Exams Tab', category: 'Portal Navigation', primaryKey: '2', chordKey: 'Alt + 2', description: 'View future scheduled examinations' },
  dashboardSection3: { key: '3', alt: true, ctrl: false, shift: false, label: 'Jump to Completed Papers Tab', category: 'Portal Navigation', primaryKey: '3', chordKey: 'Alt + 3', description: 'Access submitted examinations and scores' },
  dashboardProfile: { key: 'U', alt: true, ctrl: false, shift: false, label: 'Jump to Student Profile', category: 'Portal Navigation', primaryKey: 'Alt + U', chordKey: 'Alt + U', description: 'Focus candidate profile and roll number' },
  dashboardRefresh: { key: 'R', alt: true, ctrl: false, shift: false, label: 'Refresh Examination Schedules', category: 'Portal Navigation', primaryKey: 'R', chordKey: 'Alt + R', description: 'Poll backend server to refresh schedules' },
  navDashboard: { key: 'B', alt: true, ctrl: false, shift: false, label: 'Return to Dashboard', category: 'Portal Navigation', primaryKey: 'Escape / D', chordKey: 'Alt + B', description: 'Return to main student dashboard' },
  logout: { key: 'L', alt: true, ctrl: false, shift: false, label: 'Sign Out / Log Out', category: 'Portal Navigation', primaryKey: 'Alt + L', chordKey: 'Alt + L', description: 'Safely terminate session and sign out' },

  // System & Accessibility
  accessibility: { key: 'A', alt: true, ctrl: false, shift: false, label: 'Accessibility Preferences', category: 'System', primaryKey: 'Alt + A', chordKey: 'Alt + A', description: 'Customize themes, contrast, and font scale' },
  showHelp: { key: 'H', alt: true, ctrl: false, shift: false, label: 'Keyboard Shortcuts Reference', category: 'System', primaryKey: 'Alt + H', chordKey: 'Alt + H', description: 'Toggle keyboard shortcut help modal' },
  audioTour: { key: 'I', alt: true, ctrl: false, shift: false, label: 'Play Spoken Navigation Guide', category: 'Audio & Speech', primaryKey: 'Alt + I', chordKey: 'Alt + I', description: 'Full audio tour of all system shortcuts' },

  // Speech-to-Text (STT) Dictation Shortcut
  sttToggle: { key: 'D', alt: true, ctrl: false, shift: false, label: 'Toggle Speech Dictation (Descriptive)', category: 'Speech-to-Text', primaryKey: 'Alt + D', chordKey: 'Alt + D', description: 'Hands-free voice transcription for essays' },

  // Text-to-Speech (TTS) Shortcuts
  ttsReadQuestion: { key: 'R', alt: true, ctrl: false, shift: false, label: 'Read Question Stem / Rules', category: 'Text-to-Speech', primaryKey: 'R', chordKey: 'Alt + R', description: 'Speak question text or rules aloud' },
  ttsReadOptions: { key: 'O', alt: true, ctrl: false, shift: false, label: 'Read All Answer Options', category: 'Text-to-Speech', primaryKey: 'O', chordKey: 'Alt + O', description: 'Sequentially read all MCQ options' },
  ttsReadSelected: { key: 'V', alt: true, ctrl: false, shift: false, label: 'Read Selected Option / Answer', category: 'Text-to-Speech', primaryKey: 'V', chordKey: 'Alt + V', description: 'Speak currently chosen answer' },
  ttsPauseResume: { key: 'K', alt: true, ctrl: false, shift: false, label: 'Pause / Resume Speech', category: 'Text-to-Speech', primaryKey: 'Alt + K', chordKey: 'Alt + K', description: 'Pause or resume speech playback' },
  ttsStop: { key: 'X', alt: true, ctrl: false, shift: false, label: 'Stop Speech', category: 'Text-to-Speech', primaryKey: 'Alt + X', chordKey: 'Alt + X', description: 'Immediately silence speech engine' },
  ttsRepeat: { key: 'E', alt: true, ctrl: false, shift: false, label: 'Repeat Last Spoken Text', category: 'Text-to-Speech', primaryKey: 'Alt + E', chordKey: 'Alt + E', description: 'Replay last spoken announcement' },
};

export const ShortcutProvider = ({ children }) => {
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = getItem(STORAGE_KEYS.SHORTCUT_SETTINGS, localStorage);
    if (saved && typeof saved === 'object' && !Array.isArray(saved) && saved._version === SHORTCUTS_SCHEMA_VERSION) {
      return { ...DEFAULT_SHORTCUTS, ...saved };
    }
    return DEFAULT_SHORTCUTS;
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const handlersRef = useRef({});

  // Persist customized shortcuts to localStorage with schema version
  useEffect(() => {
    setItem(STORAGE_KEYS.SHORTCUT_SETTINGS, { ...shortcuts, _version: SHORTCUTS_SCHEMA_VERSION }, localStorage);
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
