import type { ReactNode } from 'react';
import { useCompactNavLayout } from '@/hooks/useCompactNavLayout';

/** Titlu pagină mare — doar pe desktop (laptop+); pe mobil/tabletă titlul e în CompactNavSectionTitle. */
export function DesktopPageHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compactNav = useCompactNavLayout();
  if (compactNav) return null;
  return <div className={className}>{children}</div>;
}
