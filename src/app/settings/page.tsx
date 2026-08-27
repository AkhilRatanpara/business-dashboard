'use client';

import { useState } from 'react';
import { Lock, CheckCircle2, ShieldCheck, Sun, Moon, Database, Key } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { notify } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState({ text: '', type: '' });

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
        setPinMessage({ text: 'Security PIN updated successfully!', type: 'success' });
        notify('Security PIN updated successfully!', 'success');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setPinMessage({ text: data.message || 'Failed to update PIN', type: 'error' });
      }
    } catch (err) {
      setPinMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage Security PIN, Themes, and Neon Database Status
        </p>
      </div>

      {/* Security PIN Change Form (Craft.Lab Pure White Card) */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">4-Digit Security PIN</h2>
            <p className="text-xs text-slate-500">Change your shop opening screen security passcode</p>
          </div>
        </div>

        {pinMessage.text && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold ${
              pinMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {pinMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePin} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current PIN (Default: 1234)
            </label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="••••"
              required
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pinLoading || !currentPin || newPin.length !== 4}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {pinLoading ? 'Updating PIN in Neon DB...' : 'Update Security PIN'}
          </button>
        </form>
      </div>

      {/* Theme Preference Settings */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Interface Theme</h2>
              <p className="text-xs text-slate-500">Currently active mode: <strong className="uppercase">{theme}</strong></p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700"
          >
            Switch to {theme === 'dark' ? 'White Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Neon PostgreSQL Live Database Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Neon PostgreSQL Cloud Database</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </h2>
            <p className="text-xs text-slate-500">Continuous cloud sync active on AWS ap-southeast-1 pooler</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          postgresql://neondb_owner:npg_...@ep-snowy-base-azh3pkeb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb
        </div>
      </div>
    </div>
  );
}
