import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { clsx } from 'clsx'
import { Icon } from './icons'

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectPrimitive.SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={clsx(
  'flex h-8 items-center gap-1 rounded-md border border-border bg-card/60 backdrop-blur px-2 text-xs font-medium',
  'focus-visible:outline focus-visible:outline-accent shadow-sm',
        'data-[state=open]:ring-1 data-[state=open]:ring-accent/60',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Value />
      <SelectPrimitive.Icon className="opacity-70">
        <Icon.chevronDown className="w-4 h-4" />
      </SelectPrimitive.Icon>
      {children}
    </SelectPrimitive.Trigger>
  )
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<HTMLDivElement, SelectPrimitive.SelectContentProps>(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={clsx(
          'z-50 min-w-[6rem] overflow-hidden rounded-md border border-border/70 bg-popover/95 backdrop-blur',
          'shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          className
        )}
        position={position}
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<HTMLDivElement, SelectPrimitive.SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs font-medium outline-none',
        'focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent/70 data-[state=checked]:text-accent-foreground',
        'text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Icon.check className="w-4 h-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = 'SelectItem'

export const SelectSeparator = React.forwardRef<HTMLDivElement, SelectPrimitive.SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
      ref={ref}
      className={clsx('my-1 h-px bg-border', className)}
      {...props}
    />
  )
)
SelectSeparator.displayName = 'SelectSeparator'
