'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'error' | 'info';
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function notify(text: string, type: 'success' | 'error' | 'info' = 'success') {
  if (toastListener) {
    toastListener({
      id: Date.now().toString(),
      text,
      type,
    });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-top-4 duration-300',
            toast.type === 'success' && 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600 shadow-emerald-500/10',
            toast.type === 'error' && 'bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-600 shadow-rose-500/10',
            toast.type === 'info' && 'bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-600 shadow-cyan-500/10'
          )}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
