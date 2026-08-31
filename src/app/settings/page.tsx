'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle2, ShieldCheck, Sun, Moon, Database, Key, RotateCcw, Eye, ShieldAlert } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { notify } from '@/components/ui/Toast';
import { useAuth } from '@/components/auth/AuthContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { isViewer, isEditor, lock } = useAuth();

  // Editor PIN Form State
  const [editorCurrentPin, setEditorCurrentPin] = useState('');
  const [editorNewPin, setEditorNewPin] = useState('');
  const [editorConfirmPin, setEditorConfirmPin] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorMessage, setEditorMessage] = useState({ text: '', type: '' });

  // Viewer PIN Form State
  const [viewerCurrentEditorPin, setViewerCurrentEditorPin] = useState('');
  const [viewerNewPin, setViewerNewPin] = useState('');
  const [viewerConfirmPin, setViewerConfirmPin] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerMessage, setViewerMessage] = useState({ text: '', type: '' });

  const handleChangeEditorPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorMessage({ text: '', type: '' });

    if (editorNewPin.length !== 4 || !/^\d+$/.test(editorNewPin)) {
      setEditorMessage({ text: 'New Editor PIN must be exactly 4 numeric digits', type: 'error' });
      return;
    }

    if (editorNewPin !== editorConfirmPin) {
      setEditorMessage({ text: 'New Editor PIN and Confirm PIN do not match', type: 'error' });
      return;
    }

    setEditorLoading(true);

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: 'editor',
          currentPin: editorCurrentPin,
          newPin: editorNewPin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditorMessage({ text: 'Editor Security PIN updated successfully!', type: 'success' });
        notify('Editor Security PIN updated successfully!', 'success');
        setEditorCurrentPin('');
        setEditorNewPin('');
        setEditorConfirmPin('');
      } else {
        setEditorMessage({ text: data.message || 'Failed to update Editor PIN', type: 'error' });
      }
    } catch (err) {
      setEditorMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setEditorLoading(false);
    }
  };

  const handleChangeViewerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setViewerMessage({ text: '', type: '' });

    if (viewerNewPin.length !== 4 || !/^\d+$/.test(viewerNewPin)) {
      setViewerMessage({ text: 'New Viewer PIN must be exactly 4 numeric digits', type: 'error' });
      return;
    }

    if (viewerNewPin !== viewerConfirmPin) {
      setViewerMessage({ text: 'New Viewer PIN and Confirm PIN do not match', type: 'error' });
      return;
    }

    setViewerLoading(true);

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: 'viewer',
          currentPin: viewerCurrentEditorPin,
          newPin: viewerNewPin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setViewerMessage({ text: 'Viewer Security PIN updated successfully!', type: 'success' });
        notify('Viewer Security PIN updated successfully!', 'success');
        setViewerCurrentEditorPin('');
        setViewerNewPin('');
        setViewerConfirmPin('');
      } else {
        setViewerMessage({ text: data.message || 'Failed to update Viewer PIN', type: 'error' });
      }
    } catch (err) {
      setViewerMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setViewerLoading(false);
    }
  };

  // If in Viewer Mode, display restricted access notice
  if (isViewer) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 my-12 border border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Editor Settings Restricted</h2>
        <p className="text-xs text-slate-500">
          You are currently in <strong>Viewer (Read-Only)</strong> mode. System settings, PIN management, and database tools require Editor access.
        </p>
        <div className="pt-2">
          <button
            onClick={lock}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Lock & Log In as Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage Dual Security PINs (Editor & Viewer), Themes, and Neon Database Status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Editor Security PIN (Full Access) */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Editor Security PIN</h2>
              <p className="text-[11px] text-slate-500">Full Access (Edit, Delete, Price Change)</p>
            </div>
          </div>

          {editorMessage.text && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold ${
                editorMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {editorMessage.text}
            </div>
          )}

          <form onSubmit={handleChangeEditorPin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Editor PIN (Default: 4142)
              </label>
              <input
                type="password"
                maxLength={4}
                value={editorCurrentPin}
                onChange={(e) => setEditorCurrentPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={editorNewPin}
                  onChange={(e) => setEditorNewPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={editorConfirmPin}
                  onChange={(e) => setEditorConfirmPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={editorLoading || !editorCurrentPin || editorNewPin.length !== 4}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {editorLoading ? 'Updating...' : 'Update Editor PIN'}
            </button>
          </form>
        </div>

        {/* 2. Viewer Security PIN (Read Only) */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Viewer Security PIN</h2>
              <p className="text-[11px] text-slate-500">Read-Only Access (Safe Shop Viewing)</p>
            </div>
          </div>

          {viewerMessage.text && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold ${
                viewerMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {viewerMessage.text}
            </div>
          )}

          <form onSubmit={handleChangeViewerPin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Editor PIN (Master Authorization)
              </label>
              <input
                type="password"
                maxLength={4}
                value={viewerCurrentEditorPin}
                onChange={(e) => setViewerCurrentEditorPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Viewer PIN (Default: 1250)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={viewerNewPin}
                  onChange={(e) => setViewerNewPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={viewerConfirmPin}
                  onChange={(e) => setViewerConfirmPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-center text-base focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={viewerLoading || !viewerCurrentEditorPin || viewerNewPin.length !== 4}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {viewerLoading ? 'Updating...' : 'Update Viewer PIN'}
            </button>
          </form>
        </div>
      </div>

      {/* Database & Audit History Shortcuts */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Database & Audit Log Status</h2>
              <p className="text-xs text-slate-500">Connected to Neon Serverless PostgreSQL with 1-Click Recycle Bin</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/price-history?tab=activity"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>Open Recycle Bin & Restore Deleted Items</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
