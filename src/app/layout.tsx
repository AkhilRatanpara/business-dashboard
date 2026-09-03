'use client';

import './globals.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PinLockModal } from '@/components/auth/PinLockModal';
import { ThemeProvider, clearAppCacheKeepTheme } from '@/components/theme/ThemeProvider';
import { ToastContainer, notify } from '@/components/ui/Toast';
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner';

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default lock screen state
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLock = useCallback(async (isAuto = false) => {
    try {
      await fetch('/api/auth/pin', { method: 'DELETE', cache: 'no-store' });
      await clearAppCacheKeepTheme();
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      setIsLocked(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gunatit_last_activity');
        sessionStorage.removeItem('gunatit_session_unlocked');
      }
      if (isAuto) {
        notify('Session locked after 20 minutes of inactivity.', 'info');
      }
    }
  }, []);

  // Update last activity timestamp on any user touch/keyboard/pointer action
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gunatit_last_activity', now.toString());
      } catch {}
    }
  }, []);

  // Check initial auth and 20-minute inactivity
  useEffect(() => {
    async function checkAuthAndInactivity() {
      try {
        // Require active session token in this browser tab. If absent (e.g. fresh local run or new tab), require PIN
        const sessionUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('gunatit_session_unlocked') === 'true';

        const res = await fetch('/api/auth/pin', { cache: 'no-store' });
        const data = await res.json();

        if (data.authenticated && sessionUnlocked) {
          const savedActivity = localStorage.getItem('gunatit_last_activity');
          const lastTime = savedActivity ? Number(savedActivity) : Date.now();
          const elapsed = Date.now() - lastTime;

          if (elapsed > INACTIVITY_TIMEOUT_MS) {
            // Inactive for more than 20 minutes: lock and clear cache
            await handleLock(true);
          } else {
            // Active session in current tab (e.g. simple in-tab refresh within 20 min): remain unlocked
            setIsLocked(false);
            recordActivity();
          }
        } else {
          // If server says not authenticated OR this tab hasn't unlocked with PIN, show PIN lock
          setIsLocked(true);
          if (!sessionUnlocked) {
            await clearAppCacheKeepTheme();
          }
        }
      } catch (err) {
        setIsLocked(true);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuthAndInactivity();
  }, [handleLock, recordActivity]);

  // Set up event listeners for user activity and timer checks
  useEffect(() => {
    if (isLocked) return;

    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const onUserActivity = () => recordActivity();

    events.forEach((evt) => window.addEventListener(evt, onUserActivity, { passive: true }));

    // Periodic check every 15 seconds for inactivity and cross-device PIN changes
    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        handleLock(true);
        return;
      }

      // Check session validity with server (handles global auto-lock when PIN is changed on any device)
      try {
        const res = await fetch('/api/auth/pin', { cache: 'no-store' });
        const data = await res.json();
        if (!data.authenticated) {
          handleLock(true);
        }
      } catch {}
    }, 15000);

    // Also check when tab becomes visible again
    const onVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const savedActivity = localStorage.getItem('gunatit_last_activity');
        const lastTime = savedActivity ? Number(savedActivity) : lastActivityRef.current;
        if (Date.now() - lastTime > INACTIVITY_TIMEOUT_MS) {
          handleLock(true);
          return;
        }

        // When tab is re-focused, verify PIN hasn't changed on another device
        try {
          const res = await fetch('/api/auth/pin', { cache: 'no-store' });
          const data = await res.json();
          if (!data.authenticated) {
            handleLock(true);
            return;
          }
        } catch {}

        recordActivity();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onUserActivity));
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isLocked, handleLock, recordActivity]);

  const handleUnlockSuccess = () => {
    setIsLocked(false);
    recordActivity();
    try {
      sessionStorage.setItem('gunatit_session_unlocked', 'true');
      sessionStorage.setItem('gunatit_just_unlocked', 'true');
    } catch {}
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>Gunatit Submersible - Price Book & Management System</title>
        <meta name="description" content="Submersible pump repair shop pricing book & profit calculator" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Synchronous script to eliminate theme flicker before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('gunatit_theme') || 'dark';
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e){}
            })();`,
          }}
        />
        {/* Premium Google Fonts: Inter (UI) + DM Mono (prices) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden transition-colors duration-300">
        <ThemeProvider>
          {/* Global Network Connectivity Indicator */}
          <NetworkStatusBanner />

          {/* Toast Notification Container */}
          <ToastContainer />

          {/* Security Gatekeeper: Never render site shell or children while locked */}
          {isLocked ? (
            <PinLockModal onSuccess={handleUnlockSuccess} />
          ) : (
            <>
              {/* Desktop Sidebar */}
              <Sidebar onLock={() => handleLock(false)} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
                <Header onLock={() => handleLock(false)} />
                <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
              </div>

              {/* Mobile Floating Bottom Bar */}
              <BottomNav />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}

