'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock, CheckCircle2, ShieldCheck, Sun, Moon, Database, Key,
  RotateCcw, Server, Activity, HardDrive, Sparkles, RefreshCw
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { notify } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface DbStats {
  usedMb: string;
  totalMb: number;
  percentUsed: number;
  latencyMs: number;
  itemsCount: number;
  categoriesCount: number;
  historyCount: number;
  logsCount: number;
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState({ text: '', type: '' });

  // Neon DB Storage Meter State
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchDbStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/database/stats', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDbStats(data);
      }
    } catch {
      console.error('Failed to load database stats');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, []);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage({ text: '', type: '' });

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinMessage({ text: 'New PIN must be exactly 4 numeric digits', type: 'error' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ text: 'New PIN and Confirm PIN do not match', type: 'error' });
      return;
    }

    setPinLoading(true);

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const data = await res.json();

      if (data.success) {
        setPinMessage({
          text: 'Security PIN updated! All active sessions across all devices have been locked.',
          type: 'success',
        });
        notify('PIN updated. All active sessions locked.', 'success');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setPinMessage({ text: data.message || 'Failed to update PIN', type: 'error' });
        notify(data.message || 'Failed to update PIN', 'error');
      }
    } catch {
      setPinMessage({ text: 'Error connecting to database server', type: 'error' });
      notify('Database connection error', 'error');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Brand Identity & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <BrandLogo size={44} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Gunatit Submersible
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              System Settings & Neon Cloud Storage Health
            </p>
          </div>
        </div>
      </div>

      {/* 4-Digit Security PIN Form */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">4-Digit Security PIN</h2>
            <p className="text-xs text-slate-500">Update the access passcode required to unlock the catalog</p>
          </div>
        </div>

        {pinMessage.text && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold ${
              pinMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}
          >
            {pinMessage.text}
          </div>
        )}

        <form
          onSubmit={handleChangePin}
          autoComplete="off"
          data-lpignore="true"
          className="space-y-4 max-w-md"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="••••"
              required
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                required
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                required
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pinLoading || !currentPin || newPin.length !== 4}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {pinLoading ? 'Saving to Database...' : 'Save New Security PIN'}
          </button>
        </form>
      </div>

      {/* Neon Database Storage Meter Card (Replaced Raw URL) */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Neon PostgreSQL Cloud Storage
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Healthy & Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time disk usage, table metrics, and serverless pooler connection</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDbStats}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh Storage Status"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Progress Bar & Storage Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Disk Space Utilization:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {dbStats ? `${dbStats.usedMb} MB` : 'Calculating...'}
              </strong>
              <span className="text-slate-400 font-normal">of 512 MB</span>
            </span>
            <span className="font-mono text-slate-500">
              {dbStats ? `${dbStats.percentUsed}% Filled` : '...'}
            </span>
          </div>

          {/* Meter Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400 rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${Math.max(2, dbStats?.percentUsed || 2)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Serverless Pooler: AWS ap-southeast-1</span>
            <span>Response Latency: {dbStats?.latencyMs || 25} ms</span>
          </div>
        </div>

        {/* Database Table Entity Metrics */}
        {dbStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="block text-base sm:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                {dbStats.itemsCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Catalog Items</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="block text-base sm:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                {dbStats.categoriesCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Categories</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="block text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
                {dbStats.historyCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Price Revisions</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="block text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {dbStats.logsCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">15-Day Backups</span>
            </div>
          </div>
        )}
      </div>

      {/* Theme Preference Settings */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Display Theme</h2>
              <p className="text-xs text-slate-500">Currently active: <strong className="uppercase">{theme} mode</strong></p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            Switch to {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </button>
        </div>
      </div>

      {/* Activity & Recovery Vault Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Activity & Recovery Vault</h2>
              <p className="text-xs text-slate-500">15-day backup history with 1-click restore for deleted items</p>
            </div>
          </div>

          <Link
            href="/history"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            Open Vault &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
