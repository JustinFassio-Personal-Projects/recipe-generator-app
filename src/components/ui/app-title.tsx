import { useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';

interface AppTitleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AppTitle({ className = '', size = 'md' }: AppTitleProps) {
  const tenantContext = useContext(TenantContext);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-4xl md:text-5xl',
    lg: 'text-4xl sm:text-5xl md:text-6xl',
  };

  return (
    <h1
      className={`font-bold text-base-content ${sizeClasses[size]} ${className}`}
    >
      {tenantContext?.tenant?.name || 'Recipe Generator'}
    </h1>
  );
}
