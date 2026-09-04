'use client';

import { Lock, Search, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface HeaderProps {
  onLock: () => void;
}

export function Header({ onLock }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-3 md:px-6 h-[48px] md:h-[52px] flex items-center transition-colors shadow-2xs">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Mobile Brand Title */}
        <Link href="/" className="flex items-center gap-2 md:hidden min-w-0 shrink">
          <div className="shrink-0 flex items-center justify-center">
            <BrandLogo size={34} />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate">
              Gunatit Submersible
            </h1>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase truncate">
              Price Book
            </p>
          </div>
        </Link>

        {/* Desktop Quick Search Link */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
          <Link
            href="/items"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all text-xs"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search items, codes, brands...</span>
            <kbd className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* Database Status, Theme Toggle & Security Lock Button */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title={theme === 'dark' ? 'Switch to White Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Neon DB Live</span>
          </div>

          <button
            onClick={onLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
}
