'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/lib/pin';

interface AuthContextType {
  role: UserRole;
  isLocked: boolean;
  isViewer: boolean;
  isEditor: boolean;
  checkAuth: () => Promise<boolean>;
  lock: () => Promise<void>;
  unlock: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  role: 'viewer',
  isLocked: true,
  isViewer: true,
  isEditor: false,
  checkAuth: async () => false,
  lock: async () => {},
  unlock: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('viewer');

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/pin', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated) {
        setIsLocked(false);
        setRole(data.role || 'editor');
        return true;
      } else {
        setIsLocked(true);
        return false;
      }
    } catch (err) {
      setIsLocked(true);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const lock = async () => {
    try {
      await fetch('/api/auth/pin', { method: 'DELETE', cache: 'no-store' });
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      setIsLocked(true);
      setRole('viewer');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gunatit_auth_role');
      }
    }
  };

  const unlock = (unlockedRole: UserRole) => {
    setIsLocked(false);
    setRole(unlockedRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gunatit_auth_role', unlockedRole);
    }
  };

  const isViewer = role === 'viewer';
  const isEditor = role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        role,
        isLocked,
        isViewer,
        isEditor,
        checkAuth,
        lock,
        unlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
