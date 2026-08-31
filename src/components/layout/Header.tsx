'use client';

import { Lock, Wrench, Search, Sun, Moon, Eye, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthContext';

interface HeaderProps {
  onLock: () => void;
}

export function Header({ onLock }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isViewer, isEditor } = useAuth();

  return (
    <header className="w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-3 md:px-6 h-[48px] md:h-[52px] flex items-center transition-colors shadow-2xs">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Mobile Brand Title */}
        <div className="flex items-center gap-2.5 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Wrench className="w-4 h-4 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              GUNATIT SUBMERSIBLE
            </h1>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase">
              {isViewer ? 'Viewer Mode' : 'Price Book'}
            </p>
          </div>
        </div>

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

        {/* Role Badge, Theme Toggle & Security Lock Button */}
        <div className="flex items-center gap-2">
          {/* Active Role Indicator Badge */}
          {isViewer ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Viewer</span>
              <span className="text-[10px] px-1 rounded bg-cyan-100 dark:bg-cyan-950 font-mono">READ ONLY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editor</span>
              <span className="text-[10px] px-1 rounded bg-emerald-100 dark:bg-emerald-950 font-mono">FULL ACCESS</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
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

          <button
            onClick={onLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Lock & Switch Account"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
}
