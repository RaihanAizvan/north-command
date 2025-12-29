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

  function Eye({ x, y }: { x: number; y: number }) {
    return (
      <div style={{ width: 64, height: 64, borderRadius: 999, border: '1px solid var(--panel-border)', background: '#0b1018', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: '#f1f5ff', position: 'relative' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: '#111',
              position: 'absolute',
              left: 11 + x,
              top: 11 + y,
            }}
          />
        </div>
      </div>
    );
  }

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <div
      className="container"
      style={{ paddingTop: 70, paddingBottom: 70 }}
      onPointerMove={(e) => {
        const cx = window.innerWidth / 2;
        const cy = 140;
        const dx = Math.max(-8, Math.min(8, (e.clientX - cx) / 60));
        const dy = Math.max(-8, Math.min(8, (e.clientY - cy) / 60));
        setMouse({ x: dx, y: dy });
      }}
      onPointerDown={(e) => {
        const cx = window.innerWidth / 2;
        const cy = 140;
        const dx = Math.max(-8, Math.min(8, (e.clientX - cx) / 60));
        const dy = Math.max(-8, Math.min(8, (e.clientY - cy) / 60));
        setMouse({ x: dx, y: dy });
      }}
    >
      <div className="panel" style={{ padding: 18, maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
          <div>
            <div className="h1">NORTH-COMMAND</div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} aria-hidden>
            <Eye x={mouse.x} y={mouse.y} />
            <Eye x={mouse.x * 0.8} y={mouse.y * 0.8} />
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className={`btn ${mode === 'FIELD_AGENT' && !registerMode ? 'btnPrimary' : ''}`}
            onClick={() => {
              setMode('FIELD_AGENT');
              setRegisterMode(false);
            }}
          >
            Field Agent
          </button>
          <button
            className={`btn ${mode === 'FIELD_AGENT' && registerMode ? 'btnPrimary' : ''}`}
            onClick={() => {
              setMode('FIELD_AGENT');
              setRegisterMode(true);
            }}
          >
            Register
          </button>
          <button
            className={`btn ${mode === 'OVERSEER' ? 'btnPrimary' : ''}`}
            onClick={() => {
              setMode('OVERSEER');
              setRegisterMode(false);
            }}
          >
            Overseer
          </button>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Username</div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

        </div>

        {error ? (
          <div style={{ marginTop: 12, border: '1px solid rgba(255,51,68,0.35)', padding: 10, borderRadius: 10, color: '#ffd6da' }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
          <button className="btn btnPrimary" disabled={busy} onClick={onSubmit}>
            {busy ? 'Authenticating…' : 'Enter'}
          </button>
        </div>

        <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>
          Hardened access. No theatrics. Real-time command channel.
        </div>
      </div>
    </div>
  );
}
