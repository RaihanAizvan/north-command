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
          <nav className="landingNavSci">
            <a className="landingNavLink" href="#plan">Plan</a>
            <a className="landingNavLink" href="#review">Review</a>
            <a className="landingNavLink" href="#security">Security</a>
            <Link to="/login" className="landingTopCta">Enter Console</Link>
          </nav>
        </div>
      </header>

      <main className="landingScroll">
        <section className="landingBlock landingHero" data-section="HERO">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">NORTH-COMMAND</div>
              <div className="landingSideTitle">Industrial task control for Santa’s Workshop.</div>
              <div className="landingP">Elf management for Santa.</div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">[ ENTER CONSOLE ]</Link>
                <a className="landingLink" href="#plan">[ READ BRIEF ]</a>
              </div>
            </div>
          </div>
          <div className="landingSideSpacer" />
        </section>

        <section className="landingBlock" data-section="STATUS">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">SYSTEM STATUS</div>
              <div className="landingBig">Realtime orchestration for the final window.</div>
              <div className="landingP">Socket.IO pushes station distress, work-order transitions, and broadcasts without refresh.</div>
              <div className="landingP">The center stays clear so Santa is always visible — the interface stays on the edges.</div>
            </div>
          </div>
          <div className="landingSideSpacer" />
        </section>

        <section id="plan" className="landingBlock" data-section="PLAN">
          <div className="landingSideSpacer" />
          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingEyebrow">PLAN</div>
              <div className="landingSideTitle">One station. One work-order. No noise.</div>
              <div className="landingP">
                Field Agents operate a single active work-order at a time. Status cycles through:
                <span className="landingCode">IN PRODUCTION</span> → <span className="landingCode">QC‑RELEVANT</span> → <span className="landingCode">PACKED</span>.
              </div>
              <div className="landingP">
                If a station fails, <span className="landingEm">STATION DOWN</span> triggers a live alert to the Overseer.
              </div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">[ FIELD AGENT LOGIN ]</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="review" className="landingBlock" data-section="REVIEW">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">REVIEW</div>
              <div className="landingSideTitle">Overseer view: the War Room grid.</div>
              <div className="landingP">
                Every station is a card.
                <span className="landingDot landingDotGreen" /> Active production.
                <span className="landingDot landingDotGrey" /> Idle.
                <span className="landingDot landingDotOrange" /> Distress.
              </div>
              <div className="landingP">
                Sleigh Payload Meter increments as batches are marked <span className="landingCode">PACKED</span>.
              </div>
              <div className="landingP">Global Broadcast pushes scrolling text to all stations in realtime.</div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">[ OVERSEER LOGIN ]</Link>
              </div>
            </div>
          </div>
          <div className="landingSideSpacer" />
        </section>

        <section id="security" className="landingBlock" data-section="CELEBRATE">
          <div className="landingSideSpacer" />
          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingEyebrow">SECURITY</div>
              <div className="landingSideTitle">Dual-path access. Clear boundaries.</div>
              <div className="landingP">
                Overseer and Field Agent roles are separated by server-side authorization.
                Station binding prevents cross-station control.
              </div>
              <div className="landingP">
                NorthBot provides task assistance with Markdown formatting for crisp checklists.
              </div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">[ AUTHENTICATE ]</Link>
                <a className="landingLink" href="#top">[ RESET VIEW ]</a>
              </div>
            </div>
          </div>
        </section>

        <footer className="landingFooterGiulio">
          <div className="landingFooterGrid">
            <div>
              <div className="landingFooterTitle">NORTH-COMMAND</div>
              <div className="landingFooterText">Realtime industrial orchestration for Santa’s Workshop.</div>
            </div>
            <div>
              <div className="landingFooterTitle">STACK</div>
              <div className="landingFooterText">React + TypeScript • Express • MongoDB • Socket.IO</div>
            </div>
            <div>
              <div className="landingFooterTitle">ACCESS</div>
              <div className="landingFooterText">
                <Link className="landingFooterLink" to="/login">Enter Console</Link>
              </div>
            </div>
          </div>
          <div className="landingFooterBottom">© {new Date().getFullYear()} • Operational UI • Dark winter accent</div>
        </footer>
      </main>
    </div>
  );
}
