import React, { createContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, THEMES, THEME_CYCLE } from '../utils/constants';
import { getItem, setItem } from '../utils/storage';

export const ThemeContext = createContext(null);

const isValidTheme = (value) => THEME_CYCLE.includes(value);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const stored = getItem(STORAGE_KEYS.THEME, sessionStorage);
    return isValidTheme(stored) ? stored : THEMES.LIGHT;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setItem(STORAGE_KEYS.THEME, theme, sessionStorage);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    if (isValidTheme(nextTheme)) setThemeState(nextTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const index = THEME_CYCLE.indexOf(current);
      return THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
    });
  }, []);

  const value = { theme, setTheme, cycleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
