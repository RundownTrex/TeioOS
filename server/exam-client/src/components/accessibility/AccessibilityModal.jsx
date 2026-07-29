import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTTS } from '../../hooks/useTTS';
import { useShortcuts } from '../../hooks/useShortcuts';
import { Modal } from '../ui/Modal';
import { RadioGroup } from '../ui/RadioGroup';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Divider } from '../ui/Divider';
import { Select } from '../ui/Select';
import {
  Volume2,
  Mic,
  Type,
  Sun,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Keyboard,
  ZapOff,
} from 'lucide-react';

export const AccessibilityModal = () => {
  const {
    isModalOpen,
    closeModal,
    theme,
    fontScale,
    lineHeight,
    letterSpacing,
    dyslexicFont,
    reducedMotion,
    ttsEnabled,
    ttsSpeed,
    ttsPitch,
    ttsVolume,
    ttsVoiceURI,
    voices,
    sttEnabled,
    sttLanguage,
    setTheme,
    setFontScale,
    setLineHeight,
    setLetterSpacing,
    toggleDyslexicFont,
    toggleReducedMotion,
    setTtsSpeed,
    setTtsPitch,
    setTtsVolume,
    setTtsVoiceURI,
    setSttLanguage,
    toggleTTS,
    toggleSTT,
    resetAccessibility,
  } = useAccessibility();

  const { isSpeaking, isPaused, speakText, pauseSpeech, resumeSpeech, stopSpeech, repeatSpeech } =
    useTTS();

  const { openHelp } = useShortcuts();

  const fontOptions = [
    { value: '100', label: '100% Standard', description: 'Default baseline typography size' },
    { value: '125', label: '125% Medium', description: 'Recommended for mild visual fatigue' },
    { value: '150', label: '150% Large', description: 'Enhanced legibility and spacing' },
    { value: '175', label: '175% Extra Large', description: 'High visibility font scaling' },
    { value: '200', label: '200% Maximum', description: 'Maximum WCAG AA scaling' },
  ];

  const lineHeightOptions = [
    { value: 'normal', label: '1.5x Standard', description: 'Default line spacing' },
    { value: 'relaxed', label: '1.75x Relaxed', description: 'Increased vertical reading space' },
    { value: 'loose', label: '2.0x Loose', description: 'Maximum vertical line separation' },
  ];

  const letterSpacingOptions = [
    { value: 'normal', label: 'Normal Spacing', description: 'Standard character tracking' },
    { value: 'wide', label: 'Wide (+0.05em)', description: 'Slightly expanded character gaps' },
    { value: 'wider', label: 'Wider (+0.1em)', description: 'Maximum character tracking' },
  ];

  const themeOptions = [
    { value: 'default', label: 'Standard Light Mode', description: 'Calm academic paper canvas (#F8FAF9)' },
    { value: 'dark', label: 'Dark Mode', description: 'Reduced glare for dark environments' },
    { value: 'high-contrast', label: 'High Contrast Dark', description: 'WCAG AAA black canvas (#000000) & yellow highlights' },
  ];

  const sttLangOptions = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'en-IN', label: 'English (India)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'de-DE', label: 'German (Germany)' },
  ];

  const voiceSelectOptions = voices.map((v) => ({
    value: v.voiceURI,
    label: `${v.name} (${v.lang})`,
  }));

  const handleTestVoice = () => {
    speakText(
      'TeioOS text-to-speech test announcement. Web Speech API engine working correctly.',
      'Voice Test Sample'
    );
  };

  const handleOpenHelpFromModal = () => {
    closeModal();
    openHelp();
  };

  const footerActions = (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={resetAccessibility}
        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
      >
        Reset Defaults
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenHelpFromModal}
          leftIcon={<Keyboard className="w-3.5 h-3.5" />}
        >
          Shortcuts (Alt+H)
        </Button>
        <Button variant="primary" size="md" onClick={closeModal}>
          Apply & Return
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="ACCESSIBILITY PREFERENCES"
      footer={footerActions}
      size="lg"
    >
      <div className="space-y-6 select-none max-h-[70vh] overflow-y-auto pr-1">
        {/* 1. Font Size Scaling */}
        <section aria-labelledby="font-scale-heading">
          <div className="flex items-center gap-2 mb-3 text-navy-primary font-bold text-sm uppercase tracking-wider">
            <Type className="w-4 h-4" aria-hidden="true" />
            <h3 id="font-scale-heading">Font Size Scaling</h3>
          </div>
          <RadioGroup
            name="fontScale"
            options={fontOptions}
            value={String(fontScale)}
            onChange={(val) => setFontScale(Number(val))}
          />
        </section>

        <Divider />

        {/* 2. Line Height & Letter Spacing */}
        <section aria-labelledby="spacing-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-navy-primary font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <h3 id="spacing-heading">Typography Spacing & Legibility</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-text-main uppercase tracking-wider mb-2 block">
                Line Height (Vertical):
              </span>
              <RadioGroup
                name="lineHeight"
                options={lineHeightOptions}
                value={lineHeight}
                onChange={(val) => setLineHeight(val)}
              />
            </div>

            <div>
              <span className="text-xs font-bold text-text-main uppercase tracking-wider mb-2 block">
                Letter Spacing (Tracking):
              </span>
              <RadioGroup
                name="letterSpacing"
                options={letterSpacingOptions}
                value={letterSpacing}
                onChange={(val) => setLetterSpacing(val)}
              />
            </div>
          </div>

          {/* Dyslexia Friendly Font Switch */}
          <div className="p-3.5 border border-border-main bg-subtle/50 rounded-lg mt-3">
            <Switch
              id="dyslexic-font-switch"
              label="Enable Dyslexia-Friendly Font (Lexend / High Legibility)"
              checked={dyslexicFont}
              onChange={toggleDyslexicFont}
            />
          </div>
        </section>

        <Divider />

        {/* 3. Color Contrast Theme & Motion */}
        <section aria-labelledby="theme-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-navy-primary font-bold text-sm uppercase tracking-wider">
            <Sun className="w-4 h-4" aria-hidden="true" />
            <h3 id="theme-heading">Color Contrast & Motion Preferences</h3>
          </div>

          <RadioGroup
            name="theme"
            options={themeOptions}
            value={theme}
            onChange={(val) => setTheme(val)}
          />

          <div className="p-3.5 border border-border-main bg-subtle/50 rounded-lg">
            <Switch
              id="reduced-motion-switch"
              label="Reduce Animations & Motion (Disable Smooth Transitions)"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
            />
          </div>
        </section>

        <Divider />

        {/* 4. Text-to-Speech (TTS) Browser Engine Preferences */}
        <section aria-labelledby="tts-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-navy-primary font-bold text-sm uppercase tracking-wider">
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <h3 id="tts-heading">Text-to-Speech (TTS) Voice Engine</h3>
          </div>

          <div className="p-4 border border-border-main bg-subtle/50 rounded-lg space-y-4">
            <Switch
              id="tts-enable-switch"
              label="Enable Screen Voice Reader (TTS)"
              checked={ttsEnabled}
              onChange={toggleTTS}
            />

            {ttsEnabled && (
              <div className="space-y-4 pt-3 border-t border-border-main text-xs">
                {/* Voice Selection */}
                {voices.length > 0 && (
                  <Select
                    id="tts-voice-select"
                    name="ttsVoice"
                    label="Voice Selection"
                    options={voiceSelectOptions}
                    value={ttsVoiceURI}
                    onChange={(e) => setTtsVoiceURI(e.target.value)}
                  />
                )}

                {/* Speed Slider */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="tts-speed-slider"
                    className="font-semibold text-text-main flex items-center justify-between"
                  >
                    <span>Speaking Speed (Rate):</span>
                    <span className="font-mono text-navy-primary">{ttsSpeed.toFixed(1)}x</span>
                  </label>
                  <input
                    id="tts-speed-slider"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none"
                  />
                </div>

                {/* Pitch Slider */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="tts-pitch-slider"
                    className="font-semibold text-text-main flex items-center justify-between"
                  >
                    <span>Voice Pitch:</span>
                    <span className="font-mono text-navy-primary">{ttsPitch.toFixed(1)}</span>
                  </label>
                  <input
                    id="tts-pitch-slider"
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none"
                  />
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="tts-volume-slider"
                    className="font-semibold text-text-main flex items-center justify-between"
                  >
                    <span>Volume Level:</span>
                    <span className="font-mono text-navy-primary">{Math.round(ttsVolume * 100)}%</span>
                  </label>
                  <input
                    id="tts-volume-slider"
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={ttsVolume}
                    onChange={(e) => setTtsVolume(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none"
                  />
                </div>

                {/* Live Controls Panel */}
                <div className="pt-3 border-t border-border-main space-y-2">
                  <span className="font-bold text-text-main uppercase tracking-wider block text-[11px]">
                    Speech Engine Live Controls:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestVoice}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                    >
                      Test Voice
                    </Button>

                    {isSpeaking && !isPaused && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={pauseSpeech}
                        leftIcon={<Pause className="w-3.5 h-3.5" />}
                      >
                        Pause (Alt+K)
                      </Button>
                    )}

                    {isPaused && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={resumeSpeech}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Resume (Alt+K)
                      </Button>
                    )}

                    {isSpeaking && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={stopSpeech}
                        leftIcon={<Square className="w-3.5 h-3.5" />}
                      >
                        Stop (Alt+X)
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={repeatSpeech}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Repeat (Alt+E)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Divider />

        {/* 5. Speech-to-Text (STT) Preferences (Descriptive Questions Only) */}
        <section aria-labelledby="stt-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-navy-primary font-bold text-sm uppercase tracking-wider">
            <Mic className="w-4 h-4" aria-hidden="true" />
            <h3 id="stt-heading">Speech-to-Text (STT) Voice Dictation</h3>
          </div>

          <div className="p-4 border border-border-main bg-subtle/50 rounded-lg space-y-4">
            <Switch
              id="stt-enable-switch"
              label="Enable Speech Dictation (Descriptive Answers Only)"
              checked={sttEnabled}
              onChange={toggleSTT}
            />

            {sttEnabled && (
              <div className="space-y-3 pt-3 border-t border-border-main text-xs">
                <Select
                  id="stt-lang-select"
                  name="sttLanguage"
                  label="Recognition Language"
                  options={sttLangOptions}
                  value={sttLanguage}
                  onChange={(e) => setSttLanguage(e.target.value)}
                />
                <p className="text-[11px] text-text-muted">
                  Note: Speech-to-Text dictation operates exclusively for descriptive essay questions and will not activate for multiple-choice (MCQ) answers.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default AccessibilityModal;
