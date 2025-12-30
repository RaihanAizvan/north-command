import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';
import ElfBarChart from './ElfBarChart';

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
    fetch(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '') + '/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
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
        <ElfBarChart elves={data.elves} />
      </div>

      <div className="card">
        <div className="panelTitle">Notifications</div>
        <div>Unread: {data.notifications.unread}</div>
      </div>
    </div>
  );
}
