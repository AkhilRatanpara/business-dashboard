'use client';

import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PinLockModal } from '@/components/auth/PinLockModal';
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLocked, lock, unlock } = useAuth();

  return (
    <>
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Lock Gatekeeper Screen */}
      {isLocked && <PinLockModal onSuccess={unlock} />}

      {/* Desktop Sidebar */}
      <Sidebar onLock={lock} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        <Header onLock={lock} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <BottomNav />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Gunatit Submersible - Price Book & Management System</title>
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
        <AuthProvider>
          <ThemeProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
