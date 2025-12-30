import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SceneLayout from '../components/SceneLayout';
import { apiUrl } from '../api';
import { useAuthStore } from '../state/auth';

type LoginMode = 'OVERSEER' | 'FIELD_AGENT';

type AgentAuthResponse = { token: string; role: 'FIELD_AGENT' };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(url), {
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

function useInView() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-inview]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.classList.add('inView');
        }
      },
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
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

  useInView();

  return (
    <SceneLayout
      mode={mode === 'OVERSEER' ? 'REVIEW' : mode === 'FIELD_AGENT' ? 'PLAN' : 'HERO'}
      topRight={
        <a className="landingBtnGhost" href="/" style={{ pointerEvents: 'auto' }}>
          Home
        </a>
      }
    >
      <section className="sceneSection">
        <div className="sceneCard" data-inview>
          <div className="landingKicker">Threshold access • scroll flow</div>
          <h1 className="landingH1">Secure entry.</h1>
          <p className="landingP">Choose a role. Then provide credentials. The scene stays alive behind the interface.</p>

          <div className="landingActions" style={{ marginTop: 14 }}>
            <button
              className={mode === 'FIELD_AGENT' && !registerMode ? 'landingBtnPrimary' : 'landingBtnGhost'}
              onClick={() => {
                setMode('FIELD_AGENT');
                setRegisterMode(false);
              }}
              type="button"
            >
              Field Agent
            </button>
            <button
              className={mode === 'FIELD_AGENT' && registerMode ? 'landingBtnPrimary' : 'landingBtnGhost'}
              onClick={() => {
                setMode('FIELD_AGENT');
                setRegisterMode(true);
              }}
              type="button"
            >
              Register
            </button>
            <button
              className={mode === 'OVERSEER' ? 'landingBtnPrimary' : 'landingBtnGhost'}
              onClick={() => {
                setMode('OVERSEER');
                setRegisterMode(false);
              }}
              type="button"
            >
              Overseer
            </button>
          </div>

          <div className="landingP" style={{ marginTop: 12, color: 'rgba(255,255,255,0.60)' }}>
            Scroll continues. Drag the scene to rotate.
          </div>
        </div>
      </section>

      <section className="sceneSection">
        <div className="sceneCard" data-inview>
          <div className="landingH2">Credentials</div>

          <div className="landingRow" style={{ marginTop: 14 }}>
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

          {mode === 'FIELD_AGENT' ? (
            <div style={{ marginTop: 12 }}>
              <label className="relicField">
                <span className="relicLabel">Station Code</span>
                <input
                  className="relicInput"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  placeholder="A-01"
                />
                <span className="relicGlow" aria-hidden />
              </label>
            </div>
          ) : null}

          {error ? <div className="loginError">{error}</div> : null}

          <div className="loginActions">
            <button className="relicBtn" disabled={busy} onClick={onSubmit}>
              {busy ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span className="miniSpin" aria-hidden /> Authenticating
                </span>
              ) : registerMode ? (
                'Register'
              ) : (
                'Enter'
              )}
            </button>
          </div>

          <div className="loginFooter">
            <div className="loginNote">This channel is monitored. Proceed with intent.</div>
          </div>
        </div>
      </section>

      <footer className="landingFooterGiulio" style={{ paddingTop: 0 }}>
        <div>© NORTH-COMMAND • Secure Access</div>
      </footer>
    </SceneLayout>
  );
}
