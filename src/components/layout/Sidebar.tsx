'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, History, Settings, PlusCircle, Wrench, Lock, Sun, Moon, RotateCcw, Eye, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthContext';

const allNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, editorOnly: true },
  { name: 'Items (Price Book)', href: '/items', icon: Package, editorOnly: false },
  { name: 'Categories', href: '/categories', icon: FolderTree, editorOnly: false },
  { name: 'Price History', href: '/price-history', icon: History, editorOnly: true },
  { name: 'Activity History', href: '/price-history?tab=activity', icon: RotateCcw, editorOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, editorOnly: true },
];

export function Sidebar({ onLock }: { onLock: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isViewer, isEditor } = useAuth();

  const visibleNavItems = allNavItems.filter((item) => (!isViewer || !item.editorOnly));

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-xl h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Wrench className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">GUNATIT</h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider">SUBMERSIBLE</p>
          </div>
        </Link>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 pt-3">
        {isViewer ? (
          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200">Viewer Mode</div>
              <div className="text-[10px] text-cyan-700 dark:text-cyan-400">Read-Only Price Catalog</div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Editor Mode</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Full Access (Edit & Manage)</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Button (Editor Only) */}
      {isEditor && (
        <div className="px-4 py-3">
          <Link
            href="/items/new"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Item</span>
          </Link>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all group',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher & Lock Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono">
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </span>
        </button>

        <button
          onClick={onLock}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Lock / Switch</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono">PIN</span>
        </button>
      </div>
    </aside>
  );
}
