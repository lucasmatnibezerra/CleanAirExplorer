import * as React from 'react'
import { clsx } from 'clsx'

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx('rounded-xl ring-1 ring-border/60 bg-card/60 backdrop-blur p-4', className)}
    {...props}
  />
)

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('mb-2 flex items-center justify-between gap-4', className)} {...props} />
)
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx('font-semibold tracking-tight text-sm', className)} {...props} />
)
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('space-y-3', className)} {...props} />
)
