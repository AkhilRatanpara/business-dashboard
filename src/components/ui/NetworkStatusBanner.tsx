'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { notify } from './Toast';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(window.navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      notify('Internet connection restored! Syncing data...', 'success');

      // Dispatch event so active data views can re-fetch
      window.dispatchEvent(new Event('gunatit-online-resync'));

      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      notify('No internet connection. Waiting for network...', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-fade-in select-none">
        <WifiOff className="w-4 h-4 animate-bounce shrink-0" />
        <span>No Internet Connection • Cloud database sync paused. Reconnecting automatically...</span>
        <button
          onClick={() => {
            if (window.navigator.onLine) {
              setIsOnline(true);
              window.location.reload();
            } else {
              notify('Still offline. Please check your network connection.', 'error');
            }
          }}
          className="ml-2 px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-fade-in select-none">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Internet Restored • Synchronized with Neon Cloud Database</span>
      </div>
    );
  }

  return null;
}
