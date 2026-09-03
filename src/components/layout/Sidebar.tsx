'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, History, Settings, PlusCircle, Lock, Sun, Moon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import { BrandLogo } from '@/components/ui/BrandLogo';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Items (Price Book)', href: '/items', icon: Package },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Price History', href: '/price-history', icon: History },
  { name: 'Activity & Recovery', href: '/history', icon: RotateCcw },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ onLock }: { onLock: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-xl h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size={42} />
          <div>
            <h1 className="font-black text-base text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Gunatit
            </h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase">
              Submersible
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 py-4">
        <Link
          href="/items/new"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add New Item</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all group',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher & Lock Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono">
            {theme === 'dark' ? 'WHITE' : 'DARK'}
          </span>
        </button>

        <button
          onClick={onLock}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Lock App (PIN)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono">4-DIGIT</span>
        </button>
      </div>
    </aside>
  );
}
