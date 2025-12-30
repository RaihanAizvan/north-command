import { useRef } from 'react';

export default function PortalEnter({
  onEnter,
}: {
  onEnter: (args: { originX: number; originY: number }) => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

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
        <svg viewBox="0 0 260 220" width="240" height="200">
          <defs>
            <radialGradient id="pg" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
              <stop offset="35%" stopColor="rgba(32,255,154,0.10)" />
              <stop offset="60%" stopColor="rgba(255,176,32,0.10)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <linearGradient id="pr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(160,245,255,0.95)" />
              <stop offset="40%" stopColor="rgba(32,255,154,0.85)" />
              <stop offset="100%" stopColor="rgba(255,176,32,0.85)" />
            </linearGradient>

            <filter id="pSoft">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0"
              />
            </filter>
          </defs>

          {/* Perspective frame */}
          <g transform="translate(14 14) skewX(-12)">
            <path
              d="M10 40 L206 18 L232 170 L34 190 Z"
              fill="rgba(0,0,0,0.20)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* inner aperture */}
            <ellipse cx="122" cy="108" rx="84" ry="56" fill="url(#pg)" />

            <g filter="url(#pSoft)">
              <ellipse cx="122" cy="108" rx="86" ry="58" fill="none" stroke="url(#pr)" strokeWidth="3.2" />
              <ellipse cx="122" cy="108" rx="68" ry="45" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1" />
              <ellipse cx="122" cy="108" rx="52" ry="35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            </g>

            {/* depth lines */}
            {Array.from({ length: 10 }).map((_, i) => {
              const t = i / 9;
              const x1 = 44 + t * 150;
              const y1 = 48 + Math.sin(t * Math.PI) * 22;
              const x2 = 52 + t * 150;
              const y2 = 160 - Math.sin(t * Math.PI) * 20;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {/* corner ticks */}
            {[
              { x: 18, y: 44 },
              { x: 192, y: 24 },
              { x: 218, y: 160 },
              { x: 40, y: 178 },
            ].map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r={2.2} fill="rgba(255,255,255,0.22)" />
            ))}
          </g>
        </svg>
      </span>

      <span className="portalLabel">ENTER</span>
    </button>
  );
}
