import { createContext, createElement, useContext, useEffect } from 'react';
import { useStore } from '../store';
import type { ThemePref } from './settings';

const ThemeCtx = createContext<{ theme: ThemePref }>({ theme: 'system' });

function applyTheme(theme: ThemePref) {
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [theme]);

  return createElement(ThemeCtx.Provider, { value: { theme } }, children);
}

export function useTheme() {
  return useContext(ThemeCtx);
}
