import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const TTSContext = createContext(null);

export const sanitizeSpeechText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<\/?[^>]+(>|$)/g, ' ') // Strip all XML/HTML/SSML tags (<speak>, </speak>, <mark.../>, etc.)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

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

  // Synchronized refs for mutable settings to guarantee a stable speakText reference
  const ttsEnabledRef = useRef(ttsEnabled);
  const ttsSpeedRef = useRef(ttsSpeed);
  const ttsPitchRef = useRef(ttsPitch);
  const ttsVolumeRef = useRef(ttsVolume);
  const ttsVoiceURIRef = useRef(ttsVoiceURI);
  const voicesRef = useRef(voices);
  const isMicActiveRef = useRef(isMicActive);

  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { ttsSpeedRef.current = ttsSpeed; }, [ttsSpeed]);
  useEffect(() => { ttsPitchRef.current = ttsPitch; }, [ttsPitch]);
  useEffect(() => { ttsVolumeRef.current = ttsVolume; }, [ttsVolume]);
  useEffect(() => { ttsVoiceURIRef.current = ttsVoiceURI; }, [ttsVoiceURI]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);

  const lastSpokenTextRef = useRef('');
  const lastSpeakTimeRef = useRef(0);
  const activeUtteranceRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);
  const speakTimeoutRef = useRef(null);

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
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
      if (
        typeof window !== 'undefined' &&
        window.speechSynthesis &&
        window.speechSynthesis.speaking &&
        !window.speechSynthesis.paused
      ) {
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
      const { interrupt = true, force = false } = options;

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSupported(false);
        announceToScreenReader('Text-to-speech engine is not supported in this browser.');
        return;
      }

      if (!text || (typeof text === 'string' && !text.trim())) return;

      const cleanText = sanitizeSpeechText(String(text));
      if (!cleanText) return;

      const now = Date.now();
      // Deduplicate identical speech requests fired within 3000ms to prevent duplicate queuing
      if (!force && cleanText === lastSpokenTextRef.current && (now - lastSpeakTimeRef.current < 3000)) {
        return;
      }
      lastSpokenTextRef.current = cleanText;
      lastSpeakTimeRef.current = now;

      // Mirror output to ARIA live regions for assistive tools
      announceToScreenReader(cleanText);

      // Speech-to-Text Microphone Mutual Exclusion:
      // If the candidate is currently dictating into the microphone, suppress speaker audio
      // to avoid acoustic feedback loops into the mic.
      if (isMicActiveRef.current) {
        return;
      }

      if (!ttsEnabledRef.current) {
        return;
      }

      // Clear any pending queued speak timeout before setting up a new one
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
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
      const safeSpeed = Math.min(Math.max(ttsSpeedRef.current || 1.0, 0.5), 2.0);
      const safePitch = Math.min(Math.max(ttsPitchRef.current || 1.0, 0.8), 1.2);

      utterance.rate = safeSpeed;
      utterance.pitch = safePitch;
      utterance.volume = Math.min(
        Math.max(ttsVolumeRef.current !== undefined ? ttsVolumeRef.current : 1.0, 0.0),
        1.0
      );

      // Select chosen voice or fallback gracefully
      const currentVoices = voicesRef.current;
      const currentVoiceURI = ttsVoiceURIRef.current;

      if (currentVoices && currentVoices.length > 0) {
        let selectedVoice = currentVoiceURI
          ? currentVoices.find((v) => v.voiceURI === currentVoiceURI)
          : null;

        if (!selectedVoice) {
          const naturalVoice = currentVoices.find(
            (v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('espeak')
          );
          selectedVoice =
            naturalVoice ||
            currentVoices.find((v) => v.default && v.lang.startsWith('en')) ||
            currentVoices.find((v) => v.lang.startsWith('en')) ||
            currentVoices[0];
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
      speakTimeoutRef.current = setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak failed:', err);
        }
        speakTimeoutRef.current = null;
      }, 40);
    },
    [startKeepAlive, stopKeepAlive]
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
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
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
      speakText(lastSpokenTextRef.current, 'Repeating last text', { force: true });
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
