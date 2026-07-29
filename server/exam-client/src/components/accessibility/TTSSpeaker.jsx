import React from 'react';
import { useTTS } from '../../hooks/useTTS';
import { Volume2, Square } from 'lucide-react';

export const TTSSpeaker = ({ textToRead, label = 'Read Question' }) => {
  const { isSpeaking, speakText, stopSpeech } = useTTS();

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      stopSpeech();
    } else if (textToRead) {
      speakText(textToRead, label);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSpeechToggle}
      aria-label={`${label}. Text to speech status: ${isSpeaking ? 'Currently reading aloud' : 'Click to read aloud'}`}
      title={`${label} (Text-to-Speech)`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-normal select-none ${
        isSpeaking
          ? 'bg-navy-primary text-text-inverse border-navy-primary shadow-xs'
          : 'bg-surface hover:bg-subtle text-text-main border-border-main'
      }`}
    >
      {isSpeaking ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current text-white shrink-0" aria-hidden="true" />
          <span>Stop Reading</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-navy-primary shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default TTSSpeaker;
