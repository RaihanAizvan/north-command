import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import WorkshopScene from '../components/WorkshopScene';
import { useAuthStore } from '../state/auth';

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function roleFromToken(token: string | null): 'OVERSEER' | 'FIELD_AGENT' | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { role?: 'OVERSEER' | 'FIELD_AGENT' };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

type Mode = 'HERO' | 'PLAN' | 'REVIEW' | 'CELEBRATE';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Landing() {
  const { token, role } = useAuthStore();
  const effectiveRole = role ?? roleFromToken(token);
  if (token) return <Navigate to={effectiveRole === 'OVERSEER' ? '/santa' : '/elf'} replace />;

  const [mode, setMode] = useState<Mode>('HERO');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let v = 0;

    const tick = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      // smooth velocity; keeps transitions calm
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

  useEffect(() => {
    const els: HTMLElement[] = Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible) return;
        const m = (visible.target as HTMLElement).dataset.section as Mode | undefined;
        if (m) setMode(m);

        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.classList.add('inView');
        }
      },
      { threshold: [0.15, 0.25, 0.35, 0.45, 0.55] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const velocityClass = useMemo(() => {
    const a = Math.abs(scrollVelocity);
    if (a > 24) return 'vFast';
    if (a > 10) return 'vMed';
    return 'vLow';
  }, [scrollVelocity]);

  return (
    <div className={`landingGiulio ${velocityClass}`}>
      {/* Always visible scene layer (does not block scroll) */}
      <div className="landingSceneFixed">
        <WorkshopScene scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} mode={mode} />
      </div>

      <header className="landingTopNav">
        <div className="landingTopNavInner landingTopNavInnerEdge">
          <Link to="/login" className="landingTopCta">
            Enter Console
          </Link>
        </div>
      </header>

      <main className="landingScroll">
        <section className="landingBlock landingHero" data-section="HERO">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingKicker">Immersive control • elegant motion</div>
              <div className="landingSideTitle">Workshop console</div>
              <div className="landingP">
                Santa stays visible. The story panels stay on the edges.
              </div>
              <div className="landingActions" style={{ marginTop: 12 }}>
                <Link className="landingBtnPrimary" to="/login">
                  Enter
                </Link>
                <a className="landingBtnGhost" href="#plan">
                  Brief
                </a>
              </div>
            </div>
          </div>

          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingH2">Status</div>
              <div className="landingP" style={{ marginTop: 8 }}>
                Scroll changes mood. Cursor adds life. Center stays clear.
              </div>
            </div>
          </div>
        </section>

        <section id="plan" className="landingBlock" data-section="PLAN">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingH2">Plan</div>
              <p className="landingP">Tasks align into a sequence. Motion stays calm and readable.</p>
              <div className="landingRow">
                <div className="landingMiniCard">
                  <div className="landingMiniTitle">Stations</div>
                  <div className="landingMiniBody">Assign work with clarity and minimal friction.</div>
                </div>
                <div className="landingMiniCard">
                  <div className="landingMiniTitle">Batches</div>
                  <div className="landingMiniBody">Track progress across production, QC, and packing.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landingBlock" data-section="REVIEW">
          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingH2">Review</div>
              <p className="landingP">War-room visibility. Distress signals. Payload progress. Broadcasts.</p>
              <div className="landingRow">
                <div className="landingMiniCard">
                  <div className="landingMiniTitle">War Room</div>
                  <div className="landingMiniBody">Every station becomes a status card. No refresh.</div>
                </div>
                <div className="landingMiniCard">
                  <div className="landingMiniTitle">NorthBot</div>
                  <div className="landingMiniBody">Markdown replies for crisp instructions.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landingBlock" data-section="CELEBRATE">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingH2">Completion</div>
              <p className="landingP">A restrained celebration: warm accents, stable motion, and a clean handoff.</p>
              <div className="landingActions">
                <Link className="landingBtnPrimary" to="/login">
                  Enter
                </Link>
                <a className="landingBtnGhost" href="#top">
                  Back to top
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="landingFooterGiulio">
          <div>© NORTH-COMMAND • Santa Workshop Layer</div>
        </footer>
      </main>
    </div>
  );
}
