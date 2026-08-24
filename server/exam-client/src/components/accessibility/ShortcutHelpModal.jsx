import React from 'react';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useTTS } from '../../hooks/useTTS';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Command, Volume2, Square, RotateCcw } from 'lucide-react';

export const AUDIO_SHORTCUTS_TOUR = `TeioOS Examination Keyboard and Audio Navigation Guide.

Here is how you can take your entire examination using fast single-chord keyboard shortcuts without repetitive tabbing:

One. Question Navigation:
Press Alt + N to save and move to the Next Question.
Press Alt + P to return to the Previous Question.

Two. Multiple Choice Option Selection:
On any multiple choice question with any number of options, you do not need to tab through buttons.
Press Alt + 1 through Alt + 8, or simply press number keys 1 through 8, or letters A through H, to choose options A through H directly.
Your selection is confirmed with immediate audio feedback.

Three. Question Actions:
Press Alt + M to Mark or Unmark the current question for review.
Press Alt + C to Clear your selected answer.
Press Alt + S to manually save your response to the server.

Four. Spoken Reading Controls:
Press Alt + R to read the current question stem.
Press Alt + O to read all available options sequentially.
Press Alt + V to verify what answer you currently have selected.
Press Alt + K to pause or resume speech.
Press Alt + X to stop speech immediately.
Press Alt + E to repeat the last spoken sentence.

Five. Speech-to-Text Voice Dictation:
On descriptive essay questions, press Alt + D to turn your microphone on or off to dictate answers hands-free.

Six. Spatial Navigation and Status:
Press Alt + Q to jump directly into the Question Palette. Then use the Arrow keys to move between question tiles.
Press Alt + T to hear the remaining examination time.
Press Control + Enter to open the final exam submission confirmation dialog.

Seven. System and Help:
Press Alt + A to open Accessibility Preferences such as high contrast themes and font scaling.
Press Alt + H to reopen this Shortcuts Help dialog.
Press Alt + I to replay this complete audio tour.

Press Escape now to close this help dialog and return to your examination.`;

export const ShortcutHelpModal = () => {
  const { isHelpOpen, closeHelp, shortcuts } = useShortcuts();
  const { isSpeaking, speakText, stopSpeech } = useTTS();

  // Format shortcut object into accessible visual badge text (e.g., Alt + N)
  const formatCombo = (config) => {
    if (!config) return '';
    const parts = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.alt) parts.push('Alt');
    if (config.shift) parts.push('Shift');
    parts.push(config.key);
    return parts.join(' + ');
  };

  // Group shortcuts by category
  const categories = {
    'Exam Navigation': [],
    'MCQ Option Selection': [],
    'Question Actions': [],
    'Speech-to-Text': [],
    'Text-to-Speech': [],
    'Quick Focus': [],
    'Audio & Speech': [],
    'System': [],
  };

  Object.entries(shortcuts).forEach(([actionName, config]) => {
    const cat = config.category || 'System';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ actionName, ...config });
  });

  const handlePlayAudioTour = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      speakText(AUDIO_SHORTCUTS_TOUR, 'Spoken Shortcuts Audio Guide');
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
        {isSpeaking ? 'Stop Audio Guide' : 'Listen to Spoken Audio Guide (Alt+I)'}
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
      title="KEYBOARD & AUDIO NAVIGATION GUIDE"
      footer={footerActions}
      size="lg"
    >
      <div className="space-y-6 select-none max-h-[60vh] overflow-y-auto pr-1">
        {/* Spoken Audio Guide Banner */}
        <div className="p-3.5 bg-subtle border border-border-strong rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-navy-primary uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Auditory Quick Reference
            </span>
            <p className="text-[11px] text-text-muted">
              Press <kbd className="px-1 py-0.5 font-mono bg-surface border border-border-main rounded text-[10px]">Alt+I</kbd> anywhere to hear the complete spoken walkthrough.
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

        <p className="text-xs text-text-muted leading-relaxed">
          TeioOS is engineered for <strong>zero-tab single-chord navigation</strong>. All shortcuts operate globally and automatically respect descriptive text writing fields.
        </p>

        {Object.entries(categories).map(([catName, list]) => {
          if (!list.length) return null;
          return (
            <section key={catName} aria-labelledby={`cat-${catName.replace(/\s+/g, '-').toLowerCase()}`}>
              <h3
                id={`cat-${catName.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs font-bold text-navy-primary uppercase tracking-wider mb-2.5 pb-1 border-b border-border-main flex items-center gap-2"
              >
                <Command className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{catName}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {list.map((item) => (
                  <div
                    key={item.actionName}
                    className="flex items-center justify-between p-2.5 bg-subtle/50 border border-border-main rounded-lg"
                  >
                    <span className="font-medium text-text-main">{item.label}</span>
                    <kbd className="px-2 py-1 font-mono text-[11px] font-bold bg-surface text-navy-primary border border-border-strong rounded shadow-xs">
                      {formatCombo(item)}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
};

export default ShortcutHelpModal;
