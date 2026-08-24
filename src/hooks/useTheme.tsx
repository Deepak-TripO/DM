import { useState, createContext, useContext, useCallback, type ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('dm-theme');
    return (stored as 'light' | 'dark' | 'system') || 'system';
  });

  const resolved = resolveTheme(theme);

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('dm-theme', newTheme);
    const r = resolveTheme(newTheme);
    document.documentElement.classList.toggle('dark', r === 'dark');
  }, []);

  // Apply on mount
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
