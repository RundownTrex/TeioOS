import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const TTSContext = createContext(null);

export const TTSProvider = ({ children }) => {
  const { ttsEnabled, ttsSpeed, ttsPitch, ttsVolume, ttsVoiceURI, voices } = useAccessibility();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const lastSpokenTextRef = useRef('');
  const activeUtteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = useCallback(
    (text, label = '') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSupported(false);
        announceToScreenReader('Text-to-speech engine is not supported in this browser.');
        return;
      }

      if (!ttsEnabled) {
        announceToScreenReader('Text-to-speech is currently disabled in accessibility settings.');
        return;
      }

      // Cancel ongoing synthesis cleanly
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }

      setIsSpeaking(false);
      setIsPaused(false);

      if (!text || !text.trim()) return;

      const cleanText = text.trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Clamp speed and pitch to safe bounds to avoid Linux system voice distortion in Firefox
      const safeSpeed = Math.min(Math.max(ttsSpeed || 1.0, 0.5), 2.0);
      const safePitch = Math.min(Math.max(ttsPitch || 1.0, 0.8), 1.2);

      utterance.rate = safeSpeed;
      utterance.pitch = safePitch;
      utterance.volume = Math.min(Math.max(ttsVolume !== undefined ? ttsVolume : 1.0, 0.0), 1.0);

      // Smart voice resolution fallback for Firefox & cross-browser compatibility
      if (voices && voices.length > 0) {
        let selectedVoice = ttsVoiceURI ? voices.find((v) => v.voiceURI === ttsVoiceURI) : null;

        if (!selectedVoice) {
          selectedVoice =
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
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') window._activeTTSUtterance = null;
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
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      activeUtteranceRef.current = utterance;
      // Retain strong reference on window object to prevent Firefox Gecko garbage-collecting utterance mid-speech
      if (typeof window !== 'undefined') {
        window._activeTTSUtterance = utterance;
      }

      if (label) {
        announceToScreenReader(`Reading aloud: ${label}`);
      }

      // Micro-delay after cancel() prevents Firefox Gecko engine dropping speak() calls
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak failed:', err);
          announceToScreenReader('Speech synthesis failed to play.');
        }
      }, 50);
    },
    [ttsEnabled, ttsSpeed, ttsPitch, ttsVolume, ttsVoiceURI, voices]
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
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
      announceToScreenReader('Speech stopped');
    }
  }, []);

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
