import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveEffective(theme) {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('dari_theme') || 'system');
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolveEffective(localStorage.getItem('dari_theme') || 'system'));

  useEffect(() => {
    const apply = (t) => {
      const effective = resolveEffective(t);
      setEffectiveTheme(effective);
      document.documentElement.classList.toggle('dark', effective === 'dark');
    };

    apply(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const changeTheme = (t) => {
    localStorage.setItem('dari_theme', t);
    setTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}