interface DeviceOutlineIconProps {
  kind: 'phone' | 'tablet' | 'laptop';
  className?: string;
}

/** Iconițe contur simple — telefon, tabletă, laptop */
export function DeviceOutlineIcon({ kind, className = 'h-5 w-5' }: DeviceOutlineIconProps) {
  const sw = 1.75;
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    'aria-hidden': true as const,
  };

  if (kind === 'phone') {
    return (
      <svg {...common}>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M11 18.5h2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'tablet') {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M10 19h4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M9 20h6" strokeLinecap="round" />
      <path d="M12 17v3" strokeLinecap="round" />
    </svg>
  );
}
