import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

interface ExtendedScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  viewportRef?: React.Ref<HTMLDivElement>
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ExtendedScrollAreaProps
>(({ className, children, viewportRef, onScroll, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
  className={cn("relative overflow-hidden [&_[data-radix-scroll-area-viewport]]:scroll-smooth", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef as any}
      onScroll={onScroll as any}
      className="h-full w-full rounded-[inherit] relative"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-[background,opacity,width] duration-150 ease-out group/scrollbar",
      orientation === "vertical" &&
        "h-full w-2 border-l border-l-transparent p-[1px] hover:w-2.5",
      orientation === "horizontal" &&
        "h-2 flex-col border-t border-t-transparent p-[1px] hover:h-2.5",
      "data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className="relative flex-1 rounded-full bg-border/60 hover:bg-border/80 transition-colors before:content-[''] before:absolute before:inset-0 before:rounded-full before:ring-1 before:ring-transparent focus-visible:before:ring-ring"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
