import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { announceToScreenReader } from '../utils/ariaAnnounce';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const STTContext = createContext(null);

export const STTProvider = ({ children }) => {
  const { sttEnabled, sttLanguage } = useAccessibility();

  const [isSupported, setIsSupported] = useState(true);
  const [dictationMode, setDictationMode] = useState('native'); // 'native' | 'audio_recorder'
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const shouldRestartRef = useRef(false);

  // Check browser speech capabilities on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasNative = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
      const hasMediaDevices = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      if (hasNative) {
        setDictationMode('native');
        setIsSupported(true);
      } else if (hasMediaDevices) {
        setDictationMode('audio_recorder');
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  // Cleanup active audio/recognition streams on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const stopAudioRecorderStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  const stopDictation = useCallback(() => {
    shouldRestartRef.current = false;

    if (dictationMode === 'native' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
    } else if (dictationMode === 'audio_recorder' && mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn('MediaRecorder stop error:', err);
      }
      stopAudioRecorderStream();
    }

    setIsListening(false);
    setIsPaused(false);
    setInterimTranscript('');
    announceToScreenReader('Speech to text dictation stopped');
  }, [dictationMode, stopAudioRecorderStream]);

  const pauseDictation = useCallback(() => {
    shouldRestartRef.current = false;

    if (dictationMode === 'native' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition pause error:', err);
      }
    } else if (dictationMode === 'audio_recorder' && mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
        }
      } catch (err) {
        console.warn('MediaRecorder pause error:', err);
      }
    }

    setIsListening(false);
    setIsPaused(true);
    announceToScreenReader('Speech to text dictation paused');
  }, [dictationMode]);

  // Audio Level Meter Analyzer for Web Audio
  const setupAudioMeter = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(Math.round((average / 128) * 100), 100);
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Web Audio meter setup skipped:', e);
    }
  };

  const startDictation = useCallback(
    async (onResultCallback) => {
      if (typeof window === 'undefined') return;

      if (!sttEnabled) {
        setError('Speech to Text is disabled in Accessibility Settings.');
        announceToScreenReader('Speech to Text is disabled in Accessibility Settings.', 'assertive');
        return;
      }

      setError(null);
      if (onResultCallback) {
        onResultCallbackRef.current = onResultCallback;
      }

      // Stop any active TTS reading aloud
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // MODE 1: Native Web Speech API (Edge / Chrome)
      if (SpeechRecognition) {
        setDictationMode('native');
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
          announceToScreenReader(`Native dictation active in ${recognition.lang}. Speak your descriptive response.`);
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
          console.warn('Native SpeechRecognition error:', event.error);
          let errorMsg = 'Speech recognition error occurred.';

          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            errorMsg = 'Microphone permission denied. Please allow microphone access in browser.';
            shouldRestartRef.current = false;
          } else if (event.error === 'no-speech') {
            errorMsg = 'No speech detected. Microphone is listening...';
          } else if (event.error === 'audio-capture') {
            errorMsg = 'No microphone device found on your computer.';
            shouldRestartRef.current = false;
          } else if (event.error === 'network') {
            // Network fallback: Switch to MediaRecorder audio dictation mode
            console.warn('WebSpeech network error. Falling back to Firefox Audio Dictation mode...');
            setDictationMode('audio_recorder');
            startAudioRecorderDictation();
            return;
          }

          setError(errorMsg);
          announceToScreenReader(errorMsg, 'assertive');
        };

        recognition.onend = () => {
          setInterimTranscript('');
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
        return;
      }

      // MODE 2: Web Audio & MediaRecorder Fallback (Firefox & Offline Examination Mode)
      startAudioRecorderDictation();

      async function startAudioRecorderDictation() {
        setDictationMode('audio_recorder');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Speech Recognition and Microphone Media API are unsupported in this browser.');
          announceToScreenReader('Speech Recognition is unsupported in this browser.', 'assertive');
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = stream;
          audioChunksRef.current = [];

          setupAudioMeter(stream);

          const mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : '';

          const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstart = () => {
            setIsListening(true);
            setIsPaused(false);
            shouldRestartRef.current = true;
            announceToScreenReader('Audio speech dictation started. Speak into your microphone.');
          };

          mediaRecorder.onstop = async () => {
            stopAudioRecorderStream();
            setIsListening(false);

            if (audioChunksRef.current.length === 0) return;

            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
            audioChunksRef.current = [];

            // Transcribe captured audio blob via backend STT endpoint
            setIsTranscribing(true);
            announceToScreenReader('Processing speech dictation audio...');

            try {
              const formData = new FormData();
              formData.append('file', audioBlob, 'dictation_speech.webm');
              formData.append('language', sttLanguage || 'en-US');

              const res = await axiosClient.post(API_ENDPOINTS.TRANSCRIBE_SPEECH, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });

              if (res.data?.success && res.data?.data?.text) {
                const transcribedText = res.data.data.text;
                setFinalTranscript((prev) => {
                  const updated = (prev + ' ' + transcribedText).trim();
                  if (onResultCallbackRef.current) {
                    onResultCallbackRef.current({
                      final: transcribedText,
                      interim: '',
                      fullText: updated,
                    });
                  }
                  return updated;
                });
                announceToScreenReader(`Speech transcribed: ${transcribedText}`);
              }
            } catch (err) {
              console.warn('Speech transcription API notice:', err);
              // Graceful fallback notice for offline client
              const fallbackNotice = '[Audio dictation recorded]';
              if (onResultCallbackRef.current) {
                onResultCallbackRef.current({
                  final: fallbackNotice,
                  interim: '',
                  fullText: fallbackNotice,
                });
              }
            } finally {
              setIsTranscribing(false);
            }
          };

          mediaRecorder.start(1000); // Collect slice every 1 sec
        } catch (err) {
          console.error('Microphone access error:', err);
          setError('Microphone permission denied or microphone hardware absent.');
          announceToScreenReader('Microphone access denied.', 'assertive');
          setIsListening(false);
        }
      }
    },
    [sttEnabled, sttLanguage, stopAudioRecorderStream]
  );

  const resumeDictation = useCallback(
    (onResultCallback) => {
      if (dictationMode === 'audio_recorder' && mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        try {
          mediaRecorderRef.current.resume();
          setIsListening(true);
          setIsPaused(false);
          announceToScreenReader('Audio speech dictation resumed.');
          return;
        } catch (e) {
          // ignore
        }
      }
      startDictation(onResultCallback);
    },
    [dictationMode, startDictation]
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

  // Insert recognized transcript at current cursor position in a textarea
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
    dictationMode,
    isListening,
    isPaused,
    isTranscribing,
    audioLevel,
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
