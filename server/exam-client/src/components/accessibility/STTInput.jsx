import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Mic, MicOff } from 'lucide-react';

export const STTInput = () => {
  const { sttEnabled, toggleSTT } = useAccessibility();

  return (
    <button
      type="button"
      onClick={toggleSTT}
      aria-label={`Speech to text dictation feature. Currently ${sttEnabled ? 'Active' : 'Inactive'}`}
      title="Dictate response (Speech-to-Text)"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus-visible-ring ${
        sttEnabled
          ? 'bg-red-600 text-white border-red-700 animate-pulse'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 border-gray-300 dark:border-slate-600'
      }`}
    >
      {sttEnabled ? (
        <Mic className="h-4 w-4 text-white" aria-hidden="true" />
      ) : (
        <MicOff className="h-4 w-4" aria-hidden="true" />
      )}
      <span>Dictate {sttEnabled ? 'Listening...' : ''}</span>
    </button>
  );
};
