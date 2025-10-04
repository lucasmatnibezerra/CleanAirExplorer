import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const DarkModeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(getInitialTheme);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar modo de cor"
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
};
