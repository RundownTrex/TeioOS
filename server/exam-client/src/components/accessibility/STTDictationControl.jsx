import React from 'react';
import { useSTT } from '../../hooks/useSTT';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Mic, MicOff, Pause, Play, CornerDownLeft, AlertCircle, Loader2, Radio } from 'lucide-react';

export const STTDictationControl = ({ textareaRef, value, onChange, className = '' }) => {
  const { sttEnabled } = useAccessibility();
  const {
    isSupported,
    dictationMode,
    isListening,
    isPaused,
    isTranscribing,
    audioLevel,
    interimTranscript,
    error,
    startDictation,
    stopDictation,
    pauseDictation,
    resumeDictation,
    insertTextAtCursor,
  } = useSTT();

  if (!sttEnabled) return null;

  const handleStart = () => {
    startDictation(({ final }) => {
      if (final && textareaRef) {
        insertTextAtCursor(textareaRef, final, value, onChange);
      }
    });
  };

  const handleToggle = () => {
    if (isListening) {
      stopDictation();
    } else {
      handleStart();
    }
  };

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Speech Recognition Error / Permission Warning */}
      {error && (
        <Alert
          variant="error"
          title="Speech Recognition Alert"
          message={error}
          icon={<AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
        />
      )}

      {/* Browser Support Warning */}
      {!isSupported && (
        <Alert
          variant="warning"
          title="Speech Recognition Unsupported"
          message="Your current browser does not support Web Speech or Audio Media Devices."
        />
      )}

      {isSupported && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-subtle/60 border border-border-main rounded-lg text-xs">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={isListening ? 'danger' : 'primary'}
              size="sm"
              onClick={handleToggle}
              disabled={isTranscribing}
              leftIcon={
                isTranscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : isListening ? (
                  <MicOff className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                )
              }
              ariaLabel={`Speech-to-Text dictation. Status: ${isListening ? 'Listening' : 'Inactive'}. Press Alt+D to toggle`}
            >
              <span>
                {isTranscribing
                  ? 'Transcribing Audio...'
                  : isListening
                  ? 'Stop Dictation'
                  : 'Start Speech Dictation'}
              </span>
              <kbd className="hidden sm:inline-block ml-1.5 text-[10px] font-mono opacity-80">Alt+D</kbd>
            </Button>

            {isListening && (
              <Button
                variant="secondary"
                size="sm"
                onClick={pauseDictation}
                leftIcon={<Pause className="w-3 h-3" aria-hidden="true" />}
              >
                Pause
              </Button>
            )}

            {isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resumeDictation(handleStart)}
                leftIcon={<Play className="w-3 h-3 text-navy-primary" aria-hidden="true" />}
              >
                Resume
              </Button>
            )}
          </div>

          {/* Right Status Badge & Mic Volume Level Indicator */}
          <div className="flex items-center gap-3">
            {/* Real-time Mic Level Indicator for Audio Dictation Mode */}
            {isListening && dictationMode === 'audio_recorder' && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-text-muted" title="Microphone Input Volume Level">
                <Radio className="w-3 h-3 text-red-600 animate-pulse" aria-hidden="true" />
                <div className="w-12 h-2 bg-surface rounded-full overflow-hidden border border-border-main">
                  <div
                    className="h-full bg-red-600 transition-all duration-75"
                    style={{ width: `${Math.max(audioLevel, 5)}%` }}
                  />
                </div>
              </div>
            )}

            <span
              aria-live="polite"
              aria-atomic="true"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                isListening
                  ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                  : isPaused
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-surface text-text-muted border border-border-main'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-red-600' : isPaused ? 'bg-amber-600' : 'bg-text-muted'
                }`}
                aria-hidden="true"
              />
              <span>
                {isTranscribing
                  ? 'PROCESSING AUDIO'
                  : isListening
                  ? dictationMode === 'audio_recorder'
                    ? 'MIC RECORDING (FIREFOX)'
                    : 'LISTENING (MIC ON)'
                  : isPaused
                  ? 'DICTATION PAUSED'
                  : 'DICTATION OFF'}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Guidance Note */}
      {isListening && (
        <p className="text-[11px] text-text-muted italic px-1">
          Tip: Use headphones or lower speaker volume to prevent microphone feedback from text-to-speech reading.
        </p>
      )}

      {/* Live Interim Transcript Preview Banner */}
      {interimTranscript && (
        <div className="p-2.5 bg-navy-primary/5 border border-navy-primary/30 rounded-lg text-xs flex items-start gap-2 animate-fadeIn">
          <CornerDownLeft className="w-3.5 h-3.5 text-navy-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <span className="font-bold text-navy-primary block text-[10px] uppercase tracking-wider mb-0.5">
              Live Speech Dictation Preview:
            </span>
            <span className="font-mono text-text-main italic">{interimTranscript}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default STTDictationControl;
