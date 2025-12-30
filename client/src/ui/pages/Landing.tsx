import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

export default function Landing() {
  const { token, role } = useAuthStore();
  const effectiveRole = role ?? roleFromToken(token);

  // auth-aware redirect
  if (token) return <Navigate to={effectiveRole === 'OVERSEER' ? '/santa' : '/elf'} replace />;

  return (
    <div className="landingRoot">
      <ParallaxBg />

      <header className="landingHeader">
        <div className="landingBrand">
          <div className="landingMark">SANTA’S WORKSHOP</div>
          <div className="landingSub">Task Orchestration • Elf Ops • Santa Overview</div>
        </div>
        <nav className="landingNav">
          <a href="#workflow" className="landingNavLink">Workflow</a>
          <a href="#tasks" className="landingNavLink">Tasks</a>
          <a href="#control" className="landingNavLink">Control</a>
          <Link to="/login" className="landingEnter">Enter Console</Link>
        </nav>
      </header>

      <main className="landingMain">
        <section className="landingHero" id="top">
          <div className="landingHeroInner">
            <div className="landingKicker">WHIMSICAL • PREMIUM • OPERATIONAL</div>
            <h1 className="landingTitle">A living workshop where work is always in motion — never out of control.</h1>
            <p className="landingLead">
              NORTH-COMMAND’s workshop layer gives elves a focused task station and gives Santa a high-level overview.
              Motion is playful, but the system stays sharp.
            </p>
            <div className="landingCtas">
              <Link to="/login" className="landingPrimary">Enter</Link>
              <a href="#workflow" className="landingSecondary">View Brief</a>
            </div>
            <div className="landingHint">Scroll — the workshop responds.</div>
          </div>
        </section>

        <ScrollStory />

        <footer className="landingFooter">
          <div className="landingFooterInner">
            <div>© NORTH-COMMAND • Workshop Layer</div>
            <div style={{ opacity: 0.8 }}>Built for focused execution.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(Boolean(mq.matches));
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function ParallaxBg() {
  const reduced = useReducedMotion();
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const bg = bgRef.current;
    if (!bg) return;

    const layers = {
      gA: bg.querySelector<HTMLElement>('.landingGlowA'),
      gB: bg.querySelector<HTMLElement>('.landingGlowB'),
      gC: bg.querySelector<HTMLElement>('.landingGlowC'),
      l1: bg.querySelector<HTMLElement>('.landingLayer1'),
      l2: bg.querySelector<HTMLElement>('.landingLayer2'),
      l3: bg.querySelector<HTMLElement>('.landingLayer3'),
    };

    const state = {
      scrollY: window.scrollY,
      targetScrollY: window.scrollY,
      px: 0.5,
      py: 0.3,
      tpx: 0.5,
      tpy: 0.3,
    };

    let raf = 0;

    const onScroll = () => {
      state.targetScrollY = window.scrollY;
    };

    const onMove = (e: PointerEvent) => {
      state.tpx = e.clientX / Math.max(1, window.innerWidth);
      state.tpy = e.clientY / Math.max(1, window.innerHeight);
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      // inertia
      state.scrollY = lerp(state.scrollY, state.targetScrollY, 0.08);
      state.px = lerp(state.px, state.tpx, 0.06);
      state.py = lerp(state.py, state.tpy, 0.06);

      const dy = state.scrollY;
      const mx = (state.px - 0.5) * 18;
      const my = (state.py - 0.5) * 12;

      layers.l1 && (layers.l1.style.transform = `translate3d(${mx * 0.25}px, ${dy * 0.03 + my * 0.25}px, 0)`);
      layers.l2 && (layers.l2.style.transform = `translate3d(${mx * 0.18}px, ${dy * 0.02 + my * 0.18}px, 0)`);
      layers.l3 && (layers.l3.style.transform = `translate3d(${mx * 0.12}px, ${dy * 0.014 + my * 0.12}px, 0)`);

      layers.gA && (layers.gA.style.transform = `translate3d(${mx * -0.30}px, ${dy * -0.012 + my * -0.2}px, 0)`);
      layers.gB && (layers.gB.style.transform = `translate3d(${mx * 0.25}px, ${dy * -0.010 + my * -0.16}px, 0)`);
      layers.gC && (layers.gC.style.transform = `translate3d(${mx * 0.10}px, ${dy * 0.010 + my * 0.12}px, 0)`);

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return (
    <div ref={bgRef} className="landingBg" aria-hidden="true">
      <div className="landingGlow landingGlowA" />
      <div className="landingGlow landingGlowB" />
      <div className="landingGlow landingGlowC" />
      <div className="landingParallax landingLayer1" />
      <div className="landingParallax landingLayer2" />
      <div className="landingParallax landingLayer3" />
      <SnowField />
    </div>
  );
}

function SnowField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let raf = 0;
    let width = 0;
    let height = 0;

    const pointer = { x: 0.5, y: 0.3 };

    type Flake = { x: number; y: number; r: number; s: number; vx: number; vy: number; o: number };
    const flakes: Flake[] = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      flakes.length = 0;
      const count = Math.floor((width * height) / 18000);
      for (let i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 2.4,
          s: Math.random(),
          vx: -0.05 + Math.random() * 0.1,
          vy: 0.25 + Math.random() * 0.65,
          o: 0.25 + Math.random() * 0.55,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      for (const f of flakes) {
        const nudgeX = (pointer.x - 0.5) * 10 * f.s;
        const nudgeY = (pointer.y - 0.5) * 6 * f.s;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.o})`;
        ctx.arc(f.x + nudgeX, f.y + nudgeY, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let running = true;

    function step() {
      if (!running) return;
      if (!reduced) {
        for (const f of flakes) {
          f.x += f.vx;
          f.y += f.vy;
          if (f.y > height + 10) {
            f.y = -10;
            f.x = Math.random() * width;
          }
          if (f.x < -10) f.x = width + 10;
          if (f.x > width + 10) f.x = -10;
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });

    const onVis = () => {
      running = document.visibilityState === 'visible';
      if (running) {
        cancelAnimationFrame(raf);
        step();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    resize();
    step();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="landingSnow" />;
}

function ScrollStory() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-float]'));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.classList.add('inView');
        }
      },
      { threshold: 0.18 }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={rootRef} className="landingStory">
      <section id="workflow" className="landingSection" data-float>
        <div className="landingSectionInner">
          <h2 className="landingH2">Workflow that feels guided, not linear.</h2>
          <p className="landingP">
            As you scroll, sections ease into place with subtle inertia, overlapping slightly before settling — like suspended
            paper tags on invisible strings.
          </p>
          <div className="landingStrip">
            <div className="landingChip">Assign</div>
            <div className="landingChip">Track</div>
            <div className="landingChip">Resolve</div>
            <div className="landingChip">Ship</div>
          </div>
        </div>
      </section>

      <PinnedTaskShowcase />

      <section id="control" className="landingSection" data-float>
        <div className="landingSectionInner">
          <h2 className="landingH2">All control in your hands.</h2>
          <p className="landingP">
            Motion adds personality without chaos. Glows and shadows shift as elements enter and exit, creating depth without
            heavy 3D.
          </p>
          <div className="landingGrid">
            <InfoCard title="Focused Stations" body="Elves see what matters now: the next task, the next decision." />
            <InfoCard title="Confident Transitions" body="Status changes feel tangible — smooth, not noisy." />
            <InfoCard title="Premium Calm" body="Cozy magic layered on serious usability." />
          </div>
          <div style={{ marginTop: 18 }}>
            <Link to="/login" className="landingPrimary">Enter Console</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="landingInfoCard">
      <div className="landingInfoTitle">{title}</div>
      <div className="landingInfoBody">{body}</div>
    </div>
  );
}

function PinnedTaskShowcase() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pin, setPin] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      // Pin zone: when the container reaches ~top 20% until it exits.
      const shouldPin = rect.top < window.innerHeight * 0.22 && rect.bottom > window.innerHeight * 0.55;
      setPin(shouldPin);

      // Horizontal glide tied to scroll progress.
      const track = el.querySelector<HTMLElement>('[data-track]');
      if (track) {
        const total = rect.height - window.innerHeight * 0.5;
        const progressed = Math.min(1, Math.max(0, (window.innerHeight * 0.22 - rect.top) / Math.max(1, total)));
        track.style.transform = `translateX(${Math.round(-progressed * 160)}px)`;
        track.style.opacity = String(0.65 + progressed * 0.35);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced]);

  return (
    <section id="tasks" ref={wrapRef} className={`landingSection landingPinned ${pin ? 'isPinned' : ''}`} data-float>
      <div className="landingSectionInner">
        <h2 className="landingH2">Tasks that glide — then dissolve back into the flow.</h2>
        <p className="landingP">A hint of horizontal motion inside vertical scroll. Premium, playful, controlled.</p>
      </div>
      <div className="landingTaskRail" data-track>
        <TaskCard
          tone="green"
          title="Wrap & Seal"
          body="Confirm batch integrity. Seal with ribbon lock. Update status." 
          meta="ELF-07 • 02:14 ETA"
        />
        <TaskCard tone="red" title="Repair Conveyor" body="Motor stutter detected. Run 3-step diagnostic." meta="ELF-02 • BLOCKING" />
        <TaskCard
          tone="blue"
          title="Quality Pass"
          body="Spot-check moving parts. Log deviations with photo + note." 
          meta="ELF-05 • QC"
        />
        <TaskCard
          tone="pine"
          title="Inventory Sync"
          body="Update stock ledger. Flag low-count components." 
          meta="ELF-01 • 6 mins"
        />
      </div>
    </section>
  );
}

function TaskCard({
  title,
  body,
  meta,
  tone,
}: {
  title: string;
  body: string;
  meta: string;
  tone: 'red' | 'green' | 'blue' | 'pine';
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * 6;
      const ry = (x - 0.5) * 8;
      el.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={`landingTaskCard tone-${tone}`}>
      <div className="landingTaskTitle">{title}</div>
      <div className="landingTaskBody">{body}</div>
      <div className="landingTaskMeta">{meta}</div>
    </div>
  );
}
