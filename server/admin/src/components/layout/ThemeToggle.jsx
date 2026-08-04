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

export const ThemeToggle = ({ className = '', variant = 'icon' }) => {
  const { theme, cycleTheme, setTheme } = useTheme();
  const Icon = THEME_ICONS[theme] || Sun;

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center bg-subtle p-0.5 rounded-lg border border-border-main gap-0.5 ${className}`}
        role="group"
        aria-label="Theme mode selection"
      >
        {[
          { key: THEMES.LIGHT, icon: Sun, label: 'Light' },
          { key: THEMES.DARK, icon: Moon, label: 'Dark' },
          { key: THEMES.HIGH_CONTRAST, icon: Contrast, label: 'Contrast' },
        ].map((item) => {
          const ItemIcon = item.icon;
          const isActive = theme === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTheme(item.key)}
              title={`${item.label} mode`}
              aria-label={`Switch to ${item.label} mode`}
              aria-pressed={isActive}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-surface text-navy-primary shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-surface/50'
              }`}
            >
              <ItemIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Click to switch theme.`}
      title={`Current Theme: ${THEME_LABELS[theme]} (Click to switch)`}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-subtle transition-colors ${className}`}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};

export default ThemeToggle;
