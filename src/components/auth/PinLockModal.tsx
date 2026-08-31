'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Lock, Eye, EyeOff, Sparkles, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    if (loading || isUnlocked) return;
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
    if (loading || isUnlocked) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (loading || isUnlocked) return;
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
        setIsUnlocked(true);
        setTimeout(() => {
          onSuccess();
        }, 350);
      } else {
        setError(data.message || 'Incorrect 4-digit PIN code');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDefault = () => {
    if (loading || isUnlocked) return;
    setPin('1234');
    verifyPinCode('1234');
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
      } else if (e.key === 'Enter' && pin.length === 4) {
        verifyPinCode(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading, isUnlocked]);

  const keypadButtons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-4 overflow-y-auto select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto flex flex-col items-center relative z-10">
        {/* Branding & Shield */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 transition-transform active:scale-95">
            {isUnlocked ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8 font-bold animate-pulse" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>GUNATIT SHOP</span>
        </h1>
        <p className="text-[11px] text-emerald-400/90 font-mono font-bold uppercase tracking-widest mb-5">
          Price Book Security Gatekeeper
        </p>

        {/* Security Card */}
        <div className="w-full bg-slate-900/90 rounded-3xl p-6 flex flex-col items-center shadow-2xl border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between w-full mb-5 px-1">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Enter 4-Digit Passcode</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
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
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'border-slate-800 bg-slate-950/60 text-slate-600'
                  )}
                >
                  {isFilled ? (
                    showPin ? (
                      digit
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs font-bold text-rose-400 mb-4 text-center bg-rose-950/50 px-3.5 py-1.5 rounded-xl border border-rose-800/60 w-full animate-fade-in">
              {error}
            </div>
          )}

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[270px] mb-4">
            {keypadButtons.map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                disabled={loading || isUnlocked}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-emerald-500 active:text-slate-950 border border-slate-750 text-white flex flex-col items-center justify-center transition-all duration-150 shadow-xs cursor-pointer group active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg font-black leading-none group-active:text-slate-950">{num}</span>
                {letters && (
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-0.5 leading-none group-active:text-slate-900">
                    {letters}
                  </span>
                )}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || isUnlocked}
              className="h-14 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-black transition-all active:scale-95 border border-slate-800 cursor-pointer disabled:opacity-50"
            >
              CLEAR
            </button>

            {/* 0 Button */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={loading || isUnlocked}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-emerald-500 active:text-slate-950 border border-slate-750 text-white flex flex-col items-center justify-center transition-all duration-150 shadow-xs cursor-pointer group active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg font-black leading-none group-active:text-slate-950">0</span>
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading || isUnlocked}
              className="h-14 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all active:scale-95 border border-slate-800 cursor-pointer disabled:opacity-50"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Default PIN Helper */}
          <div className="pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-400">
            <span>Forgot code?</span>
            <button
              type="button"
              onClick={handleQuickFillDefault}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Default: 1234</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
