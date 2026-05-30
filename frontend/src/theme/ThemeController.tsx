import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { comicTheme } from './comic';
import { inkTheme } from './ink';

export type ThemeName = 'comic' | 'ink';

interface Ctx {
  name: ThemeName;
  setName: (n: ThemeName) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'theme';

function readInitial(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'ink' || stored === 'comic' ? stored : 'comic';
}

const THEMES: Record<ThemeName, Theme> = {
  comic: comicTheme,
  ink: inkTheme,
};

export function ThemeController({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem(STORAGE_KEY, name);
  }, [name]);

  const value = useMemo<Ctx>(() => ({
    name,
    setName,
    toggle: () => setName(n => (n === 'comic' ? 'ink' : 'comic')),
  }), [name]);

  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={THEMES[name]}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}

export function useThemeController(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeController must be used inside ThemeController');
  return ctx;
}
