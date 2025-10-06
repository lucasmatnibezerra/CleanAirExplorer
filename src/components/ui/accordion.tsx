import React, { createContext, useContext, useState } from 'react'
import { Icon } from './icons'

type AccordionContextType = {
  openValue: string | null
  setOpenValue: (v: string | null) => void
}

const AccordionContext = createContext<AccordionContextType | null>(null)

export const Accordion: React.FC<React.PropsWithChildren<{ defaultValue?: string | null }>> = ({ defaultValue = null, children }) => {
  const [openValue, setOpenValue] = useState<string | null>(defaultValue ?? null)
  return (
    <AccordionContext.Provider value={{ openValue, setOpenValue }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  )
}

export const AccordionItem: React.FC<React.PropsWithChildren<{ value: string }>> = ({ value, children }) => {
  return (
    <div className="rounded-lg overflow-hidden">
      {/* children will be Trigger and Content */}
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child
        // add borders between trigger and content via wrapper classes
        const extra = idx === 0 ? 'border border-neutral-700/40 rounded-lg bg-card/50' : ''
        const el = child as React.ReactElement
  const props = { itemValue: value, className: `${((el.props as any)?.className) ?? ''} ${extra}` }
        return React.cloneElement(el, props as any)
      })}
    </div>
  )
}

export const AccordionTrigger: React.FC<React.PropsWithChildren<{ itemValue?: string; className?: string }>> = ({ children, itemValue, className }) => {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionTrigger must be used inside Accordion')
  const isOpen = ctx.openValue === itemValue
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={() => ctx.setOpenValue(isOpen ? null : itemValue ?? null)}
      className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 ${className ?? ''}`}
    >
      <div className="flex-1">{children}</div>
      <Icon.chevronDown className={`w-5 h-5 text-neutral-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
    </button>
  )
}

export const AccordionContent: React.FC<React.PropsWithChildren<{ itemValue?: string; className?: string }>> = ({ children, itemValue, className }) => {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionContent must be used inside Accordion')
  const isOpen = ctx.openValue === itemValue
  return (
    <div
      role="region"
      aria-hidden={!isOpen}
      className={`px-4 pb-4 pt-2 text-sm text-neutral-300 transition-[max-height,opacity] duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'} ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

export default Accordion
