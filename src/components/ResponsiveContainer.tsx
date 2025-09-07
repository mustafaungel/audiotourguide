import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  mobilePadding?: boolean;
  mobileStack?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  maxWidth = 'lg',
  mobilePadding = true,
  mobileStack = false
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <Component 
      className={cn(
        'mx-auto',
        // Mobile-first padding
        mobilePadding ? 'px-mobile-padding sm:px-6 lg:px-8' : 'px-4 sm:px-6 lg:px-8',
        // Mobile stacking
        mobileStack && 'mobile-stack',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </Component>
  );
};