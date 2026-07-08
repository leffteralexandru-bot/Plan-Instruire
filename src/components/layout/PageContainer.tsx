import type { ReactNode } from 'react';
import { SHELL_INNER } from '@/lib/responsiveLayout';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function PageContainer({ children, className = '', as: Tag = 'div' }: PageContainerProps) {
  return <Tag className={[SHELL_INNER, className].join(' ')}>{children}</Tag>;
}
