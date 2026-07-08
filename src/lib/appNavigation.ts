import {
  ingineriPath,
  INGINERI_ADMIN_DASHBOARD_PATH,
  INGINERI_ANGAJAT_PANEL_PATH,
  INGINERI_PLAN_PATH,
  INGINERI_SUPERVISOR_PANEL_PATH,
} from '@/data/departments';
import type { NavIconId } from '@/components/layout/NavIcon';

export type AppNavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: NavIconId;
  end?: boolean;
};

/** Secțiunea activă din bara de jos — pentru titlul paginii pe mobil/tabletă. */
export function resolveActiveNavItem(pathname: string, links: AppNavItem[]): AppNavItem | null {
  const path = pathname.split('?')[0];

  if (path.includes('/ingineri/zi/') || path.includes('/ingineri/re-instruire/')) {
    const plan = links.find((l) => l.to === INGINERI_PLAN_PATH);
    if (plan) return plan;
  }

  if (path === INGINERI_PLAN_PATH) {
    return links.find((l) => l.to === INGINERI_PLAN_PATH) ?? null;
  }

  const sorted = [...links].sort((a, b) => b.to.length - a.to.length);

  for (const link of sorted) {
    if (link.end) {
      if (path === link.to) return link;
      continue;
    }
    if (path === link.to || path.startsWith(`${link.to}/`)) return link;
  }

  if (path.includes('/evaluari')) {
    return links.find((l) => l.icon === 'evaluations') ?? null;
  }
  if (path.includes('/competente')) {
    return links.find((l) => l.icon === 'competencies') ?? null;
  }

  return null;
}

export function buildAppNavLinks(
  isAdmin: boolean,
  isHr: boolean,
  canMentor: boolean,
  canSupervisor: boolean,
  isAngajat: boolean,
  angajatMentor: boolean,
): AppNavItem[] {
  if (isAdmin) {
    const links: AppNavItem[] = [
      { to: INGINERI_ADMIN_DASHBOARD_PATH, label: 'Dashboard', shortLabel: 'Dashboard', icon: 'dashboard', end: true },
      { to: ingineriPath('/admin'), label: 'Panou HR', shortLabel: 'HR', icon: 'hr' },
    ];
    if (canMentor) links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor', shortLabel: 'Mentor', icon: 'mentor' });
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', shortLabel: 'Supervizor', icon: 'supervisor' });
    links.push(
      { to: ingineriPath('/evaluari'), label: 'Evaluări', shortLabel: 'Evaluări', icon: 'evaluations' },
      { to: ingineriPath('/competente'), label: 'Competențe', shortLabel: 'Competență', icon: 'competencies' },
    );
    return links;
  }

  if (isHr) {
    const links: AppNavItem[] = [
      { to: ingineriPath('/admin'), label: 'Panou HR', shortLabel: 'HR', icon: 'hr', end: true },
      { to: ingineriPath('/mentor'), label: 'Panou Mentor', shortLabel: 'Mentor', icon: 'mentor' },
    ];
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', shortLabel: 'Supervizor', icon: 'supervisor' });
    links.push(
      { to: ingineriPath('/evaluari'), label: 'Evaluări', shortLabel: 'Evaluări', icon: 'evaluations' },
      { to: ingineriPath('/competente'), label: 'Competențe', shortLabel: 'Competență', icon: 'competencies' },
    );
    return links;
  }

  if (isAngajat) {
    const links: AppNavItem[] = [
      { to: INGINERI_ANGAJAT_PANEL_PATH, label: 'Panou Angajat', shortLabel: 'Angajat', icon: 'angajat', end: true },
      { to: INGINERI_PLAN_PATH, label: 'Plan instruire', shortLabel: 'Instruire', icon: 'plan' },
    ];
    if (angajatMentor && canMentor) {
      links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor (temp.)', shortLabel: 'Mentor', icon: 'mentor' });
    }
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', shortLabel: 'Supervizor', icon: 'supervisor' });
    links.push(
      { to: ingineriPath('/evaluari'), label: 'Evaluări', shortLabel: 'Evaluări', icon: 'evaluations' },
      { to: ingineriPath('/competente'), label: 'Competențe', shortLabel: 'Competență', icon: 'competencies' },
    );
    return links;
  }

  if (canMentor) {
    const links: AppNavItem[] = [
      { to: ingineriPath('/mentor'), label: 'Panou Mentor', shortLabel: 'Mentor', icon: 'mentor', end: true },
    ];
    if (canSupervisor) links.push({ to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', shortLabel: 'Supervizor', icon: 'supervisor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări', shortLabel: 'Evaluări', icon: 'evaluations' });
    return links;
  }

  if (canSupervisor) {
    return [
      { to: INGINERI_SUPERVISOR_PANEL_PATH, label: 'Panou Supervizor', shortLabel: 'Supervizor', icon: 'supervisor', end: true },
      { to: ingineriPath('/evaluari'), label: 'Evaluări', shortLabel: 'Evaluări', icon: 'evaluations' },
    ];
  }

  return [{ to: INGINERI_PLAN_PATH, label: 'Dashboard', shortLabel: 'Dashboard', icon: 'dashboard', end: true }];
}
