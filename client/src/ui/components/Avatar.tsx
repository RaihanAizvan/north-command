import React from 'react';

function hash(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

function colorFrom(str: string) {
  const h = hash(str);
  const r = 80 + (h & 0xff) % 120;
  const g = 80 + ((h >>> 8) & 0xff) % 120;
  const b = 80 + ((h >>> 16) & 0xff) % 120;
  return `rgb(${r}, ${g}, ${b})`;
}

export function Avatar({ name, size = 32, role }: { name: string; size?: number; role?: 'OVERSEER' | 'FIELD_AGENT' }) {
  const bg = colorFrom(name);
  const hatColor = role === 'OVERSEER' ? '#ff6b6b' : '#65f0a5';
  const border = role === 'OVERSEER' ? 'rgba(255,107,107,0.5)' : 'rgba(101,240,165,0.5)';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${border}`,
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        background: bg,
        display: 'grid',
        placeItems: 'center',
        color: 'rgba(0,0,0,0.75)',
        fontWeight: 800,
      }}
      aria-label={name}
    >
      <div style={{ fontSize: Math.max(12, size / 3) }}>{name.slice(0, 2).toUpperCase()}</div>
      {/* festive hat */}
      <div
        style={{
          position: 'absolute',
          top: -size * 0.15,
          left: size * 0.02,
          width: size * 0.7,
          height: size * 0.4,
          background: hatColor,
          borderTopLeftRadius: size * 0.6,
          borderTopRightRadius: size * 0.6,
          transform: 'rotate(-12deg)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.05,
          width: size * 0.8,
          height: size * 0.16,
          background: '#fff',
          borderRadius: size * 0.2,
          opacity: 0.9,
          transform: 'rotate(-12deg)',
        }}
      />
      {/* cutout footer */}
      <div
        style={{
          position: 'absolute',
          bottom: -size * 0.08,
          left: -size * 0.05,
          width: size * 1.2,
          height: size * 0.35,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: size * 0.4,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25) inset',
        }}
      />
    </div>
  );
}
