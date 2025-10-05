import * as React from 'react'
import { clsx } from 'clsx'

export const Toolbar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('flex items-center gap-2', className)} {...props} />
)
