import * as React from 'react'
import { clsx } from 'clsx'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger'
}

const variants: Record<string,string> = {
  default: 'bg-accent text-accent-foreground',
  outline: 'border border-border text-foreground',
  success: 'bg-emerald-600/80 text-white',
  warning: 'bg-amber-500/80 text-slate-900',
  danger: 'bg-red-600/80 text-white'
}

export const Badge = ({ className, variant='default', ...props }: BadgeProps) => (
  <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium', variants[variant], className)} {...props} />
)

export default Badge
