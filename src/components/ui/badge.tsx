import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const variants: Record<string,string> = {
    default: 'bg-primary text-primary-foreground shadow',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground'
  };
  return (
    <div className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', variants[variant], className)} {...props} />
  );
};
