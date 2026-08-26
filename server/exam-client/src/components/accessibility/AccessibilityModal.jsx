import React, { useState } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTTS } from '../../hooks/useTTS';
import { useShortcuts } from '../../hooks/useShortcuts';
import { Modal } from '../ui/Modal';
import { Tabs, TabList, Tab, TabPanel } from '../ui/Tabs';
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
  ShieldCheck,
  Eye,
} from 'lucide-react';

export const AccessibilityModal = () => {
  const {
    isModalOpen,
    closeModal,
    profile,
    screenReaderMode,
    applyProfile,
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
    toggleScreenReaderMode,
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
  const [activeTab, setActiveTab] = useState('profiles');

  const profileOptions = [
    { value: 'default', label: 'Default Baseline', description: 'Standard academic light theme and normal typography' },
    { value: 'screenreader', label: 'Full Audio / Blind Candidate Profile', description: 'Engineered for blind candidates. In-browser spoken audio narrator for all screens, questions, options, and actions with High Contrast AAA theme' },
    { value: 'vision', label: 'High Vision Profile', description: 'WCAG AAA High Contrast dark, 150% font scale & wide spacing' },
    { value: 'motor', label: 'Motor Accessibility Profile', description: '125% font scale, relaxed spacing & reduced animations' },
    { value: 'cognitive', label: 'Cognitive & Dyslexia Profile', description: 'Lexend legibility font, loose 2.0x line height & wide tracking' },
  ];

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
    { value: 'high-contrast', label: 'High Contrast Dark (WCAG AAA)', description: 'True black canvas (#000000) & yellow highlights' },
  ];

  const sttLangOptions = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'en-IN', label: 'English (India)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'de-DE', label: 'German (Germany)' },
  ];

  const voiceSelectOptions = voices.map((v) => {
    let cleanName = v.name;
    if (cleanName.toLowerCase().startsWith('espeak-')) {
      cleanName = `eSpeak ${cleanName.replace('espeak-', '').toUpperCase()}`;
    }
    return {
      value: v.voiceURI,
      label: `${cleanName} (${v.lang})`,
    };
  });

  const handleTestVoice = () => {
    speakText(
      'TeioOS text-to-speech voice verification. Speech engine is operating correctly.',
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
          Apply & Close (Esc)
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
      <Tabs defaultValue={activeTab} value={activeTab} onChange={setActiveTab}>
        {/* Category Navigation Tabs */}
        <TabList ariaLabel="Accessibility preference categories">
          <Tab value="profiles" icon={Sparkles}>Profiles</Tab>
          <Tab value="display" icon={Type}>Display</Tab>
          <Tab value="speech" icon={Volume2}>Speech & Audio</Tab>
          <Tab value="dictation" icon={Mic}>Dictation</Tab>
        </TabList>

        {/* ── TAB 1: PRESET PROFILES ── */}
        <TabPanel value="profiles" className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-navy-primary uppercase tracking-wide mb-1">
              One-Click Accessibility Profiles
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Select a preset designed for your specific assistive requirements, or customize individual settings in the other tabs.
            </p>
          </div>

          <RadioGroup
            name="accessibilityProfile"
            options={profileOptions}
            value={profile || 'default'}
            onChange={(val) => applyProfile(val)}
          />

          <div className="p-3.5 bg-subtle/50 border border-border-main rounded-lg flex items-start gap-2.5 text-xs text-text-main">
            <ShieldCheck className="w-4 h-4 text-navy-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Applying a profile instantly updates all contrast, typography, and speech engine settings across the examination client without reloading the page.
            </p>
          </div>
        </TabPanel>

        {/* ── TAB 2: DISPLAY & TYPOGRAPHY ── */}
        <TabPanel value="display" className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Theme selection */}
          <section aria-labelledby="theme-heading" className="space-y-3">
            <div className="flex items-center gap-2 text-navy-primary font-bold text-xs uppercase tracking-wider">
              <Sun className="w-4 h-4" aria-hidden="true" />
              <h3 id="theme-heading">Color Contrast Theme</h3>
            </div>
            <RadioGroup
              name="theme"
              options={themeOptions}
              value={theme}
              onChange={(val) => setTheme(val)}
            />
          </section>

          <Divider />

          {/* Font Scaling */}
          <section aria-labelledby="font-scale-heading" className="space-y-3">
            <div className="flex items-center gap-2 text-navy-primary font-bold text-xs uppercase tracking-wider">
              <Eye className="w-4 h-4" aria-hidden="true" />
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

          {/* Spacing & Legibility */}
          <section aria-labelledby="spacing-heading" className="space-y-3">
            <div className="flex items-center gap-2 text-navy-primary font-bold text-xs uppercase tracking-wider">
              <Type className="w-4 h-4" aria-hidden="true" />
              <h3 id="spacing-heading">Typography Spacing & Dyslexia Support</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-text-main uppercase tracking-wider mb-1.5 block">
                  Line Spacing (Vertical):
                </span>
                <RadioGroup
                  name="lineHeight"
                  options={lineHeightOptions}
                  value={lineHeight}
                  onChange={(val) => setLineHeight(val)}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-text-main uppercase tracking-wider mb-1.5 block">
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

            <div className="p-3 border border-border-main bg-subtle/40 rounded-lg space-y-2 mt-2">
              <Switch
                id="dyslexic-font-switch"
                label="Dyslexia-Friendly Font (Lexend / High Legibility)"
                checked={dyslexicFont}
                onChange={toggleDyslexicFont}
              />
              <Switch
                id="reduced-motion-switch"
                label="Reduce Motion & Disable Animations"
                checked={reducedMotion}
                onChange={toggleReducedMotion}
              />
            </div>
          </section>
        </TabPanel>

        {/* ── TAB 3: SPEECH & AUDIO ── */}
        <TabPanel value="speech" className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Audio Navigation Banner */}
          <div className="p-3.5 bg-surface border border-border-strong rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-primary uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                In-Browser Audio Narrator
              </span>
            </div>
            <Switch
              id="tts-enable-switch"
              label="Enable In-Browser Voice Reader (Web Speech TTS)"
              checked={ttsEnabled}
              onChange={toggleTTS}
            />
            <p className="text-[11px] text-text-muted leading-relaxed">
              Provides complete spoken audio feedback for blind and low-vision candidates, reading questions, options, orientation guides, and real-time exam notifications.
            </p>
          </div>

          {/* In-browser TTS settings */}
          {ttsEnabled && (
            <div className="p-4 border border-border-main bg-subtle/40 rounded-xl space-y-4">
              <div className="space-y-4 text-xs">
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
                    aria-valuemin={0.5}
                    aria-valuemax={2.0}
                    aria-valuenow={ttsSpeed}
                    aria-valuetext={`${ttsSpeed.toFixed(1)} times normal speed`}
                    onChange={(e) => setTtsSpeed(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 rounded-sm"
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
                    aria-valuemin={0.5}
                    aria-valuemax={1.5}
                    aria-valuenow={ttsPitch}
                    aria-valuetext={`Pitch level ${ttsPitch.toFixed(1)}`}
                    onChange={(e) => setTtsPitch(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 rounded-sm"
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
                    aria-valuemin={0.0}
                    aria-valuemax={1.0}
                    aria-valuenow={ttsVolume}
                    aria-valuetext={`Volume ${Math.round(ttsVolume * 100)} percent`}
                    onChange={(e) => setTtsVolume(e.target.value)}
                    className="w-full accent-navy-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-1 rounded-sm"
                  />
                </div>

                {/* Live Controls */}
                <div className="pt-3 border-t border-border-main space-y-2">
                  <span className="font-bold text-text-main uppercase tracking-wider block text-[11px]">
                    Live Voice Controls:
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
            </div>
          )}
        </TabPanel>

        {/* ── TAB 4: SPEECH DICTATION (STT) ── */}
        <TabPanel value="dictation" className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-navy-primary uppercase tracking-wide mb-1">
              Speech-to-Text Voice Dictation
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Dictate answers hands-free for descriptive essay questions.
            </p>
          </div>

          <div className="p-4 border border-border-main bg-subtle/50 rounded-xl space-y-4">
            <Switch
              id="stt-enable-switch"
              label="Enable Speech Dictation (Descriptive Questions Only)"
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
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Speech-to-Text operates exclusively for descriptive essay questions (hotkey <kbd className="px-1 py-0.5 font-mono bg-surface border border-border-main rounded text-[10px]">Alt+D</kbd>). When active, microphone audio is transcribed directly into the active text area.
                </p>
              </div>
            )}
          </div>
        </TabPanel>
      </Tabs>
    </Modal>
  );
};

export default AccessibilityModal;
