'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Lock, KeyRound, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinLockModalProps {
  onSuccess: () => void;
}

export function PinLockModal({ onSuccess }: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 4) {
        verifyPinCode(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (loading) return;
    setPin('');
    setError('');
  };

  const verifyPinCode = async (codeToVerify: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: codeToVerify }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Incorrect PIN code');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Listen to physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/90 dark:bg-slate-950/95 backdrop-blur-2xl p-4 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10 mb-4">
          <Wrench className="w-8 h-8 font-bold" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">GUNATIT SHOP</h2>
        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider mb-6">Price Book Security Gatekeeper</p>

        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col items-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-extrabold uppercase tracking-wide mb-6">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Enter 4-Digit Passcode</span>
          </div>

          {/* PIN Dot Indicators */}
          <div
            className={cn(
              'flex items-center justify-center gap-4 mb-6 transition-all',
              isShaking && 'animate-shake'
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all duration-200',
                    isFilled
                      ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-md shadow-emerald-500/40'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                  )}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-4 text-center bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
              {error}
            </p>
          )}

          {/* Keypad Grid (Craft.Lab Styling) */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={loading}
                className="keypad-btn h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xl font-black transition-all shadow-xs active:bg-emerald-500 active:text-white"
              >
                {num}
              </button>
            ))}

            <button
              onClick={handleClear}
              disabled={loading}
              className="keypad-btn h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-extrabold transition-all"
            >
              CLEAR
            </button>

            <button
              onClick={() => handleKeyPress('0')}
              disabled={loading}
              className="keypad-btn h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xl font-black transition-all shadow-xs active:bg-emerald-500 active:text-white"
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              disabled={loading}
              className="keypad-btn h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
