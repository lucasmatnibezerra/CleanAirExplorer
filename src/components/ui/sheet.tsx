// Consolidated shadcn-style Sheet component (removed earlier duplicate implementation)
import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from './dialog';


const Sheet = Dialog;
const SheetTrigger = DialogTrigger;

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogContent> & { side?: 'left' | 'right' | 'bottom' | 'top' }
>(({ className, side = 'right', ...props }, ref) => {
  const sideClasses: Record<string, string> = {
    right: 'inset-y-0 right-0 h-full w-80 border-l',
    left: 'inset-y-0 left-0 h-full w-80 border-r',
    bottom: 'inset-x-0 bottom-0 w-full border-t rounded-t-xl',
    top: 'inset-x-0 top-0 w-full border-b rounded-b-xl'
  };
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className={cn('fixed z-50', sideClasses[side])}>
        <DialogContent
          ref={ref as any}
          className={cn(
            'm-0 h-full w-full rounded-none border bg-card text-card-foreground shadow-lg p-4 flex flex-col gap-2 data-[state=open]:animate-in data-[state=closed]:animate-out',
            side === 'right' && 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            side === 'left' && 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
            side === 'bottom' && 'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            side === 'top' && 'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
            className
          )}
          {...props}
        />
      </div>
    </DialogPortal>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
);
const SheetTitle = DialogTitle;
const SheetDescription = DialogDescription;
const SheetClose = DialogClose;

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
};
