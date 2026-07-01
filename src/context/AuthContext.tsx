import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { DEMO_USERS } from '@/data/users';
import { storage } from '@/store/storage';
import {
  isSupabaseAuthEnabled,
  migrateProgressOnLogin,
  signInWithSupabaseAuth,
  signOutSupabaseAuth,
} from '@/lib/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMentor: boolean;
  isStagiar: boolean;
  isAdmin: boolean;
  supabaseAuth: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  demoUsers: typeof DEMO_USERS;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = storage.getAuth();
    setUser(auth.user);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) return false;

    if (isSupabaseAuthEnabled() && password) {
      const ok = await signInWithSupabaseAuth(email, password);
      if (!ok) return false;
    }

    storage.setAuth(found);
    setUser(found);
    await migrateProgressOnLogin(found.id);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await signOutSupabaseAuth();
    storage.clearAuth();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isMentor: user?.role === 'mentor',
      isStagiar: user?.role === 'stagiar',
      isAdmin: user?.role === 'admin',
      supabaseAuth: isSupabaseAuthEnabled(),
      login,
      logout,
      demoUsers: DEMO_USERS,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth în AuthProvider');
  return ctx;
}
