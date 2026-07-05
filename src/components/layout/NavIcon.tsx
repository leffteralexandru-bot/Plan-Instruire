import type { NavIconId } from '@/lib/appNavigation';

interface NavIconProps {
  id: NavIconId | 'more' | 'menu';
  className?: string;
}

export function NavIcon({ id, className = 'h-6 w-6' }: NavIconProps) {
  const sw = 1.75;
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, 'aria-hidden': true as const };

  switch (id) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
        </svg>
      );
    case 'plan':
      return (
        <svg {...common}>
          <path d="M4 5h16v14H4z" strokeLinejoin="round" />
          <path d="M8 9h8M8 13h5" strokeLinecap="round" />
        </svg>
      );
    case 'evaluations':
      return (
        <svg {...common}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'competency':
      return (
        <svg {...common}>
          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.8 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8z" strokeLinejoin="round" />
        </svg>
      );
    case 'mentor':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case 'supervisor':
      return (
        <svg {...common}>
          <path d="M12 3v18M3 12h18" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'hr':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h6M7 16h8" strokeLinecap="round" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16V9M12 16V5M17 16v-3" strokeLinecap="round" />
        </svg>
      );
    case 'account':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-3.5 5-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
        </svg>
      );
    case 'departments':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
