import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { isAngajatMentor } from '@/lib/roles';
import { buildAppNavItems, splitNavForBottomBar, type AppNavItem } from '@/lib/appNavigation';

interface AppMenuContextValue {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  allNavItems: AppNavItem[];
  bottomPrimary: AppNavItem[];
  overflowNavItems: AppNavItem[];
}

const AppMenuContext = createContext<AppMenuContextValue | null>(null);

export function AppMenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();

  const allNavItems = useMemo(() => {
    if (!user) return [];
    return buildAppNavItems(
      isAdmin,
      isHr,
      canOpenMentorPanel,
      canOpenSupervisorPanel,
      isAngajat,
      isAngajatMentor(user),
    );
  }, [user, isAdmin, isHr, canOpenMentorPanel, canOpenSupervisorPanel, isAngajat]);

  const { bottomPrimary, overflow } = useMemo(
    () => splitNavForBottomBar(allNavItems),
    [allNavItems],
  );

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      menuOpen,
      openMenu,
      closeMenu,
      toggleMenu,
      allNavItems,
      bottomPrimary,
      overflowNavItems: overflow,
    }),
    [menuOpen, openMenu, closeMenu, toggleMenu, allNavItems, bottomPrimary, overflow],
  );

  return <AppMenuContext.Provider value={value}>{children}</AppMenuContext.Provider>;
}

export function useAppMenu() {
  const ctx = useContext(AppMenuContext);
  if (!ctx) throw new Error('useAppMenu must be used within AppMenuProvider');
  return ctx;
}
