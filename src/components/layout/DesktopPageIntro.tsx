import type { ReactNode } from 'react';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';

/** Subtitlu / descriere pagină — ascuns pe mobil/tabletă (bara de jos are deja titlul secțiunii). */
export function DesktopPageIntro({
  children,
  className = 'text-corporate-muted mt-1',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compactNav = useCompactNavLayout();
  if (compactNav) return null;
  return <p className={className}>{children}</p>;
}
