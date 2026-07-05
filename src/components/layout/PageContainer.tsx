import type { ReactNode } from 'react';
import { LAYOUT_PAGE } from '@/lib/appNavigation';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Lățime mai îngustă pentru pagini centrate (login, hub) */
  narrow?: boolean;
}

export function PageContainer({ children, className = '', narrow = false }: PageContainerProps) {
  return (
    <div
      className={[
        LAYOUT_PAGE,
        narrow ? 'max-w-3xl' : 'max-w-screen-xl',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
