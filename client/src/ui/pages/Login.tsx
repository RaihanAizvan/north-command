import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth';

type LoginMode = 'OVERSEER' | 'FIELD_AGENT';

type AgentAuthResponse = { token: string; role: 'FIELD_AGENT' };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export default function Login() {
  // Reimagined login: cinematic, calm, deliberate.

  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  const [mode, setMode] = useState<LoginMode>('FIELD_AGENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    if (mode === 'OVERSEER') return 'Overseer Access';
    return registerMode ? 'Register Field Agent' : 'Field Agent Console';
  }, [mode, registerMode]);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    clear();
    if (mode === 'FIELD_AGENT' && !registerMode) {
      // Task-based workflow: existing agents can login without extra fields.
      // Registration is available via the Register tab.
    }
    try {
      if (mode === 'OVERSEER') {
        const r = await postJson<{ token: string; role: 'OVERSEER' }>('/api/auth/login/overseer', {
          username,
          password,
        });
        setAuth({ token: r.token, role: 'OVERSEER' });
        nav('/santa');
      } else if (registerMode) {
        const r = await postJson<AgentAuthResponse>('/api/auth/register/agent', {
          username,
          password,
        });
        setAuth({ token: r.token, role: 'FIELD_AGENT' });
        nav('/elf');
      } else {
        const r = await postJson<AgentAuthResponse>('/api/auth/login/agent', {
          username,
          password,
        });
        setAuth({ token: r.token, role: 'FIELD_AGENT' });
        nav('/elf');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : registerMode ? 'Registration failed' : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  const portrait = useMemo(() => {
    if (mode === 'OVERSEER') return '/santa.png';
    if (registerMode) return '/dark-elf.png';
    return '/cute-elf.png';
  }, [mode, registerMode]);

  const [seed] = useState(() => {
    // deterministic-ish per mount
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2.6,
      drift: 8 + Math.random() * 18,
      delay: Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.14,
    }));
  });

  function updateGaze(clientX: number, clientY: number) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.38;
    const dx = Math.max(-10, Math.min(10, (clientX - cx) / 60));
    const dy = Math.max(-10, Math.min(10, (clientY - cy) / 60));
    setGaze({ x: dx, y: dy });
  }

  return (
    <div
      className="loginScene"
      onPointerMove={(e) => updateGaze(e.clientX, e.clientY)}
      onPointerDown={(e) => updateGaze(e.clientX, e.clientY)}
    >
      <div className="loginAtmos" aria-hidden>
        <div className="loginHalo" />
        <div className="loginVeil" />
        <div className="loginVignette" />
        <div className="loginStars" aria-hidden />
        <div className="loginParticles">
          {seed.map((p) => (
            <span
              key={p.id}
              className="loginParticle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animationDuration: `${p.drift}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="loginFrame">
        <div className="loginSigil" aria-hidden>
          <div className="sigilOuter">
            <div className="sigilInner" />
          </div>
          <div
            className="sigilGaze"
            style={{
              transform: `translate(${gaze.x}px, ${gaze.y}px)`,
            }}
          />
          <div
            className="sigilPortrait"
            style={{
              transform: `translate(${gaze.x * 1.2}px, ${gaze.y * 1.2}px) rotateX(${(-gaze.y * 0.4).toFixed(2)}deg) rotateY(${(gaze.x * 0.4).toFixed(2)}deg)`,
            }}
          >
            <img src={portrait} alt="" draggable={false} />
          </div>
        </div>

        <div className="loginCard" role="region" aria-label="Access">
          <div className="loginHeader">
            <div className="loginKicker">North Command</div>
            <div className="loginTitle">Threshold Access</div>
            <div className="loginSubtitle">{title}</div>
          </div>

          <div className="loginModes" role="tablist" aria-label="Access mode">
            <button
              className={`loginMode ${mode === 'FIELD_AGENT' && !registerMode ? 'active' : ''}`}
              onClick={() => {
                setMode('FIELD_AGENT');
                setRegisterMode(false);
              }}
              type="button"
              role="tab"
            >
              Field Agent
            </button>
            <button
              className={`loginMode ${mode === 'FIELD_AGENT' && registerMode ? 'active' : ''}`}
              onClick={() => {
                setMode('FIELD_AGENT');
                setRegisterMode(true);
              }}
              type="button"
              role="tab"
            >
              Register
            </button>
            <button
              className={`loginMode ${mode === 'OVERSEER' ? 'active' : ''}`}
              onClick={() => {
                setMode('OVERSEER');
                setRegisterMode(false);
              }}
              type="button"
              role="tab"
            >
              Overseer
            </button>
          </div>

          <div className="loginFields">
            <label className="relicField">
              <span className="relicLabel">Identity</span>
              <input
                className="relicInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your name"
              />
              <span className="relicGlow" aria-hidden />
            </label>

            <label className="relicField">
              <span className="relicLabel">Passphrase</span>
              <input
                className="relicInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={registerMode ? 'new-password' : 'current-password'}
                placeholder="Speak it quietly"
              />
              <span className="relicGlow" aria-hidden />
            </label>
          </div>

          {error ? <div className="loginError">{error}</div> : null}

          <div className="loginActions">
            <button className="relicBtn" disabled={busy} onClick={onSubmit}>
              {busy ? 'Authenticating…' : registerMode ? 'Register' : 'Enter'}
            </button>
          </div>

          <div className="loginFooter">
            <div className="loginNote">This channel is monitored. Proceed with intent.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
