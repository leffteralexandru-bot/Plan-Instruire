import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ingineriPath } from '@/data/departments';

const stagiarLinks = [
  { to: ingineriPath(), label: 'Dashboard' },
  { to: ingineriPath('/competente'), label: 'Competențe' },
  { to: ingineriPath('/erori'), label: 'Bibliotecă erori' },
  { to: ingineriPath('/evaluari'), label: 'Evaluări' },
];

const mentorLinks = [
  { to: ingineriPath(), label: 'Dashboard' },
  { to: ingineriPath('/mentor'), label: 'Panou Mentor' },
  { to: ingineriPath('/competente'), label: 'Competențe' },
  { to: ingineriPath('/erori'), label: 'Bibliotecă erori' },
  { to: ingineriPath('/evaluari'), label: 'Evaluări' },
];

const adminLinks = [
  { to: ingineriPath(), label: 'Dashboard' },
  { to: ingineriPath('/admin'), label: 'Admin HR' },
  { to: ingineriPath('/mentor'), label: 'Panou Mentor' },
  { to: ingineriPath('/competente'), label: 'Competențe' },
  { to: ingineriPath('/evaluari'), label: 'Evaluări' },
];

export function Navigation() {
  const { isMentor, isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : isMentor ? mentorLinks : stagiarLinks;

  return (
    <nav className="border-t border-white/10 bg-corporate-black">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === ingineriPath()}
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
