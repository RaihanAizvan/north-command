import { useLayoutEffect, useRef } from 'react';

export default function PortalEnter({
  onEnter,
}: {
  onEnter: (args: { originX: number; originY: number }) => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    // ensure layout is stable
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className="portalBtn"
      onClick={() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const originX = (r.left + r.width / 2) / Math.max(1, window.innerWidth);
        const originY = (r.top + r.height / 2) / Math.max(1, window.innerHeight);
        onEnter({ originX, originY });
      }}
    >
      <span className="portalSvg" aria-hidden="true">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <defs>
            <radialGradient id="pGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
              <stop offset="38%" stopColor="rgba(255,176,32,0.25)" />
              <stop offset="65%" stopColor="rgba(32,255,154,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id="pRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(32,255,154,0.95)" />
              <stop offset="45%" stopColor="rgba(255,176,32,0.95)" />
              <stop offset="100%" stopColor="rgba(255,51,68,0.95)" />
            </linearGradient>
            <filter id="pBlur">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
              />
            </filter>
          </defs>

          <circle cx="110" cy="110" r="86" fill="url(#pGlow)" />

          <g filter="url(#pBlur)">
            <circle cx="110" cy="110" r="78" fill="none" stroke="url(#pRing)" strokeWidth="3.5" opacity="0.9" />
            <circle cx="110" cy="110" r="64" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <circle cx="110" cy="110" r="48" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          </g>

          {/* ticks */}
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const x1 = 110 + Math.cos(a) * 88;
            const y1 = 110 + Math.sin(a) * 88;
            const x2 = 110 + Math.cos(a) * 98;
            const y2 = 110 + Math.sin(a) * 98;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {/* core */}
          <circle cx="110" cy="110" r="34" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.14)" />
          <circle cx="110" cy="110" r="28" fill="rgba(0,0,0,0.15)" />
        </svg>
      </span>

      <span className="portalLabel">ENTER</span>
    </button>
  );
}
