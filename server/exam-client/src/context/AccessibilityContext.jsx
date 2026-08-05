import React, { createContext, useState, useEffect, useCallback } from 'react';
import { THEMES, STORAGE_KEYS } from '../utils/constants';
import { getItem, setItem } from '../utils/storage';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const AccessibilityContext = createContext(null);

const DEFAULT_SETTINGS = {
  profile: 'default',
  theme: THEMES.DEFAULT,
  fontScale: 100,
  lineHeight: 'normal',
  letterSpacing: 'normal',
  dyslexicFont: false,
  reducedMotion: false,
  ttsEnabled: true,
  ttsSpeed: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 1.0,
  ttsVoiceURI: '',
  sttEnabled: true,
  sttLanguage: 'en-US',
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = getItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS, localStorage);
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voices, setVoices] = useState([]);

  // Fetch browser speech synthesis voices natively
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !settings.ttsVoiceURI) {
        const defaultVoice =
          availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];
        if (defaultVoice) {
          setSettings((prev) => ({ ...prev, ttsVoiceURI: defaultVoice.voiceURI }));
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Apply all accessibility attributes dynamically to root html tag for instant live application (No refresh required)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-font-scale', settings.fontScale);
    root.setAttribute('data-line-height', settings.lineHeight);
    root.setAttribute('data-letter-spacing', settings.letterSpacing);
    root.setAttribute('data-dyslexic-font', settings.dyslexicFont ? 'true' : 'false');
    root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');

    setItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS, settings, localStorage);
  }, [settings]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const toggleModal = useCallback(() => setIsModalOpen((prev) => !prev), []);

  const setTheme = (theme) => {
    setSettings((prev) => ({ ...prev, theme }));
    announceToScreenReader(`Color contrast theme changed to ${theme}`);
  };

  const setFontScale = (fontScale) => {
    setSettings((prev) => ({ ...prev, fontScale: Number(fontScale) }));
    announceToScreenReader(`Font scaling changed to ${fontScale} percent`);
  };

  const setLineHeight = (lineHeight) => {
    setSettings((prev) => ({ ...prev, lineHeight }));
    announceToScreenReader(`Line height spacing set to ${lineHeight}`);
  };

  const setLetterSpacing = (letterSpacing) => {
    setSettings((prev) => ({ ...prev, letterSpacing }));
    announceToScreenReader(`Letter spacing set to ${letterSpacing}`);
  };

  const toggleDyslexicFont = () => {
    setSettings((prev) => {
      const next = !prev.dyslexicFont;
      announceToScreenReader(`Dyslexia friendly font toggled ${next ? 'on' : 'off'}`);
      return { ...prev, dyslexicFont: next };
    });
  };

  const toggleReducedMotion = () => {
    setSettings((prev) => {
      const next = !prev.reducedMotion;
      announceToScreenReader(`Animation reduction toggled ${next ? 'on' : 'off'}`);
      return { ...prev, reducedMotion: next };
    });
  };

  const setTtsSpeed = (speed) => {
    setSettings((prev) => ({ ...prev, ttsSpeed: Number(speed) }));
    announceToScreenReader(`Text to speech reading speed set to ${speed}x`);
  };

  const setTtsPitch = (pitch) => {
    setSettings((prev) => ({ ...prev, ttsPitch: Number(pitch) }));
    announceToScreenReader(`Text to speech pitch set to ${pitch}`);
  };

  const setTtsVolume = (volume) => {
    setSettings((prev) => ({ ...prev, ttsVolume: Number(volume) }));
    announceToScreenReader(`Text to speech volume set to ${Math.round(volume * 100)} percent`);
  };

  const setTtsVoiceURI = (voiceURI) => {
    setSettings((prev) => ({ ...prev, ttsVoiceURI: voiceURI }));
    const selected = voices.find((v) => v.voiceURI === voiceURI);
    announceToScreenReader(`Text to speech voice changed to ${selected?.name || 'default'}`);
  };

  const setSttLanguage = (sttLanguage) => {
    setSettings((prev) => ({ ...prev, sttLanguage }));
    announceToScreenReader(`Speech to text recognition language changed to ${sttLanguage}`);
  };

  const toggleTTS = () => {
    setSettings((prev) => {
      const next = !prev.ttsEnabled;
      announceToScreenReader(`Text to speech voice reader toggled ${next ? 'on' : 'off'}`);
      return { ...prev, ttsEnabled: next };
    });
  };

  const toggleSTT = () => {
    setSettings((prev) => {
      const next = !prev.sttEnabled;
      announceToScreenReader(`Speech to text dictation toggled ${next ? 'on' : 'off'}`);
      return { ...prev, sttEnabled: next };
    });
  };

  const applyProfile = (profileKey) => {
    switch (profileKey) {
      case 'vision':
        setSettings((prev) => ({
          ...prev,
          profile: 'vision',
          theme: THEMES.HIGH_CONTRAST,
          fontScale: 150,
          lineHeight: 'relaxed',
          letterSpacing: 'wide',
          ttsEnabled: true,
        }));
        announceToScreenReader('Applied High Vision Accessibility Profile');
        break;
      case 'motor':
        setSettings((prev) => ({
          ...prev,
          profile: 'motor',
          fontScale: 125,
          reducedMotion: true,
          lineHeight: 'relaxed',
        }));
        announceToScreenReader('Applied Motor Accessibility Profile');
        break;
      case 'cognitive':
        setSettings((prev) => ({
          ...prev,
          profile: 'cognitive',
          dyslexicFont: true,
          fontScale: 110,
          lineHeight: 'loose',
          letterSpacing: 'wide',
        }));
        announceToScreenReader('Applied Cognitive & Dyslexia Accessibility Profile');
        break;
      case 'default':
      default:
        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          profile: 'default',
        }));
        announceToScreenReader('Applied Default Baseline Accessibility Profile');
        break;
    }
  };

  const resetAccessibility = () => {
    setSettings(DEFAULT_SETTINGS);
    announceToScreenReader('Reset all accessibility preferences to factory defaults');
  };

  const value = {
    profile: settings.profile,
    theme: settings.theme,
    fontScale: settings.fontScale,
    lineHeight: settings.lineHeight,
    letterSpacing: settings.letterSpacing,
    dyslexicFont: settings.dyslexicFont,
    reducedMotion: settings.reducedMotion,
    ttsEnabled: settings.ttsEnabled,
    ttsSpeed: settings.ttsSpeed,
    ttsPitch: settings.ttsPitch,
    ttsVolume: settings.ttsVolume,
    ttsVoiceURI: settings.ttsVoiceURI,
    voices,
    sttEnabled: settings.sttEnabled,
    sttLanguage: settings.sttLanguage,
    isModalOpen,
    openModal,
    closeModal,
    toggleModal,
    applyProfile,
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
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
