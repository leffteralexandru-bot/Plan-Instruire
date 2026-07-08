import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { isAngajatMentor } from '@/lib/roles';
import { buildAppNavLinks, resolveActiveNavItem, type AppNavItem } from '@/lib/appNavigation';
import { getDepartmentFromPath } from '@/data/departments';

export function useActiveNavSection(): AppNavItem | null {
  const { user, isAdmin, isHr, isAngajat } = useAuth();
  const { canOpenMentorPanel, canOpenSupervisorPanel } = useAccessControl();
  const { pathname } = useLocation();

  return useMemo(() => {
    if (!user) return null;
    const isHub = pathname === '/';
    const activeDept = getDepartmentFromPath(pathname);
    if (isHub || !activeDept?.planAvailable) return null;

    const links = buildAppNavLinks(
      isAdmin,
      isHr,
      canOpenMentorPanel,
      canOpenSupervisorPanel,
      isAngajat,
      isAngajatMentor(user),
    );

    return resolveActiveNavItem(pathname, links);
  }, [
    user,
    pathname,
    isAdmin,
    isHr,
    isAngajat,
    canOpenMentorPanel,
    canOpenSupervisorPanel,
  ]);
}
