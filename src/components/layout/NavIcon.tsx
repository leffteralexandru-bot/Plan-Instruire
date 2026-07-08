export type NavIconId =
  | 'dashboard'
  | 'hr'
  | 'angajat'
  | 'plan'
  | 'mentor'
  | 'supervisor'
  | 'evaluations'
  | 'competencies';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function NavIcon({ id, className = 'h-5 w-5' }: { id: NavIconId; className?: string }) {
  switch (id) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path {...stroke} d="M4 19V5M4 19h16M8 19V11M12 19V7M16 19v-5" />
        </svg>
      );
    case 'hr':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...stroke} x="5" y="3" width="14" height="18" rx="2" />
          <path {...stroke} d="M9 7h6M9 11h6M9 15h4" />
        </svg>
      );
    case 'angajat':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle {...stroke} cx="12" cy="8" r="3.5" />
          <path {...stroke} d="M5 20v-1a5 5 0 0 1 10 0v1" />
          <rect {...stroke} x="3" y="3" width="18" height="18" rx="3" strokeOpacity="0.35" />
        </svg>
      );
    case 'plan':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path {...stroke} d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2z" />
          <path {...stroke} d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'mentor':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle {...stroke} cx="9" cy="8" r="2.5" />
          <circle {...stroke} cx="16" cy="9" r="2" />
          <path {...stroke} d="M4 19v-1a4 4 0 0 1 4-4h2M14 14a3.5 3.5 0 0 1 3.5 3.5V19" />
        </svg>
      );
    case 'supervisor':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path {...stroke} d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z" />
        </svg>
      );
    case 'evaluations':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect {...stroke} x="5" y="3" width="14" height="18" rx="2" />
          <path {...stroke} d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'competencies':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle {...stroke} cx="12" cy="9" r="5" />
          <path {...stroke} d="M8.5 14.5 7 21l5-2.5L17 21l-1.5-6.5" />
        </svg>
      );
  }
}
