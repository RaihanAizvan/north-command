import { useEffect, useMemo, useState } from 'react';

export type SnowIntensity = 'off' | 'light' | 'medium' | 'heavy';

const LS_KEY = 'north:snow';

export function getSavedSnow(): SnowIntensity {
  const v = localStorage.getItem(LS_KEY) as SnowIntensity | null;
  return v === 'off' || v === 'light' || v === 'medium' || v === 'heavy' ? v : 'medium';
}

export function saveSnow(v: SnowIntensity) {
  localStorage.setItem(LS_KEY, v);
}

function countFor(intensity: SnowIntensity) {
  if (intensity === 'off') return 0;
  if (intensity === 'light') return 24;
  if (intensity === 'medium') return 60;
  return 110;
}

export default function SnowLayer({ intensity }: { intensity: SnowIntensity }) {
  const [seed, setSeed] = useState(0);

  // Re-randomize on intensity changes
  useEffect(() => {
    setSeed((s) => s + 1);
  }, [intensity]);

  const flakes = useMemo(() => {
    const n = countFor(intensity);
    return Array.from({ length: n }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 8 + Math.random() * 10;
      const size = 3 + Math.random() * 4;
      const style: React.CSSProperties = {
        left: `${left}vw`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        width: size,
        height: size,
        opacity: 0.65 + Math.random() * 0.25,
      };
      return <div key={`${seed}-${i}`} className="flake" style={style} />;
    });
  }, [intensity, seed]);

  if (intensity === 'off') return null;
  return <div className="snow" aria-hidden>{flakes}</div>;
}
