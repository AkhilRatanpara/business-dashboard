'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ActivityRecoveryVaultView } from '@/components/history/ActivityRecoveryVaultView';

export default function HistoryPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in select-none">
      {/* Header Bar with Back to Settings navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs shrink-0 cursor-pointer"
          title="Back to Settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            <span>Activity & Recovery Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            15-day automated backup protection with 1-click restore for deleted catalog items and price revisions.
          </p>
        </div>
      </div>

      {/* Main Unified Activity & Recovery Vault */}
      <ActivityRecoveryVaultView />
    </div>
  );
}
