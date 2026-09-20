import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuthStore();

  return (
    <button
      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-all"
      onClick={toggleTheme}
      title="Toggle Color Theme"
    >
      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
};
