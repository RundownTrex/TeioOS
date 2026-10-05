import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useTTS } from '../../hooks/useTTS';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Command,
  Volume2,
  Square,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Keyboard,
  Layers,
  Sliders,
  FileText,
} from 'lucide-react';

export const AUDIO_SHORTCUTS_TOUR = `TeioOS Examination Keyboard and Audio Navigation Guide.

Here is how you can operate the entire platform and take your examination using fast single-chord and zero-tab keyboard shortcuts:

One. Active Examination Workbench:
To move to the Next Question, press the Right Arrow key, PageDown, Enter, or Alt + N.
To return to the Previous Question, press the Left Arrow key, PageUp, or Alt + P.
To choose an answer on multiple choice questions, simply press number keys 1 through 8, or letter keys A through H, or Alt + 1 through 8. Your selection is confirmed with audio feedback immediately.
To mark or unmark the current question for review, press M or Alt + M.
To clear your selected answer, press C or Alt + C.
To manually save your answer to the server, press S or Alt + S.
To focus the Question Palette grid, press Q or Alt + Q. Then use the Arrow keys to move between question tiles.
To hear your remaining examination time, press T or Alt + T.
To open the final submission confirmation modal, press Control + Enter.
When typing descriptive essay answers, press Escape at any time to exit the text field and resume direct workbench navigation.

Two. Speech and Audio Controls:
To read the current question stem and marks aloud, press R or Alt + R.
To read all available answer options, press O or Alt + O.
To verify your currently selected answer or typed text, press V or Alt + V.
To pause or resume speech, press Alt + K.
To stop speech immediately, press Alt + X.
To repeat the last spoken sentence, press Alt + E.
On descriptive essay questions, press Alt + D to toggle hands-free Speech-to-Text voice dictation.

Three. Portal and Dashboard Navigation:
On your Student Dashboard, press Enter, Space, or S, or Alt + S to start or resume your active examination.
Press 1, 2, or 3 to jump directly between Current Examination, Upcoming Exams, and Completed Papers.
Press R to refresh your examination schedules.
Press Alt + U to jump to your Student Profile.
Press Alt + L to sign out.

Four. Instructions and Paper Review:
On the instructions page, press Enter, Space, or B to agree and begin immediately, press R to read all rules, or press Escape or D to return to dashboard.
On the paper review screen, press Right or Down Arrow, N, or J to advance to the next reviewed question. Press Left or Up Arrow, P, or K to step backward. Press F to cycle through question filters, and press R to hear question feedback and evaluator comments.

Five. System and Help:
Press Alt + A anywhere to open Accessibility Preferences and adjust themes, contrast, font scaling, or speech speed.
Press Alt + H to reopen this Shortcuts Help dialog.
Press Alt + I to replay this complete audio tour.

Press Escape now to close this help dialog and return to your screen.`;

export const SHORTCUT_ITEMS = [
  // 1. Active Exam Workbench
  {
    id: 'next-question',
    actionName: 'nextQuestion',
    label: 'Next Question',
    category: 'Active Exam Workbench',
    primaryKeys: ['Right Arrow', 'PageDown', 'Enter'],
    defaultChord: 'Alt + N',
    description: 'Save response and advance to the next question.',
    scope: 'Exam',
  },
  {
    id: 'prev-question',
    actionName: 'prevQuestion',
    label: 'Previous Question',
    category: 'Active Exam Workbench',
    primaryKeys: ['Left Arrow', 'PageUp'],
    defaultChord: 'Alt + P',
    description: 'Save response and return to the previous question.',
    scope: 'Exam',
  },
  {
    id: 'mcq-select',
    label: 'Select MCQ Option (A–H / 1–8)',
    category: 'Active Exam Workbench',
    primaryKeys: ['1 – 8', 'A – H'],
    defaultChord: 'Alt + 1 – 8',
    description: 'Direct answer selection on any question without tabbing.',
    scope: 'Exam',
    isMcqGroup: true,
  },
  {
    id: 'mark-review',
    actionName: 'markReview',
    label: 'Mark / Unmark for Review',
    category: 'Active Exam Workbench',
    primaryKeys: ['M'],
    defaultChord: 'Alt + M',
    description: 'Toggle review flag on current question to revisit later.',
    scope: 'Exam',
  },
  {
    id: 'clear-response',
    actionName: 'clearResponse',
    label: 'Clear Selected Response',
    category: 'Active Exam Workbench',
    primaryKeys: ['C'],
    defaultChord: 'Alt + C',
    description: 'Clear selected multiple-choice answer or text.',
    scope: 'Exam',
  },
  {
    id: 'save-response',
    actionName: 'saveResponse',
    label: 'Save Response to Server',
    category: 'Active Exam Workbench',
    primaryKeys: ['S'],
    defaultChord: 'Alt + S',
    description: 'Manually sync current response to the server.',
    scope: 'Exam',
  },
  {
    id: 'focus-palette',
    actionName: 'focusPalette',
    label: 'Focus Question Palette Grid',
    category: 'Active Exam Workbench',
    primaryKeys: ['Q'],
    defaultChord: 'Alt + Q',
    description: 'Focus palette grid; use Arrow keys to jump across question tiles.',
    scope: 'Exam',
  },
  {
    id: 'focus-timer',
    actionName: 'focusTimer',
    label: 'Announce Remaining Time',
    category: 'Active Exam Workbench',
    primaryKeys: ['T'],
    defaultChord: 'Alt + T',
    description: 'Audibly announce countdown timer and focus the clock.',
    scope: 'Exam',
  },
  {
    id: 'submit-exam',
    actionName: 'submitExam',
    label: 'Submit Examination',
    category: 'Active Exam Workbench',
    primaryKeys: ['Ctrl + Enter'],
    defaultChord: null,
    description: 'Open final submission modal (Enter to confirm, Esc to return).',
    scope: 'Exam',
  },
  {
    id: 'exit-input',
    label: 'Exit Writing Area to Workbench',
    category: 'Active Exam Workbench',
    primaryKeys: ['Escape'],
    defaultChord: null,
    description: 'Exit descriptive essay textarea to resume zero-tab hotkeys.',
    scope: 'Descriptive',
  },

  // 2. Audio & Speech Navigation
  {
    id: 'read-question',
    actionName: 'ttsReadQuestion',
    label: 'Read Question Stem & Marks',
    category: 'Audio & Speech',
    primaryKeys: ['R'],
    defaultChord: 'Alt + R',
    description: 'Read the question prompt, question type, and mark weight aloud.',
    scope: 'Audio',
  },
  {
    id: 'read-options',
    actionName: 'ttsReadOptions',
    label: 'Read All Answer Options',
    category: 'Audio & Speech',
    primaryKeys: ['O'],
    defaultChord: 'Alt + O',
    description: 'Sequentially announce all available multiple choice options.',
    scope: 'Audio',
  },
  {
    id: 'read-selected',
    actionName: 'ttsReadSelected',
    label: 'Read Selected Option / Answer',
    category: 'Audio & Speech',
    primaryKeys: ['V'],
    defaultChord: 'Alt + V',
    description: 'Verify your currently selected choice or typed descriptive answer.',
    scope: 'Audio',
  },
  {
    id: 'speech-pause',
    actionName: 'ttsPauseResume',
    label: 'Pause / Resume Speech',
    category: 'Audio & Speech',
    primaryKeys: ['Alt + K'],
    defaultChord: null,
    description: 'Pause or resume any active text-to-speech audio reading.',
    scope: 'Audio',
  },
  {
    id: 'speech-stop',
    actionName: 'ttsStop',
    label: 'Stop Speech Immediately',
    category: 'Audio & Speech',
    primaryKeys: ['Alt + X'],
    defaultChord: null,
    description: 'Immediately silence text-to-speech reading engine.',
    scope: 'Audio',
  },
  {
    id: 'speech-repeat',
    actionName: 'ttsRepeat',
    label: 'Repeat Last Spoken Text',
    category: 'Audio & Speech',
    primaryKeys: ['Alt + E'],
    defaultChord: null,
    description: 'Replay the most recent auditory prompt or question text.',
    scope: 'Audio',
  },
  {
    id: 'stt-dictation',
    actionName: 'sttToggle',
    label: 'Toggle Speech Dictation (STT)',
    category: 'Audio & Speech',
    primaryKeys: ['Alt + D'],
    defaultChord: null,
    description: 'Hands-free voice-to-text dictation on descriptive essay questions.',
    scope: 'Descriptive',
  },

  // 3. Portal & Dashboard Navigation
  {
    id: 'dashboard-start',
    actionName: 'dashboardStartExam',
    label: 'Start / Resume Active Exam',
    category: 'Portal & Dashboard',
    primaryKeys: ['Enter', 'Space', 'S'],
    defaultChord: 'Alt + S',
    description: 'Begin or resume primary scheduled exam from the dashboard.',
    scope: 'Portal',
  },
  {
    id: 'dashboard-tab-1',
    actionName: 'dashboardSection1',
    label: 'Jump to Current Exam Tab',
    category: 'Portal & Dashboard',
    primaryKeys: ['1'],
    defaultChord: 'Alt + 1',
    description: 'Focus Current / Active examination section.',
    scope: 'Portal',
  },
  {
    id: 'dashboard-tab-2',
    actionName: 'dashboardSection2',
    label: 'Jump to Upcoming Exams Tab',
    category: 'Portal & Dashboard',
    primaryKeys: ['2'],
    defaultChord: 'Alt + 2',
    description: 'Focus Upcoming examinations schedule section.',
    scope: 'Portal',
  },
  {
    id: 'dashboard-tab-3',
    actionName: 'dashboardSection3',
    label: 'Jump to Completed Papers Tab',
    category: 'Portal & Dashboard',
    primaryKeys: ['3'],
    defaultChord: 'Alt + 3',
    description: 'Focus Completed papers and performance review section.',
    scope: 'Portal',
  },
  {
    id: 'dashboard-refresh',
    actionName: 'dashboardRefresh',
    label: 'Refresh Examination Schedules',
    category: 'Portal & Dashboard',
    primaryKeys: ['R'],
    defaultChord: 'Alt + R',
    description: 'Poll server to refresh scheduled examinations list.',
    scope: 'Portal',
  },
  {
    id: 'dashboard-profile',
    actionName: 'dashboardProfile',
    label: 'Jump to Student Profile',
    category: 'Portal & Dashboard',
    primaryKeys: ['Alt + U'],
    defaultChord: null,
    description: 'Focus candidate profile and roll number identification card.',
    scope: 'Portal',
  },
  {
    id: 'portal-logout',
    actionName: 'logout',
    label: 'Sign Out / Log Out',
    category: 'Portal & Dashboard',
    primaryKeys: ['Alt + L'],
    defaultChord: null,
    description: 'Safely terminate session and sign out of examination portal.',
    scope: 'Portal',
  },

  // 4. Instructions & Paper Review
  {
    id: 'instructions-begin',
    label: 'Instructions: Agree & Begin',
    category: 'Instructions & Review',
    primaryKeys: ['Enter', 'Space', 'B'],
    defaultChord: null,
    description: 'Automatically confirm rules agreement and enter the examination.',
    scope: 'Instructions',
  },
  {
    id: 'instructions-rules',
    label: 'Instructions: Read Rules Aloud',
    category: 'Instructions & Review',
    primaryKeys: ['R'],
    defaultChord: 'Alt + R',
    description: 'Listen to all examination guidelines and conduct policies.',
    scope: 'Instructions',
  },
  {
    id: 'instructions-agree',
    label: 'Instructions: Toggle Agreement',
    category: 'Instructions & Review',
    primaryKeys: ['C', 'A'],
    defaultChord: 'Alt + C',
    description: 'Check or uncheck rule acknowledgement checkbox.',
    scope: 'Instructions',
  },
  {
    id: 'review-next',
    label: 'Review: Next Question',
    category: 'Instructions & Review',
    primaryKeys: ['Right/Down Arrow', 'N', 'J'],
    defaultChord: 'Alt + N',
    description: 'Advance forward through evaluated questions in review.',
    scope: 'Review',
  },
  {
    id: 'review-prev',
    label: 'Review: Previous Question',
    category: 'Instructions & Review',
    primaryKeys: ['Left/Up Arrow', 'P', 'K'],
    defaultChord: 'Alt + P',
    description: 'Step backward through evaluated questions in review.',
    scope: 'Review',
  },
  {
    id: 'review-filter',
    label: 'Review: Cycle Question Filter',
    category: 'Instructions & Review',
    primaryKeys: ['F'],
    defaultChord: 'Alt + C',
    description: 'Filter review questions by All, Correct, Incorrect, or Descriptive.',
    scope: 'Review',
  },
  {
    id: 'review-read',
    label: 'Review: Read Question & Feedback',
    category: 'Instructions & Review',
    primaryKeys: ['R'],
    defaultChord: 'Alt + R',
    description: 'Hear question details, your response, and teacher feedback.',
    scope: 'Review',
  },
  {
    id: 'nav-dashboard',
    actionName: 'navDashboard',
    label: 'Return to Dashboard',
    category: 'Instructions & Review',
    primaryKeys: ['Escape', 'D'],
    defaultChord: 'Alt + B',
    description: 'Return to main student dashboard from instructions or review.',
    scope: 'Navigation',
  },

  // 5. System & Accessibility
  {
    id: 'system-accessibility',
    actionName: 'accessibility',
    label: 'Accessibility Preferences Modal',
    category: 'System & Accessibility',
    primaryKeys: ['Alt + A'],
    defaultChord: null,
    description: 'Customize high-contrast themes, font scaling, and TTS voice speed.',
    scope: 'System',
  },
  {
    id: 'system-help',
    actionName: 'showHelp',
    label: 'Keyboard Shortcuts Reference',
    category: 'System & Accessibility',
    primaryKeys: ['Alt + H'],
    defaultChord: null,
    description: 'Open or close this keyboard navigation reference popup.',
    scope: 'System',
  },
  {
    id: 'system-audio-tour',
    actionName: 'audioTour',
    label: 'Play Spoken Navigation Guide',
    category: 'System & Accessibility',
    primaryKeys: ['Alt + I'],
    defaultChord: null,
    description: 'Listen to the full auditory walkthrough of TeioOS shortcuts.',
    scope: 'System',
  },
  {
    id: 'system-close-modal',
    label: 'Close Modal / Dismiss Dialog',
    category: 'System & Accessibility',
    primaryKeys: ['Escape'],
    defaultChord: null,
    description: 'Close active popups or dialogs and return focus to main view.',
    scope: 'System',
  },
];

export const INDIVIDUAL_MCQ_OPTIONS = [
  { option: 'A', numKey: '1', chord: 'Alt + 1' },
  { option: 'B', numKey: '2', chord: 'Alt + 2' },
  { option: 'C', numKey: '3', chord: 'Alt + 3' },
  { option: 'D', numKey: '4', chord: 'Alt + 4' },
  { option: 'E', numKey: '5', chord: 'Alt + 5' },
  { option: 'F', numKey: '6', chord: 'Alt + 6' },
  { option: 'G', numKey: '7', chord: 'Alt + 7' },
  { option: 'H', numKey: '8', chord: 'Alt + 8' },
];

const CATEGORY_TABS = [
  'All',
  'Active Exam Workbench',
  'Audio & Speech',
  'Portal & Dashboard',
  'Instructions & Review',
  'System & Accessibility',
];

const CATEGORY_ICONS = {
  'Active Exam Workbench': Keyboard,
  'Audio & Speech': Volume2,
  'Portal & Dashboard': Layers,
  'Instructions & Review': FileText,
  'System & Accessibility': Sliders,
};

export const ShortcutHelpModal = () => {
  const { isHelpOpen, closeHelp, shortcuts } = useShortcuts();
  const { isSpeaking, speakText, stopSpeech } = useTTS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showIndividualMcq, setShowIndividualMcq] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isHelpOpen) {
      const prompt =
        'Keyboard Shortcuts Help Dialog. Press Alt+I to hear the complete spoken guide, or Escape to close.';
      speakText(prompt, 'Shortcuts Help');
      setSearchQuery('');
      setSelectedCategory('All');
      setShowIndividualMcq(false);
    }
  }, [isHelpOpen, speakText]);

  // Format shortcut combo from registered shortcut configuration
  const formatChord = (config) => {
    if (!config) return null;
    const parts = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.alt) parts.push('Alt');
    if (config.shift) parts.push('Shift');
    parts.push(config.key);
    return parts.join(' + ');
  };

  // Resolve chord dynamically from shortcut state if registered
  const resolveChord = (item) => {
    if (item.actionName && shortcuts && shortcuts[item.actionName]) {
      const cfg = shortcuts[item.actionName];
      // Only show chord if it's different from primary key
      const combo = formatChord(cfg);
      if (item.primaryKeys && item.primaryKeys.includes(combo)) {
        return null;
      }
      return combo || item.defaultChord;
    }
    return item.defaultChord;
  };

  // Filter items based on active category and search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SHORTCUT_ITEMS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (!query) return true;

      const labelMatch = item.label.toLowerCase().includes(query);
      const descMatch = item.description.toLowerCase().includes(query);
      const catMatch = item.category.toLowerCase().includes(query);
      const scopeMatch = item.scope?.toLowerCase().includes(query);
      const chord = resolveChord(item)?.toLowerCase() || '';
      const chordMatch = chord.includes(query);
      const primaryMatch = item.primaryKeys.some((k) => k.toLowerCase().includes(query));

      return labelMatch || descMatch || catMatch || scopeMatch || chordMatch || primaryMatch;
    });
  }, [searchQuery, selectedCategory, shortcuts]);

  // Group filtered items by category
  const groupedCategories = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handlePlayAudioTour = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      speakText(AUDIO_SHORTCUTS_TOUR, 'Spoken Shortcuts Audio Guide');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        e.stopPropagation();
        setSearchQuery('');
      }
    }
  };

  const footerActions = (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <Button
        variant={isSpeaking ? 'danger' : 'secondary'}
        size="sm"
        onClick={handlePlayAudioTour}
        leftIcon={isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      >
        {isSpeaking ? 'Stop Audio Guide' : 'Listen to Audio Guide (Alt+I)'}
      </Button>

      <Button variant="primary" size="md" onClick={closeHelp}>
        Close Help (Esc)
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isHelpOpen}
      onClose={closeHelp}
      title="Keyboard & Audio Navigation Guide"
      footer={footerActions}
      size="xl"
    >
      <div className="space-y-4 select-none max-h-[65vh] overflow-y-auto pr-1">
        {/* Spoken Audio Guide Banner */}
        <div className="p-3.5 bg-subtle/50 border border-border-main rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-navy-primary" aria-hidden="true" />
              Auditory Quick Reference &amp; Screen Readers
            </span>
            <p className="text-[11px] text-text-muted">
              TeioOS provides full zero-tab keyboard navigation and built-in text-to-speech. Press{' '}
              <kbd className="px-1.5 py-0.5 font-mono bg-surface border border-border-strong rounded text-[10px] font-semibold text-text-main">
                Alt+I
              </kbd>{' '}
              anywhere to hear the complete spoken walkthrough.
            </p>
          </div>
          <Button
            variant={isSpeaking ? 'danger' : 'outline'}
            size="sm"
            onClick={handlePlayAudioTour}
            leftIcon={isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          >
            {isSpeaking ? 'Stop Speech' : 'Play Audio Guide'}
          </Button>
        </div>

        {/* Search Bar & Quick Categories */}
        <div className="space-y-2.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search shortcuts by key or action (e.g. Next, MCQ, Timer, Audio, Submit)..."
              aria-label="Filter keyboard shortcuts"
              className="w-full pl-9 pr-9 py-2 text-xs bg-surface text-text-main border border-border-main rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary/40 focus:border-navy-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear shortcut search"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-main transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            role="tablist"
            aria-label="Filter shortcuts by category"
            className="flex flex-wrap items-center gap-1.5 pb-1"
          >
            {CATEGORY_TABS.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'All'
                  ? SHORTCUT_ITEMS.length
                  : SHORTCUT_ITEMS.filter((i) => i.category === cat).length;

              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-navy-primary/40 ${
                    isSelected
                      ? 'bg-navy-primary text-text-inverse border-navy-primary font-medium'
                      : 'bg-surface text-text-muted border-border-main hover:border-border-strong hover:text-text-main'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-text-inverse/20 text-text-inverse'
                        : 'bg-subtle text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts Listing */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-subtle/30 border border-border-main rounded-md space-y-2">
            <Keyboard className="w-8 h-8 text-text-muted mx-auto" aria-hidden="true" />
            <p className="text-xs font-medium text-text-main">
              No keyboard shortcuts found matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <p className="text-[11px] text-text-muted">
              Try searching with another key name like &ldquo;Arrow&rdquo;, &ldquo;Enter&rdquo;, or &ldquo;Audio&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              Reset Search Filter
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCategories).map(([catName, items]) => {
              const IconComponent = CATEGORY_ICONS[catName] || Command;
              return (
                <section
                  key={catName}
                  aria-labelledby={`cat-${catName.replace(/[\s&]+/g, '-').toLowerCase()}`}
                  className="space-y-2.5"
                >
                  <h3
                    id={`cat-${catName.replace(/[\s&]+/g, '-').toLowerCase()}`}
                    className="text-xs font-bold text-text-main pb-1 border-b border-border-main flex items-center gap-2"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-navy-primary" aria-hidden="true" />
                    <span>{catName}</span>
                    <span className="text-[11px] font-normal text-text-muted ml-auto">
                      {items.length} {items.length === 1 ? 'shortcut' : 'shortcuts'}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {items.map((item) => {
                      const chord = resolveChord(item);

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 bg-surface border border-border-main rounded-md flex flex-col justify-between gap-2 hover:border-border-strong transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-text-main text-xs block">
                                {item.label}
                              </span>
                              <p className="text-[11px] text-text-muted leading-snug">
                                {item.description}
                              </p>
                            </div>
                            {item.scope && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-subtle text-text-muted border border-border-main rounded shrink-0">
                                {item.scope}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-border-main/50">
                            <span className="text-[11px] text-text-muted font-medium">Hotkey:</span>
                            <div className="flex items-center flex-wrap gap-1 justify-end">
                              {/* Primary Keys */}
                              {item.primaryKeys.map((k, idx) => (
                                <React.Fragment key={k}>
                                  {idx > 0 && (
                                    <span className="text-[10px] text-text-muted font-sans">/</span>
                                  )}
                                  <kbd className="px-2 py-0.5 font-mono text-[11px] font-bold bg-navy-primary text-text-inverse border border-navy-primary/30 rounded shadow-xs">
                                    {k}
                                  </kbd>
                                </React.Fragment>
                              ))}

                              {/* Alternate Chord Key if present */}
                              {chord && (
                                <>
                                  <span className="text-[10px] text-text-muted font-sans px-0.5">or</span>
                                  <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-subtle text-text-main border border-border-strong rounded">
                                    {chord}
                                  </kbd>
                                </>
                              )}
                            </div>
                          </div>

                          {/* MCQ Expandable Sub-table */}
                          {item.isMcqGroup && (
                            <div className="mt-1 pt-1.5 border-t border-dashed border-border-main">
                              <button
                                type="button"
                                onClick={() => setShowIndividualMcq((prev) => !prev)}
                                aria-expanded={showIndividualMcq}
                                className="text-[11px] text-navy-primary font-medium hover:underline flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-navy-primary rounded"
                              >
                                {showIndividualMcq ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide individual option hotkeys (A–H)
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show individual option hotkeys (A–H / 1–8)
                                  </>
                                )}
                              </button>

                              {showIndividualMcq && (
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-subtle/60 rounded border border-border-main">
                                  {INDIVIDUAL_MCQ_OPTIONS.map((opt) => (
                                    <div
                                      key={opt.option}
                                      className="flex items-center justify-between px-2 py-1 bg-surface border border-border-main rounded text-[11px]"
                                    >
                                      <span className="font-semibold text-text-main">
                                        Opt {opt.option}:
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.2 font-mono text-[10px] font-bold bg-navy-primary text-text-inverse rounded">
                                          {opt.numKey}
                                        </kbd>
                                        <span className="text-[9px] text-text-muted">/</span>
                                        <kbd className="px-1 py-0.2 font-mono text-[10px] font-bold bg-navy-primary text-text-inverse rounded">
                                          {opt.option}
                                        </kbd>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShortcutHelpModal;
