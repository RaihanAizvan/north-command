import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';

type Analytics = {
  tasks: { total: number; open: number; inProgress: number; completed: number };
  elves: Array<{ userId: string; username: string; openCount: number }>;
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
        <div className="panelTitle">Elves (open tasks)</div>
        <div className="stack">
          {data.elves.map((e) => (
            <div key={e.userId} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{e.username}</div>
              <div style={{ color: 'var(--muted)' }}>{e.openCount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panelTitle">Notifications</div>
        <div>Unread: {data.notifications.unread}</div>
      </div>
    </div>
  );
}
