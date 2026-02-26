// contexts/ThemeContext.tsx
// Manages dark/light mode across the entire app
//
// HOW IT WORKS:
//   - Reads saved preference from localStorage on load
//   - Applies 'dark' class to <html> element
//   - Tailwind's dark: variants activate when .dark is on <html>
//   - Saves preference so it persists after page refresh

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read saved theme from localStorage, default to 'light'
  const [theme, setTheme] = useState<Theme>('light');

  // On mount: check localStorage for saved preference
  useEffect(() => {
    const saved = localStorage.getItem('aura_theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Priority: saved preference → system preference → light
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Apply theme by adding/removing .dark class on <html>
  // Tailwind watches for this class to activate dark: variants
  const applyTheme = (t: Theme) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('aura_theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}