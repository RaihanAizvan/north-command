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
        <svg viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="pg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.0)" />
              <stop offset="58%" stopColor="rgba(0,0,0,0.0)" />
              <stop offset="76%" stopColor="rgba(255,51,68,0.10)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <linearGradient id="pr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,51,68,0.48)" />
              <stop offset="55%" stopColor="rgba(255,176,32,0.32)" />
              <stop offset="100%" stopColor="rgba(255,51,68,0.48)" />
            </linearGradient>

            {/* sweeping highlight */}
            <linearGradient id="ps" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.26)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <filter id="pGlow">
              <feGaussianBlur stdDeviation="2.0" result="b" />
              <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.92 0" />
            </filter>
          </defs>

          {/* Simple aperture */}
          <circle cx="110" cy="110" r="86" fill="url(#pg)" />

          {/* outer ring (wavy aperture) */}
          <g filter="url(#pGlow)" className="portalRing portalRingA">
            <path
              d="M110 32
                 C132 34 150 40 164 52
                 C178 64 186 82 188 104
                 C190 128 184 146 170 160
                 C156 174 136 184 112 186
                 C88 188 68 182 54 168
                 C40 154 32 134 30 110
                 C28 86 34 66 48 52
                 C62 38 82 30 106 32
                 C120 33 124 33 110 32 Z"
              fill="none"
              stroke="url(#pr)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* inner ring */}
          <g filter="url(#pGlow)" className="portalRing portalRingB">
            <circle cx="110" cy="110" r="60" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <circle cx="110" cy="110" r="46" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          </g>

          {/* sweeping band */}
          <g className="portalSweep">
            <circle cx="110" cy="110" r="70" fill="none" stroke="url(#ps)" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
          </g>

          {/* Minimal ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 110 + Math.cos(a) * 86;
            const y1 = 110 + Math.sin(a) * 86;
            const x2 = 110 + Math.cos(a) * 96;
            const y2 = 110 + Math.sin(a) * 96;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {/* wave ring */}
          <g className="portalWave">
            <circle
              cx="110"
              cy="110"
              r="92"
              fill="none"
              stroke="rgba(255,176,32,0.14)"
              strokeWidth="2"
              strokeDasharray="10 18"
              strokeLinecap="round"
            />
            <circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke="rgba(255,51,68,0.12)"
              strokeWidth="2"
              strokeDasharray="6 16"
              strokeLinecap="round"
            />
          </g>

          {/* orbiting glints (premium, not noisy) */}
          {Array.from({ length: 5 }).map((_, i) => {
            const a = (i / 5) * Math.PI * 2;
            const r = 102;
            const cx = 110 + Math.cos(a) * r;
            const cy = 110 + Math.sin(a) * r;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={2.0}
                fill="rgba(255,255,255,0.75)"
                opacity={0.22}
                className={`portalGlint portalGlint${i}`}
              />
            );
          })}

          {/* center */}
          <circle cx="110" cy="110" r="30" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.08)" />

          <text
            x="110"
            y="114"
            textAnchor="middle"
            fontFamily="Dune Rise, ui-sans-serif, system-ui"
            fontSize="14"
            letterSpacing="6"
            fill="rgba(255,255,255,0.78)"
          >
            ENTER
          </text>
        </svg>
      </span>

    </button>
  );
}
