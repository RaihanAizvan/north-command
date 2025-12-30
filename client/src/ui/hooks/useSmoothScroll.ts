import { useEffect } from 'react';
import Lenis from 'lenis';

export function useSmoothScroll(opts?: { enabled?: boolean }) {
  useEffect(() => {
    const enabled = opts?.enabled ?? true;
    if (!enabled) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.15,
      wheelMultiplier: 1.0,
    });

    (window as any).__north_lenis = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      (window as any).__north_lenis = undefined;
      lenis.destroy();
    };
  }, [opts?.enabled]);
}

export async function smoothScrollToHash(hash: string) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  if (reduce) {
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'auto', block: 'start' });
    return;
  }

  const lenis = (window as any).__north_lenis as Lenis | undefined;
  if (lenis) {
    lenis.scrollTo(hash, { offset: -90, duration: 1.1 });
    return;
  }

  const el = document.querySelector(hash);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
