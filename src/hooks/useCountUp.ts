import { useEffect, useRef, useState } from 'react'

interface Options { duration?: number; easing?: (t:number)=>number }

const easeOutCubic = (t:number)=> 1 - Math.pow(1 - t, 3)

export function useCountUp(target: number | null | undefined, options: Options = {}){
  const { duration = 600, easing = easeOutCubic } = options
  const [value, setValue] = useState<number | null>(target ?? null)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(0)
  const targetRef = useRef<number | null>(target ?? null)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(()=>{
    if(target == null) { setValue(null); return }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if(reduce){ setValue(target); return }
    fromRef.current = value ?? 0
    targetRef.current = target
    startRef.current = performance.now()
    if(rafRef.current) cancelAnimationFrame(rafRef.current)
    const tick = (now: number)=>{
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / duration)
      const eased = easing(t)
      const next = fromRef.current + (targetRef.current! - fromRef.current) * eased
      setValue(parseFloat(next.toFixed(0)))
      if(t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return ()=> { if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}
