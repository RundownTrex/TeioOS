import React from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { THEMES } from '../../utils/constants';

const THEME_ICONS = {
  [THEMES.LIGHT]: Sun,
  [THEMES.DARK]: Moon,
  [THEMES.HIGH_CONTRAST]: Contrast,
};

const THEME_LABELS = {
  [THEMES.LIGHT]: 'Light',
  [THEMES.DARK]: 'Dark',
  [THEMES.HIGH_CONTRAST]: 'High Contrast',
};

export const ThemeToggle = ({ className = '' }) => {
  const { theme, cycleTheme } = useTheme();
  const Icon = THEME_ICONS[theme] || Sun;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Click to switch theme.`}
      title={`Theme: ${THEME_LABELS[theme]}`}
      className={`p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-subtle transition-colors ${className}`}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};

export default ThemeToggle;
