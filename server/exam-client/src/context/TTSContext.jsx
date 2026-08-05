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

      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);

      if (!text || !text.trim()) return;

      const cleanText = text.trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      utterance.rate = ttsSpeed || 1.0;
      utterance.pitch = ttsPitch || 1.0;
      utterance.volume = ttsVolume !== undefined ? ttsVolume : 1.0;

      if (ttsVoiceURI && voices && voices.length > 0) {
        const selectedVoice = voices.find((v) => v.voiceURI === ttsVoiceURI);
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
      };

      utterance.onerror = (e) => {
        // Canceled errors occur when window.speechSynthesis.cancel() is called intentionally
        if (e.error !== 'canceled') {
          console.warn('TTS Synthesis error:', e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
        activeUtteranceRef.current = null;
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      activeUtteranceRef.current = utterance;

      if (label) {
        announceToScreenReader(`Reading aloud: ${label}`);
      }

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        announceToScreenReader('Speech synthesis failed to play.');
      }
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
