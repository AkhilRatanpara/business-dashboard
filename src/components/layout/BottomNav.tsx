'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, PlusCircle, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Items', href: '/items', icon: Package },
  { name: 'Add', href: '/items/new', icon: PlusCircle, isHighlight: true },
  { name: 'History', href: '/price-history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-2.5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          if (item.isHighlight) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center group -mt-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 ring-4 ring-white dark:ring-slate-950 group-active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-12 py-1 rounded-xl transition-all',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : '')} />
              <span className="text-[10px] font-semibold tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
