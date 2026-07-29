import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const STTContext = createContext(null);

export const STTProvider = ({ children }) => {
  const { sttEnabled, sttLanguage } = useAccessibility();

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const shouldRestartRef = useRef(false);

  // Check Web Speech Recognition browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      }
    }
  }, []);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const stopDictation = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
    }
    setIsListening(false);
    setIsPaused(false);
    setInterimTranscript('');
    announceToScreenReader('Speech to text dictation stopped');
  }, []);

  const pauseDictation = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition pause error:', err);
      }
    }
    setIsListening(false);
    setIsPaused(true);
    announceToScreenReader('Speech to text dictation paused');
  }, []);

  const startDictation = useCallback(
    (onResultCallback) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech Recognition API is not supported in this browser.');
        announceToScreenReader('Speech Recognition is not supported in this browser.', 'assertive');
        return;
      }

      if (!sttEnabled) {
        setError('Speech to Text is disabled in Accessibility Settings.');
        announceToScreenReader('Speech to Text is disabled in Accessibility Settings.', 'assertive');
        return;
      }

      setError(null);
      if (onResultCallback) {
        onResultCallbackRef.current = onResultCallback;
      }

      // Stop previous instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sttLanguage || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsPaused(false);
        shouldRestartRef.current = true;
        announceToScreenReader(`Dictation active in ${recognition.lang}. Speak your descriptive response.`);
      };

      recognition.onresult = (event) => {
        let interimStr = '';
        let newFinalStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalStr += transcriptText + ' ';
          } else {
            interimStr += transcriptText;
          }
        }

        setInterimTranscript(interimStr);

        if (newFinalStr) {
          setFinalTranscript((prev) => {
            const updated = (prev + ' ' + newFinalStr).trim();
            if (onResultCallbackRef.current) {
              onResultCallbackRef.current({
                final: newFinalStr.trim(),
                interim: interimStr,
                fullText: updated,
              });
            }
            return updated;
          });
        } else if (interimStr && onResultCallbackRef.current) {
          onResultCallbackRef.current({
            final: '',
            interim: interimStr,
            fullText: '',
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        let errorMsg = 'Speech recognition error occurred.';

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
          shouldRestartRef.current = false;
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Microphone is still listening...';
        } else if (event.error === 'audio-capture') {
          errorMsg = 'No microphone device found on your computer.';
          shouldRestartRef.current = false;
        } else if (event.error === 'network') {
          errorMsg = 'Network error during speech recognition.';
        }

        setError(errorMsg);
        announceToScreenReader(errorMsg, 'assertive');
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // Continuous dictation auto-restart if not manually stopped/paused
        if (shouldRestartRef.current) {
          try {
            recognition.start();
          } catch (err) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        setError('Failed to start microphone speech recognition.');
      }
    },
    [sttEnabled, sttLanguage]
  );

  const resumeDictation = useCallback(
    (onResultCallback) => {
      startDictation(onResultCallback);
    },
    [startDictation]
  );

  const toggleDictation = useCallback(
    (onResultCallback) => {
      if (isListening) {
        stopDictation();
      } else {
        startDictation(onResultCallback);
      }
    },
    [isListening, startDictation, stopDictation]
  );

  // Utility to insert recognized transcript at current cursor position in a textarea
  const insertTextAtCursor = useCallback(
    (textareaRef, textToInsert, currentValue, onChange) => {
      if (!textToInsert || !textToInsert.trim()) return;

      const cleanInsert = textToInsert.trim() + ' ';
      const textarea = textareaRef?.current;

      if (textarea && typeof textarea.selectionStart === 'number') {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;

        const val = currentValue || textarea.value || '';
        const newValue = val.substring(0, startPos) + cleanInsert + val.substring(endPos);

        if (onChange) onChange(newValue);

        setTimeout(() => {
          textarea.focus();
          const newCursorPos = startPos + cleanInsert.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // Fallback: Append to end
        const val = currentValue || '';
        const newValue = val ? `${val.trim()} ${cleanInsert}` : cleanInsert;
        if (onChange) onChange(newValue);
      }

      announceToScreenReader('Inserted dictated speech transcript into descriptive answer field');
    },
    []
  );

  const value = {
    isSupported,
    isListening,
    isPaused,
    interimTranscript,
    finalTranscript,
    error,
    startDictation,
    stopDictation,
    pauseDictation,
    resumeDictation,
    toggleDictation,
    insertTextAtCursor,
  };

  return <STTContext.Provider value={value}>{children}</STTContext.Provider>;
};

export default STTProvider;
