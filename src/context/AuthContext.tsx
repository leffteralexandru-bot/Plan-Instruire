import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { listDemoUsers } from '@/data/users';
import { storage } from '@/store/storage';
import { userStore } from '@/lib/userStore';
import {
  canAccessAdminPanel,
  canAccessMentorPanel,
  canManageSystemSettings,
  canManageUsers,
  isAngajatUser,
  isMentorUser,
  hasRole,
} from '@/lib/roles';
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
  isAngajat: boolean;
  /** @deprecated Folosiți isAngajat */
  isStagiar: boolean;
  /** Are înscriere activă la un program de instruire */
  isInTraining: boolean;
  isAdmin: boolean;
  isHr: boolean;
  canManageUsers: boolean;
  canAccessAdmin: boolean;
  canAccessMentor: boolean;
  canManageSettings: boolean;
  supabaseAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  demoUsers: User[];
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  const refreshUser = useCallback(() => {
    setDemoUsers(listDemoUsers());
    const auth = storage.getAuth();
    if (auth.user) {
      const fresh = userStore.getUserById(auth.user.id);
      if (fresh?.active) {
        setUser(fresh);
        storage.setAuth(fresh);
      } else {
        storage.clearAuth();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const auth = storage.getAuth();
    if (auth.user) {
      const fresh = userStore.getUserById(auth.user.id);
      if (fresh?.active) {
        setUser(fresh);
        storage.setAuth(fresh);
      } else {
        storage.clearAuth();
        setUser(null);
      }
    }
    setDemoUsers(listDemoUsers());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    if (!password?.trim()) return false;

    const finishLogin = async (found: User) => {
      storage.setAuth(found);
      setUser(found);
      await migrateProgressOnLogin(found.id);
      return true;
    };

    if (isSupabaseAuthEnabled()) {
      const cloudOk = await signInWithSupabaseAuth(email, password);
      if (cloudOk) {
        const cloudUser = userStore.getUserByEmail(email);
        if (cloudUser) return finishLogin(cloudUser);
      }
      // Cont demo local / Alex — parolă verificată în browser (fără cont Supabase Auth)
      const localUser = userStore.verifyPassword(email, password);
      if (localUser) return finishLogin(localUser);
      return false;
    }

    const localUser = userStore.verifyPassword(email, password);
    if (!localUser) return false;
    return finishLogin(localUser);
  }, []);

  const logout = useCallback(async () => {
    storage.clearAuth();
    storage.clearSelectedStagiarId();
    setUser(null);
    try {
      await signOutSupabaseAuth();
    } catch {
      /* deconectare locală deja aplicată */
    } finally {
      window.location.replace('/login');
    }
  }, []);

  const isInTraining = !!user && !!userStore.getEnrollmentForAngajat(user.id);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isMentor: isMentorUser(user),
      isAngajat: isAngajatUser(user),
      isStagiar: isAngajatUser(user),
      isInTraining,
      isAdmin: hasRole(user, 'admin'),
      isHr: hasRole(user, 'hr'),
      canManageUsers: canManageUsers(user),
      canAccessAdmin: canAccessAdminPanel(user),
      canAccessMentor: canAccessMentorPanel(user),
      canManageSettings: canManageSystemSettings(user),
      supabaseAuth: isSupabaseAuthEnabled(),
      login,
      logout,
      demoUsers,
      refreshUser,
    }),
    [user, loading, isInTraining, login, logout, demoUsers, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth în AuthProvider');
  return ctx;
}