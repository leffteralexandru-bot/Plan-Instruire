import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div className={`neural-card ${paddingMap[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
