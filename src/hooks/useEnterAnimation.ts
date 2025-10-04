import { useEffect, useRef } from 'react';

interface Options {
  delay?: number;
  translateY?: number;
  opacityFrom?: number;
  duration?: number;
}

export function useEnterAnimation<T extends HTMLElement>(options: Options = {}) {
  const ref = useRef<T | null>(null);
  const { delay = 0, translateY = 8, opacityFrom = 0, duration = 520 } = options;

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let cancelled = false;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      return;
    }
    import('animejs').then(mod => {
      if (cancelled) return;
      const a: any = (mod as any).default || (mod as any);
      a({
        targets: el,
        opacity: [opacityFrom, 1],
        translateY: [translateY, 0],
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        delay,
        duration
      });
    });
    return () => { cancelled = true; };
  }, [delay, translateY, opacityFrom, duration]);

  return ref;
}
