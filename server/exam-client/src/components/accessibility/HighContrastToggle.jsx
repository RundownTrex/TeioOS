import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { THEMES } from '../../utils/constants';
import { Contrast } from 'lucide-react';

export const HighContrastToggle = () => {
  const { theme, setTheme } = useAccessibility();
  const isHighContrast = theme === THEMES.HIGH_CONTRAST;

  const handleToggle = () => {
    setTheme(isHighContrast ? THEMES.DEFAULT : THEMES.HIGH_CONTRAST);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Toggle high contrast mode. Currently ${isHighContrast ? 'Enabled' : 'Disabled'}`}
      aria-pressed={isHighContrast}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus-visible-ring ${
        isHighContrast
          ? 'bg-yellow-400 text-black border-white font-bold'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 border-gray-300 dark:border-slate-600'
      }`}
    >
      <Contrast className="h-4 w-4" aria-hidden="true" />
      <span>High Contrast</span>
    </button>
  );
};
