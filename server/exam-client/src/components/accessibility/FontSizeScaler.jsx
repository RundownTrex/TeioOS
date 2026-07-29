import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { FONT_SCALES } from '../../utils/constants';

export const FontSizeScaler = () => {
  const { fontScale, setFontScale } = useAccessibility();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg border border-gray-300 dark:border-slate-600">
      <span className="text-xs font-semibold px-2 text-gray-700 dark:text-slate-200">Text Size:</span>
      {FONT_SCALES.map((scale) => (
        <button
          key={scale}
          type="button"
          onClick={() => setFontScale(scale)}
          aria-label={`Set text size to ${scale} percent`}
          aria-pressed={fontScale === scale}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors focus-visible-ring ${
            fontScale === scale
              ? 'bg-blue-600 text-white font-bold'
              : 'text-gray-700 hover:bg-gray-200 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {scale}%
        </button>
      ))}
    </div>
  );
};
