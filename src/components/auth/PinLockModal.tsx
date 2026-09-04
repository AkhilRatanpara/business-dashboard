'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { cn } from '@/lib/utils';

interface PinLockModalProps {
  onSuccess: () => void;
}

export function PinLockModal({ onSuccess }: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleKeyPress = (num: string) => {
    if (isUnlocked) return;
    setError('');

    // If loading was somehow stuck or pin is already 4 digits, start fresh with new digit
    const basePin = loading || pin.length >= 4 ? '' : pin;
    if (loading) setLoading(false);

    const nextPin = basePin + num;
    setPin(nextPin);

    if (nextPin.length === 4) {
      verifyPinCode(nextPin);
    }
  };

  const handleBackspace = () => {
    if (isUnlocked) return;
    if (loading) setLoading(false);
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isUnlocked) return;
    if (loading) setLoading(false);
    setPin('');
    setError('');
  };

  const verifyPinCode = async (codeToVerify: string) => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: codeToVerify }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success) {
        setIsUnlocked(true);
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else {
        setError(data.message || 'Incorrect 4-digit PIN code');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch {
      clearTimeout(timeoutId);
      setError('Connection timeout. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Listen to physical keyboard typing without triggering password manager autofill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter' && pin.length === 4) {
        verifyPinCode(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading, isUnlocked]);

  const keypadDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      data-lpignore="true"
      data-1p-ignore="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-2xl p-4 overflow-y-auto select-none transition-colors duration-300"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto flex flex-col items-center relative z-10">
        {/* Branding & Shield */}
        <div className="relative mb-3 flex flex-col items-center">
          <div className="relative">
            <BrandLogo size={56} className="transition-transform active:scale-95" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-emerald-500/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              {isUnlocked ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 drop-shadow-xs">
          <span>Gunatit Submersible</span>
        </h1>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-widest mb-5">
          Price Book Security Gatekeeper
        </p>

        {/* Security Card - Theme Adaptive */}
        <div className="w-full bg-white/95 dark:bg-slate-900/95 rounded-3xl p-6 flex flex-col items-center shadow-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between w-full mb-5 px-1">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Enter 4-Digit Passcode</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-semibold">{showPin ? 'Mask' : 'Peek'}</span>
            </button>
          </div>

          {/* PIN Digit / Dot Indicators */}
          <div
            className={cn(
              'flex items-center justify-center gap-3.5 mb-5 transition-all',
              isShaking && 'animate-shake'
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              const digit = pin[index];
              return (
                <div
                  key={index}
                  className={cn(
                    'w-12 h-12 rounded-2xl border flex items-center justify-center font-mono text-lg font-black transition-all duration-200',
                    isFilled
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-400'
                  )}
                >
                  {isFilled ? (
                    showPin ? (
                      digit
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-4 text-center bg-rose-50 dark:bg-rose-950/50 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 w-full animate-fade-in">
              {error}
            </div>
          )}

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 w-full mb-2 select-none">
            {keypadDigits.map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                disabled={isUnlocked}
                className="h-14 sm:h-15 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:bg-emerald-500 text-slate-900 dark:text-slate-100 active:text-slate-950 flex items-center justify-center transition-transform duration-75 active:scale-90 border border-slate-200/90 dark:border-slate-700/60 hover:border-emerald-500/50 shadow-xs cursor-pointer touch-manipulation select-none disabled:opacity-50"
              >
                <span className="text-2xl font-black">{digit}</span>
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isUnlocked}
              className="h-14 sm:h-15 rounded-2xl bg-slate-100/70 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-transform duration-75 active:scale-90 border border-slate-200 dark:border-slate-800 cursor-pointer touch-manipulation select-none disabled:opacity-50"
            >
              Clear
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={isUnlocked}
              className="h-14 sm:h-15 rounded-2xl bg-slate-100 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:bg-emerald-500 text-slate-900 dark:text-slate-100 active:text-slate-950 flex items-center justify-center transition-transform duration-75 active:scale-90 border border-slate-200/90 dark:border-slate-700/60 hover:border-emerald-500/50 shadow-xs cursor-pointer touch-manipulation select-none disabled:opacity-50"
            >
              <span className="text-2xl font-black">0</span>
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isUnlocked}
              className="h-14 sm:h-15 rounded-2xl bg-slate-100/70 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center justify-center transition-transform duration-75 active:scale-90 border border-slate-200 dark:border-slate-800 cursor-pointer touch-manipulation select-none disabled:opacity-50"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Security Information Footer */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 w-full flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Strict 20-Min Inactivity & Global Multi-Device Lock</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
