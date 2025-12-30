import { ReactNode, useEffect, useMemo, useState } from 'react';
import WorkshopScene from './WorkshopScene';

export type SceneMode = 'HERO' | 'PLAN' | 'REVIEW' | 'CELEBRATE';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function SceneLayout({
  mode,
  topRight,
  children,
}: {
  mode: SceneMode;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let v = 0;

    const tick = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      v = v * 0.85 + dy * 0.15;

      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = clamp(y / max, 0, 1);

      setScrollProgress(p);
      setScrollVelocity(v);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const velocityClass = useMemo(() => {
    const a = Math.abs(scrollVelocity);
    if (a > 24) return 'vFast';
    if (a > 10) return 'vMed';
    return 'vLow';
  }, [scrollVelocity]);

  return (
    <div className={`sceneGiulio ${velocityClass}`}>
      <div className="sceneFixed">
        <WorkshopScene scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} mode={mode} />
      </div>

      <header className="sceneTopNav">
        <div className="sceneTopNavInner">
          <div className="sceneTopBrand">
            <div className="sceneTopBrandMark">NORTH-COMMAND</div>
            <div className="sceneTopBrandSub">Santa’s Workshop • Secure Access</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{topRight}</div>
        </div>
      </header>

      <main className="sceneScroll">{children}</main>
    </div>
  );
}
