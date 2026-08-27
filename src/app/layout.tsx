'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PinLockModal } from '@/components/auth/PinLockModal';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default lock screen on open
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Check auth PIN status on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/pin', { cache: 'no-store' });
        const data = await res.json();
        setIsLocked(!data.authenticated);
      } catch (err) {
        setIsLocked(true);
      }
    }
    checkAuth();
  }, []);

  const handleLock = async () => {
    try {
      await fetch('/api/auth/pin', { method: 'DELETE', cache: 'no-store' });
      // Clear Web Caches, local storage & session storage for seamless database re-sync
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      setIsLocked(true);
    }
  };

  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  return (
    <html lang="en" className="dark">
      <head>
        <title>Gunatit Shop - Personal Price Management System</title>
        <meta name="description" content="Submersible pump repair shop pricing book & profit calculator" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
          {/* Toast Notification Container */}
          <ToastContainer />

          {/* Lock Gatekeeper Screen */}
          {isLocked === true && <PinLockModal onSuccess={handleUnlockSuccess} />}

          {/* Desktop Sidebar */}
          <Sidebar onLock={handleLock} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
            <Header onLock={handleLock} />
            <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
          </div>

          {/* Mobile Floating Bottom Bar */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
