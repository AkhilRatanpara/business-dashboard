'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Layers, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthContext';

const allMobileNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard, editorOnly: true },
  { name: 'Items', href: '/items', icon: Package, editorOnly: false },
  { name: 'Categories', href: '/categories', icon: Layers, editorOnly: false },
  { name: 'History', href: '/price-history', icon: History, editorOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, editorOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isViewer } = useAuth();

  const visibleNavItems = allMobileNavItems.filter((item) => (!isViewer || !item.editorOnly));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-1 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-all',
                  isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : ''
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
