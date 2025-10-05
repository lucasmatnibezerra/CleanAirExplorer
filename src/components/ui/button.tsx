import * as React from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}

const variants: Record<string,string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent/90',
  secondary: 'bg-card/60 text-foreground hover:bg-card/80',
  ghost: 'hover:bg-accent/60 text-foreground',
  outline: 'border border-border bg-transparent hover:bg-card/50',
  danger: 'bg-red-600 text-white hover:bg-red-500'
}

const sizes: Record<string,string> = {
  sm: 'h-7 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  icon: 'h-8 w-8 p-0'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='primary', size='md', ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none shadow-sm',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export default Button
