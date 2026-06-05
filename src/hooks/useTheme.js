import { useState, useEffect, useCallback } from 'react';
import {
  THEME_STORAGE_KEY,
  getSystemTheme,
  initTheme,
  setThemePreference,
} from '../utils/theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => initTheme());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = () => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        const systemTheme = getSystemTheme();
        setThemePreference(systemTheme);
        setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setThemeAndPersist = useCallback((nextTheme) => {
    setThemePreference(nextTheme);
    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeAndPersist(nextTheme);
    return nextTheme;
  }, [theme, setThemeAndPersist]);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme: setThemeAndPersist,
    toggleTheme,
  };
}
