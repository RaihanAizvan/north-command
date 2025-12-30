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

export default function Landing() {
  const { token, role } = useAuthStore();
  const effectiveRole = role ?? roleFromToken(token);

  if (token) return <Navigate to={effectiveRole === 'OVERSEER' ? '/santa' : '/elf'} replace />;

  return (
    <div className="landing3dRoot">
      <WorkshopScene />

      <div className="landing3dHud">
        <div className="landing3dTop">
          <div>
            <div className="landing3dBrand">NORTH-COMMAND</div>
            <div className="landing3dSub">Santa’s Workshop • Task Orchestration</div>
          </div>
          <Link to="/login" className="landing3dEnter">
            Enter Console
          </Link>
        </div>

        <div className="landing3dHero">
          <div className="landing3dKicker">LIGHT CHRISTMAS VIBE • DARK OPS THEME</div>
          <div className="landing3dTitle">A living workshop command layer.</div>
          <div className="landing3dBody">
            A focused task manager for elves, with a commander overview for Santa. Subtle motion, crisp status, no chaos.
          </div>
          <div className="landing3dActions">
            <Link to="/login" className="landing3dPrimary">
              Login
            </Link>
            <a href="#brief" className="landing3dSecondary">
              Brief
            </a>
          </div>
        </div>

        <div id="brief" className="landing3dBrief">
          <div className="landing3dCard">
            <div className="landing3dCardTitle">For Elves</div>
            <div className="landing3dCardBody">One station. One task. Fast transitions. Stay on target.</div>
          </div>
          <div className="landing3dCard">
            <div className="landing3dCardTitle">For Santa</div>
            <div className="landing3dCardBody">War-room visibility across every station, with realtime escalation.</div>
          </div>
          <div className="landing3dCard">
            <div className="landing3dCardTitle">For Everyone</div>
            <div className="landing3dCardBody">A calm interface with restrained holiday accent lighting.</div>
          </div>
        </div>

        <div className="landing3dFooter">Scroll. Move your cursor. The workshop responds.</div>
      </div>
    </div>
  );
}
