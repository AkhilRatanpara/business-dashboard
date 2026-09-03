'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('gunatit_theme') as Theme) || 'dark';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('gunatit_theme', newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Safely clears browser dynamic caches & session storage while preserving
 * user theme preference and privacy mode.
 */
export async function clearAppCacheKeepTheme() {
  if (typeof window === 'undefined') return;
  const savedTheme = localStorage.getItem('gunatit_theme') || 'dark';
  const savedPrivacy = localStorage.getItem('gunatit_privacy_mode');

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
  }

  try {
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem('gunatit_theme', savedTheme);
    if (savedPrivacy) localStorage.setItem('gunatit_privacy_mode', savedPrivacy);
  } catch (e) {
    console.warn('Storage clearing error:', e);
  }
}

