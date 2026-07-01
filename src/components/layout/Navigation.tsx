import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { ingineriPath, INGINERI_PLAN_PATH, INGINERI_ANGAJAT_PANEL_PATH } from '@/data/departments';
import { isAngajatMentor } from '@/lib/roles';

type NavLinkItem = { to: string; label: string; end?: boolean };

function buildNavLinks(
  isAdmin: boolean,
  isHr: boolean,
  canMentor: boolean,
  isAngajat: boolean,
  inTraining: boolean,
  angajatMentor: boolean,
): NavLinkItem[] {
  const links: NavLinkItem[] = [];

  if (isAdmin) {
    links.push({ to: INGINERI_PLAN_PATH, label: 'Dashboard', end: true });
    links.push({ to: ingineriPath('/admin'), label: 'Panou HR' });
    if (canMentor) links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor' });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    links.push({ to: ingineriPath('/competente'), label: 'Competențe' });
    return links;
  }

  if (isHr) {
    links.push({ to: ingineriPath('/admin'), label: 'Panou HR', end: true });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    if (canMentor) links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor' });
    return links;
  }

  if (isAngajat) {
    links.push({ to: INGINERI_ANGAJAT_PANEL_PATH, label: 'Panou Angajat', end: true });
    if (inTraining) links.push({ to: INGINERI_PLAN_PATH, label: 'Plan instruire' });
    if (angajatMentor && canMentor) {
      links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor (temp.)' });
    }
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    links.push({ to: ingineriPath('/competente'), label: 'Competențe' });
    return links;
  }

  if (canMentor) {
    links.push({ to: ingineriPath('/mentor'), label: 'Panou Mentor', end: true });
    links.push({ to: ingineriPath('/evaluari'), label: 'Evaluări' });
    return links;
  }

  return [{ to: INGINERI_PLAN_PATH, label: 'Dashboard', end: true }];
}

export function Navigation() {
  const { user, isAdmin, isHr, isAngajat, isInTraining } = useAuth();
  const { canOpenMentorPanel } = useAccessControl();
  const angajatMentor = isAngajatMentor(user);
  const links = buildNavLinks(
    isAdmin,
    isHr,
    canOpenMentorPanel,
    isAngajat,
    isInTraining,
    angajatMentor,
  );

  return (
    <nav className="border-t border-white/10 bg-corporate-black">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {links.map((link) => (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              [
                'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-corporate-gold text-corporate-black'
                  : 'text-white/70 hover:text-corporate-gold hover:bg-white/5',
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
