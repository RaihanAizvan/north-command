import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../state/auth';

type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
};

type Task = {
  _id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  assigneeUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Notification = {
  _id: string;
  type: string;
  message: string;
  taskId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function getJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '') + url, { headers: { ...authHeaders(token) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

async function patchJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export default function ElfDashboard() {
  const { token, clear } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const s = io((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? undefined, { auth: { token } });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const myTasks = await getJson<Task[]>('/api/tasks/my', token);
      const myNotifications = await getJson<Notification[]>('/api/notifications', token);
      setTasks(myTasks);
      setNotifications(myNotifications);
    })().catch(() => clear());
  }, [token, clear]);

  useEffect(() => {
    if (!socket) return;

    socket.on('task:update', (payload: { task: Task | null; deleted?: boolean }) => {
      const task = payload.task;
      const deleted = payload.deleted ?? false;
      if (!task) return;

      setTasks((prev) => {
        if (deleted) return prev.filter((t) => t._id !== task._id);
        const idx = prev.findIndex((t) => t._id === task._id);
        if (idx === -1) return [task, ...prev];
        const next = prev.slice();
        next[idx] = task;
        return next;
      });
    });

    socket.on('notification:new', (payload: { notification: Notification }) => {
      setNotifications((prev) => [payload.notification, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('task:update');
      socket.off('notification:new');
    };
  }, [socket]);

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    if (!token) return;
    setBusyId(taskId);
    try {
      const updated = await patchJson<Task>(`/api/tasks/my/${taskId}/status`, token, { status });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } finally {
      setBusyId(null);
    }
  }

  async function markRead(n: Notification) {
    if (!token) return;
    setBusyId(n._id);
    try {
      const updated = await patchJson<Notification>(`/api/notifications/${n._id}/read`, token, { read: true });
      setNotifications((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } finally {
      setBusyId(null);
    }
  }

  if (!token) return null;

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div className="pageHero">
        <div>
          <div className="h1">FIELD AGENT</div>
          <div className="subtle">My assigned tasks & notifications</div>
        </div>
      </div>

      <div className="dashGrid">
        <div className="panel" style={{ padding: 14 }}>
          <div className="panelTitle">My Tasks</div>
          <div className="stack">            {activeTasks.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No active tasks.</div>
            ) : (
              activeTasks.map((t) => (
                <div key={t._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 900 }}>{t.title}</div>
                    <span className="badge">{STATUS_LABEL[t.status]}</span>
                  </div>
                  {t.description ? <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>{t.description}</div> : null}

                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      className={`btn ${t.status === 'IN_PROGRESS' ? 'btnPrimary' : ''}`}
                      disabled={busyId === t._id}
                      onClick={() => void updateTaskStatus(t._id, 'IN_PROGRESS')}
                    >
                      In progress
                    </button>
                    <button
                      className={`btn ${t.status === 'COMPLETED' ? 'btnPrimary' : ''}`}
                      disabled={busyId === t._id}
                      onClick={() => void updateTaskStatus(t._id, 'COMPLETED')}
                    >
                      Done
                    </button>
                    <button
                      className={`btn ${t.status === 'OPEN' ? 'btnPrimary' : ''}`}
                      disabled={busyId === t._id}
                      onClick={() => void updateTaskStatus(t._id, 'OPEN')}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelTitle">Completed Tasks</div>
          <div className="stack scroll">
            {completedTasks.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No completed tasks.</div>
            ) : (
              completedTasks.map((t) => (
                <div key={t._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 900 }}>{t.title}</div>
                    <span className="badge">{STATUS_LABEL[t.status]}</span>
                  </div>
                  {t.description ? <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>{t.description}</div> : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelTitle">Notifications</div>
          <div className="stack scroll">            {notifications.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No notifications.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    border: '1px solid rgba(91,102,117,0.25)',
                    borderRadius: 10,
                    padding: 12,
                    opacity: n.readAt ? 0.65 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: 'var(--accentA)' }}>
                      {n.type}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>{n.message}</div>
                  {!n.readAt ? (
                    <div className="rowEnd" style={{ marginTop: 10 }}>
                      <button className="btn" disabled={busyId === n._id} onClick={() => markRead(n)}>
                        {busyId === n._id ? '...' : 'Mark read'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
