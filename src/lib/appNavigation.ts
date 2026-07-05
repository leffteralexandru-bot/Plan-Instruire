import {
  ingineriPath,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_PLAN_PATH,
  INGINERI_SUPERVISOR_PANEL_PATH,
} from '@/data/departments';

export type NavIconId =
  | 'home'
  | 'plan'
  | 'evaluations'
  | 'competency'
  | 'mentor'
  | 'supervisor'
  | 'hr'
  | 'dashboard'
  | 'account'
  | 'departments';

export interface AppNavItem {
  to: string;
  label: string;
  icon: NavIconId;
  end?: boolean;
  /** Afișat în bottom bar pe mobil (max 4) */
  bottomPrimary?: boolean;
}

const BOTTOM_PRIMARY_LIMIT = 4;

export function buildAppNavItems(
  isAdmin: boolean,
  isHr: boolean,
  canMentor: boolean,
  canSupervisor: boolean,
  isAngajat: boolean,
  angajatMentor: boolean,
): AppNavItem[] {
  const links: AppNavItem[] = [];

  if (isAdmin) {
    links.push(
      { to: INGINERI_ADMIN_DASHBOARD_PATH, label: 'Dashboard', icon: 'dashboard', end: true, bottomPrimary: true },
      { to: ingineriPath('/admin'), label: 'Panou HR', icon: 'hr', bottomPrimary: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', icon: 'evaluations', bottomPrimary: true },
      { to: ingineriPath('/competente'), label: 'Competențe', icon: 'competency', bottomPrimary: true },
    );
    if (canMentor) links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor', icon: 'mentor' });
    if (canSupervisor) {
      links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', icon: 'supervisor' });
    }
    return links;
  }

  if (isHr) {
    links.push(
      { to: ingineriPath('/admin'), label: 'Panou HR', icon: 'hr', end: true, bottomPrimary: true },
      { to: ingineriPath('/mentor'), label: 'Panou Mentor', icon: 'mentor', bottomPrimary: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', icon: 'evaluations', bottomPrimary: true },
      { to: ingineriPath('/competente'), label: 'Competențe', icon: 'competency', bottomPrimary: true },
    );
    if (canSupervisor) {
      links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', icon: 'supervisor' });
    }
    return links;
  }

  if (isAngajat) {
    links.push(
      { to: INGINERI_ANGAJAT_PANEL_PATH, label: 'Panou Angajat', icon: 'home', end: true, bottomPrimary: true },
      { to: INGINERI_PLAN_PATH, label: 'Plan instruire', icon: 'plan', bottomPrimary: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', icon: 'evaluations', bottomPrimary: true },
      { to: ingineriPath('/competente'), label: 'Competențe', icon: 'competency', bottomPrimary: true },
    );
    if (angajatMentor && canMentor) {
      links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor (temp.)', icon: 'mentor' });
    }
    if (canSupervisor) {
      links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', icon: 'supervisor' });
    }
    return links;
  }

  if (canMentor) {
    links.push(
      { to: ingineriPath('/mentor'), label: 'Panou Mentor', icon: 'mentor', end: true, bottomPrimary: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', icon: 'evaluations', bottomPrimary: true },
    );
    if (canSupervisor) {
      links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', icon: 'supervisor', bottomPrimary: true });
    }
    return links;
  }

  if (canSupervisor) {
    return [
      { to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', icon: 'supervisor', end: true, bottomPrimary: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', icon: 'evaluations', bottomPrimary: true },
    ];
  }

  return [{ to: INGINERI_PLAN_PATH, label: 'Dashboard', icon: 'plan', end: true, bottomPrimary: true }];
}

export function splitNavForBottomBar(items: AppNavItem[]): {
  bottomPrimary: AppNavItem[];
  overflow: AppNavItem[];
} {
  const marked = items.filter((i) => i.bottomPrimary);
  const primary = marked.slice(0, BOTTOM_PRIMARY_LIMIT);
  const overflowFromPrimary = marked.slice(BOTTOM_PRIMARY_LIMIT);
  const unmarked = items.filter((i) => !i.bottomPrimary);
  return {
    bottomPrimary: primary,
    overflow: [...overflowFromPrimary, ...unmarked],
  };
}

/** Clase reutilizabile layout — mobile-first, aerisit pe desktop */
export const LAYOUT_SHELL = 'w-full max-w-screen-xl mx-auto min-w-0';
export const LAYOUT_PAGE = 'w-full max-w-screen-xl mx-auto min-w-0 px-4 py-4 md:px-6 md:py-8';
export const GRID_ADAPTIVE = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
