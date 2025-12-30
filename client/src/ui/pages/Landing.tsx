import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useSmoothScroll, smoothScrollToHash } from '../hooks/useSmoothScroll';
import PortalEnter from '../components/PortalEnter';
import WorkshopScene from "../components/WorkshopScene";
import { useAuthStore } from "../state/auth";

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function roleFromToken(
  token: string | null
): "OVERSEER" | "FIELD_AGENT" | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      role?: "OVERSEER" | "FIELD_AGENT";
    };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

type Mode = "HERO" | "PLAN" | "REVIEW" | "CELEBRATE";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Landing() {
  const nav = useNavigate();
  const { token, role } = useAuthStore();
  const effectiveRole = role ?? roleFromToken(token);
  if (token)
    return (
      <Navigate to={effectiveRole === "OVERSEER" ? "/santa" : "/elf"} replace />
    );

  useSmoothScroll({ enabled: true });

  const [mode, setMode] = useState<Mode>("HERO");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [portalZoom, setPortalZoom] = useState<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0.75,
    y: 0.2,
  });

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

      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = clamp(y / max, 0, 1);

      setScrollProgress(p);
      setScrollVelocity(v);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const els: HTMLElement[] = Array.from(
      document.querySelectorAll("[data-section]")
    ) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
          )[0];

        if (!visible) return;
        const m = (visible.target as HTMLElement).dataset.section as
          | Mode
          | undefined;
        if (m) setMode(m);

        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.classList.add("inView");
        }
      },
      { threshold: [0.15, 0.25, 0.35, 0.45, 0.55] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const velocityClass = useMemo(() => {
    const a = Math.abs(scrollVelocity);
    if (a > 24) return "vFast";
    if (a > 10) return "vMed";
    return "vLow";
  }, [scrollVelocity]);

  return (
    <div
      className={`landingGiulio ${velocityClass} ${portalZoom.active ? 'portalZooming' : ''}`}
      data-mode={mode}
      style={{
        // used by css for transform-origin / zoom focus
        ['--portal-x' as const]: `${portalZoom.x * 100}%`,
        ['--portal-y' as const]: `${portalZoom.y * 100}%`,
      } as React.CSSProperties}
    >
      <div className="portalOverlay" aria-hidden="true" />
      {/* Always visible scene layer (does not block scroll) */}
      <div className="landingSceneFixed">
        <WorkshopScene
          scrollProgress={scrollProgress}
          scrollVelocity={scrollVelocity}
          mode={mode}
        />
      </div>

      <header className="landingTopNav">
        <div className="landingTopNavInner landingTopNavInnerEdge">
          <nav className="landingNavSci">
            <a
              className="landingNavLink"
              href="#plan"
              aria-current={mode === 'PLAN' ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToHash('#plan');
              }}
            >
              PL
            </a>
            <a
              className="landingNavLink"
              href="#review"
              aria-current={mode === 'REVIEW' ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToHash('#review');
              }}
            >
              RV
            </a>
            <a
              className="landingNavLink"
              href="#security"
              aria-current={mode === 'CELEBRATE' ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToHash('#security');
              }}
            >
              SC
            </a>
            <Link to="/login" className="landingTopCta">
              GO
            </Link>
          </nav>
        </div>
      </header>

      <main className="landingScroll">
        <section className="landingBlock landingHero" data-section="HERO">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">NORTH-COMMAND</div>
              <div className="landingSideTitle">A Task Management tool for</div>
              <div className="landingSideTitle" style={{ marginTop: 6 }}>
                <span style={{ color: 'red' }}>santa</span>
              </div>
              <div className="landingP">Santa is bored without a tool for managing tasks with elfs. Here is the utimate task manament tool that santa really needs.</div>
              <div className="landingP">North Command is a commanding tool, where overseer (santa) can assign and manage tasks to agents(elfs)</div>
              <div className="landingP">It also hav features like analytics, Live chat, notification managemt etc</div>
              <div className="landingLinks">
                <a className="landingLink" href="#plan">[ READ BRIEF ]</a>
              </div>
            </div>
          </div>

          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <PortalEnter
                onEnter={({ originX, originY }) => {
                  if (portalZoom.active) return;
                  setPortalZoom({ active: true, x: originX, y: originY });
                  window.setTimeout(() => nav('/login'), 900);
                }}
              />
            </div>
          </div>
        </section>

                <section id="plan" className="landingBlock" data-section="PLAN">
          <div className="landingSideSpacer" />
          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingEyebrow">PLAN</div>
              <div className="landingSideTitle">One Dashbord. Manage Everything</div>
              <div className="landingP">
                Elfs operate a single work-order.
                Status cycles through:
                <span className="landingCode">IN PRODUCTION</span> →{" "}
                <span className="landingCode">QC‑RELEVANT</span> →{" "}
                <span className="landingCode">PACKED</span>.
              </div>
              <div className="landingP">
                If a station fails,{" "}
                <span className="landingEm">STATION DOWN</span> triggers a live
                alert to the Overseer.
              </div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">
                  [ FIELD AGENT LOGIN ]
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="landingBlock" data-section="STATUS">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">SYSTEM STATUS</div>
              <div className="landingBig">Realtime orchestration for tasks.</div>
              <div className="landingP">
                Assign, retrain and gain the tasks to elfs. Elfs can chat with santa in realtime
              </div>
              <div className="landingP">
                Uses socket.io to achive powerful data transfer across roles
              </div>
            </div>
          </div>
          <div className="landingSideSpacer" />
        </section>



        

        <section
          id="security"
          className="landingBlock"
          data-section="CELEBRATE"
        >
          <div className="landingSideSpacer" />
          <div className="landingSide landingSideRight">
            <div className="landingSideCard">
              <div className="landingEyebrow">SECURITY</div>
              <div className="landingSideTitle">Dual-path access. Clear boundaries.</div>
              <div className="landingP">
                Santa and elf roles are separated by server-side
                authorization. Station binding prevents cross-station control.
              </div>
              <div className="landingP">
                AI chat bot called <span style={{color:"red"}}>Northbot</span> provides task assistance with Markdown formatting for
                crisp checklists.
              </div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">
                  [ AUTHENTICATE ]
                </Link>
                <a className="landingLink" href="#top">
                  [ RESET VIEW ]
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="review" className="landingBlock" data-section="REVIEW">
          <div className="landingSide landingSideLeft">
            <div className="landingSideCard">
              <div className="landingEyebrow">REVIEW</div>
              <div className="landingSideTitle">Realtime Chat:</div>
              <div className="landingP">
                Every tasks is transparant
                <span className="landingDot landingDotGreen" /> Active
                <span className="landingDot landingDotGrey" /> In Progress.
                <span className="landingDot landingDotOrange" /> Done.
              </div>
              <div className="landingP">
                Realtime notification system{" "}
                <span className="landingCode">NOTIFICATION</span>.
              </div>
              <div className="landingP">
                Global Broadcast pushes scrolling text to all stations in
                realtime.
              </div>
              <div className="landingLinks">
                <Link className="landingLink" to="/login">
                  [ OVERSEER LOGIN ]
                </Link>
              </div>
            </div>
          </div>
          <div className="landingSideSpacer" />
        </section>

        <footer className="landingFooterGiulio">
          <div className="landingFooterGrid">
            <div>
              <div className="landingFooterTitle">NORTH-COMMAND</div>
              <div className="landingFooterText">
                Realtime industrial orchestration for Santa’s Workshop.
              </div>
            </div>
            <div>
              <div className="landingFooterTitle">STACK</div>
              <div className="landingFooterText">
                React + TypeScript • Express • MongoDB • Socket.IO
              </div>
            </div>
            <div>
              <div className="landingFooterTitle">ACCESS</div>
              <div className="landingFooterText">
                <Link className="landingFooterLink" to="/login">
                  Enter Console
                </Link>
              </div>
            </div>
          </div>
          <div className="landingFooterBottom">
            © {new Date().getFullYear()} • Operational UI • Dark winter accent
          </div>
        </footer>
      </main>
    </div>
  );
}
