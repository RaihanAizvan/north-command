import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';

type Analytics = {
  tasks: { total: number; open: number; inProgress: number; completed: number };
  elves: Array<{ userId: string; username: string; openCount: number; doneCount: number }>;
  notifications: { unread: number };
};

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [token]);

  if (!data) return <div style={{ color: 'var(--muted)' }}>Loading…</div>;

  return (
    <div className="stack">
      <div className="card">
        <div className="panelTitle">Task Overview</div>
        <div className="analyticsGrid">
          <div className="card">Total: {data.tasks.total}</div>
          <div className="card">Open: {data.tasks.open}</div>
          <div className="card">In progress: {data.tasks.inProgress}</div>
          <div className="card">Done: {data.tasks.completed}</div>
        </div>
      </div>

      <div className="card">
        <div className="panelTitle">Elves performance</div>
        <div className="stack">
          {data.elves.map((e) => {
            const max = Math.max(1, ...data.elves.map((x) => x.doneCount));
            const w = Math.round((e.doneCount / max) * 100);
            return (
              <div key={e.userId} className="card" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px', gap: 10, alignItems: 'center' }}>
                <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</div>
                <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${w}%`, height: '100%', background: 'rgba(255,77,77,0.70)' }} />
                </div>
                <div style={{ color: 'var(--muted)', textAlign: 'right' }}>
                  Done: {e.doneCount} · Open: {e.openCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="panelTitle">Notifications</div>
        <div>Unread: {data.notifications.unread}</div>
      </div>
    </div>
  );
}
