import type { ReactNode } from 'react';
import type { DepartmentId } from '@/data/departments';

interface DepartmentGlyphProps {
  id: DepartmentId;
  className?: string;
}

/** Iconițe line-art — stil artGRANIT (auriu, minimal, piatră) */
export function DepartmentGlyph({ id, className = 'h-5 w-5' }: DepartmentGlyphProps) {
  const stroke = 'currentColor';
  const sw = 1.35;

  const glyphs: Record<DepartmentId, ReactNode> = {
    administratie: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="1.5" stroke={stroke} strokeWidth={sw} />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </>
    ),
    management: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M3 19h20" stroke={stroke} strokeWidth={sw} strokeLinecap="round" opacity={0.45} />
      </>
    ),
    ingineri: (
      <>
        <path d="M5 19L12 4l7 15" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M8.5 13h7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="12" cy="4" r="1.25" fill={stroke} />
      </>
    ),
    productie: (
      <>
        <path
          d="M12 3L20 8.5v7L12 21 4 15.5v-7L12 3z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path d="M12 3v18M4 8.5l8 4.5 8-4.5" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={0.5} />
      </>
    ),
    montatori: (
      <>
        <path d="M3 14h18" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M3 14v1.5h18V14" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M6 14V10M18 14V10" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M6 10h12" stroke={stroke} strokeWidth={sw} strokeLinecap="round" opacity={0.55} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {glyphs[id]}
    </svg>
  );
}

export const DEPT_SHORT_LABELS: Record<DepartmentId, string> = {
  administratie: 'Administrație',
  management: 'Management',
  ingineri: 'Ingineri',
  productie: 'Producție',
  montatori: 'Montatori',
};
