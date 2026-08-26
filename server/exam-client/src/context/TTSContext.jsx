import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const TTSContext = createContext(null);

export const TTSProvider = ({ children }) => {
  const {
    ttsEnabled,
    ttsSpeed,
    ttsPitch,
    ttsVolume,
    ttsVoiceURI,
    voices,
    isMicActive,
  } = useAccessibility();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const lastSpokenTextRef = useRef('');
  const activeUtteranceRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Chrome Web Speech Keepalive: Chromium engines on Linux have a known issue
  // where long speech utterances freeze after ~15s without user interaction.
  // Periodically pulsing pause/resume keeps the audio stream active.
  const startKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }
    keepAliveIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  const speakText = useCallback(
    (text, label = '', options = {}) => {
      const { interrupt = true } = options;

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSupported(false);
        announceToScreenReader('Text-to-speech engine is not supported in this browser.');
        return;
      }

      if (!text || !text.trim()) return;

      const cleanText = text.trim();
      lastSpokenTextRef.current = cleanText;

      // Mirror output to ARIA live regions for assistive tools
      announceToScreenReader(cleanText);

      // Speech-to-Text Microphone Mutual Exclusion:
      // If the candidate is currently dictating into the microphone, suppress speaker audio
      // to avoid acoustic feedback loops into the mic.
      if (isMicActive) {
        return;
      }

      if (!ttsEnabled) {
        return;
      }

      // Interrupt previous speech if requested (default behavior for responsive navigation)
      if (interrupt) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }

      setIsSpeaking(false);
      setIsPaused(false);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Clamp speed and pitch to safe bounds
      const safeSpeed = Math.min(Math.max(ttsSpeed || 1.0, 0.5), 2.0);
      const safePitch = Math.min(Math.max(ttsPitch || 1.0, 0.8), 1.2);

      utterance.rate = safeSpeed;
      utterance.pitch = safePitch;
      utterance.volume = Math.min(Math.max(ttsVolume !== undefined ? ttsVolume : 1.0, 0.0), 1.0);

      // Select chosen voice or fallback gracefully
      if (voices && voices.length > 0) {
        let selectedVoice = ttsVoiceURI ? voices.find((v) => v.voiceURI === ttsVoiceURI) : null;

        if (!selectedVoice) {
          const naturalVoice = voices.find(
            (v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('espeak')
          );
          selectedVoice =
            naturalVoice ||
            voices.find((v) => v.default && v.lang.startsWith('en')) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(cleanText);
        lastSpokenTextRef.current = cleanText;
        startKeepAlive();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') window._activeTTSUtterance = null;
        stopKeepAlive();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('TTS Synthesis error:', e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') window._activeTTSUtterance = null;
        stopKeepAlive();
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      activeUtteranceRef.current = utterance;
      // Retain strong reference on window object to prevent Gecko/V8 garbage collection mid-speech
      if (typeof window !== 'undefined') {
        window._activeTTSUtterance = utterance;
      }

      // Micro-delay prevents browser dropping speak() calls after cancel()
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak failed:', err);
        }
      }, 40);
    },
    [ttsEnabled, ttsSpeed, ttsPitch, ttsVolume, ttsVoiceURI, voices, isMicActive, startKeepAlive, stopKeepAlive]
  );

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        announceToScreenReader('Speech paused');
      }
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        announceToScreenReader('Speech resumed');
      }
    }
  }, []);

  const togglePauseResume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        resumeSpeech();
      } else if (window.speechSynthesis.speaking) {
        pauseSpeech();
      }
    }
  }, [pauseSpeech, resumeSpeech]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      stopKeepAlive();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
      announceToScreenReader('Speech stopped');
    }
  }, [stopKeepAlive]);

  const repeatSpeech = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speakText(lastSpokenTextRef.current, 'Repeating last text');
    } else {
      announceToScreenReader('No previous text to repeat');
    }
  }, [speakText]);

  const value = {
    isSupported,
    isSpeaking,
    isPaused,
    currentText,
    lastSpokenText: lastSpokenTextRef.current,
    speakText,
    pauseSpeech,
    resumeSpeech,
    togglePauseResume,
    stopSpeech,
    repeatSpeech,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
};

export default TTSProvider;
