'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  email: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'halal_chain_admin';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    // Auto-append @admin if not present
    const adminEmail = email.endsWith('@admin') ? email : `${email}@admin`;

    try {
      const res = await fetch('/api/admin/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setAdmin(data.admin);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.admin));
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Sign in failed' };
      }
    } catch {
      return { ok: false, error: 'Network error' };
    }
  };

  const signUp = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    // Auto-append @admin if not present
    const adminEmail = email.endsWith('@admin') ? email : `${email}@admin`;

    try {
      const res = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setAdmin(data.admin);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.admin));
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Sign up failed' };
      }
    } catch {
      return { ok: false, error: 'Network error' };
    }
  };

  const signOut = () => {
    setAdmin(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
