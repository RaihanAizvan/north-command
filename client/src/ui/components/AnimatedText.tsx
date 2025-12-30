import React, { useMemo } from 'react';

type Variant = 'glitchFlip' | 'glitch';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AnimatedText({
  text,
  as = 'div',
  className,
  seed = 1337,
  variant = 'glitchFlip',
  style,
}: {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  seed?: number;
  variant?: Variant;
  style?: React.CSSProperties;
}) {
  const Tag = as as any;

  const letters = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from(text).map((ch, i) => {
      const isSpace = ch === ' ';
      return {
        ch,
        i,
        isSpace,
        d: Math.round((rnd() * 900 + i * 38) * 10) / 10, // stagger + random
        j: Math.round((rnd() * 18) * 10) / 10,
      };
    });
  }, [text, seed]);

  return (
    <Tag className={`aText ${variant} ${className ?? ''}`} style={style} aria-label={text}>
      {letters.map((l) => {
        if (l.isSpace) {
          return (
            <span key={l.i} className="aTextSpace" aria-hidden="true">
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={l.i}
            className="aTextCh"
            aria-hidden="true"
            style={{
              ['--d' as any]: `${l.d}ms`,
              ['--j' as any]: `${l.j}`,
            }}
          >
            <span className="aTextChInner">{l.ch}</span>
          </span>
        );
      })}
    </Tag>
  );
}
