import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../state/auth';

type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

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

type Elf = { _id: string; username: string; role: 'FIELD_AGENT' };

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
  const res = await fetch(url, { headers: { ...authHeaders(token) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export default function SantaDashboard() {
  const { token, clear } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [elves, setElves] = useState<Elf[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const s = io({ auth: { token } });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [allTasks, allElves, myNotifications] = await Promise.all([
        getJson<Task[]>('/api/tasks', token),
        getJson<Elf[]>('/api/tasks/elves', token),
        getJson<Notification[]>('/api/notifications', token),
      ]);
      setTasks(allTasks);
      setElves(allElves);
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

  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const openCount = useMemo(() => tasks.filter((t) => t.status !== 'COMPLETED').length, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => (filter === 'ALL' ? true : t.status === filter))
      .filter((t) => (!q ? true : `${t.title} ${t.description ?? ''}`.toLowerCase().includes(q)))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [tasks, filter, query]);

  function chooseLeastLoadedElfId(): string | null {
    if (elves.length === 0) return null;
    // Count non-completed tasks per assignee
    const counts = new Map<string, number>();
    for (const e of elves) counts.set(e._id, 0);
    for (const t of tasks) {
      if (t.status === 'COMPLETED') continue;
      if (t.assigneeUserId && counts.has(t.assigneeUserId)) counts.set(t.assigneeUserId, (counts.get(t.assigneeUserId) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = Number.POSITIVE_INFINITY;
    for (const [id, c] of counts.entries()) {
      if (c < bestCount) {
        best = id;
        bestCount = c;
      }
    }
    return best;
  }

  async function quickAssign() {
    const best = chooseLeastLoadedElfId();
    if (!best) return;
    setAssigneeUserId(best);
  }

  async function createTask() { 
    if (!token) return;
    setError(null);
    if (!title.trim()) {
      setError('Title required');
      return;
    }

    setBusy(true);
    try {
      await postJson<Task>('/api/tasks', token, {
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        assigneeUserId: assigneeUserId || null,
      });
      setTitle('');
      setDescription('');
      setAssigneeUserId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task');
    } finally {
      setBusy(false);
    }
  }

  if (!token) return null;

  return (
    <div className="container" style={{ maxWidth: 1180 }}>
      <div className="pageHero">
        <div>
          <div className="h1">OVERSEER</div>
          <div className="subtle">Open: {openCount} • Elves: {elves.length}</div>
        </div>
      </div>

      <div className="dashGrid">
        <div className="panel" id="create" style={{ padding: 14 }}>
          <div className="panelTitle">Create Task</div>

          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Task details</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Title</div>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fix conveyor jam" />
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Description</div>
                  <textarea
                    className="chatInput"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any context, steps, or location…"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Assignment</div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Assign to elf (optional)</div>
                <select className="input" value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {elves.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.username}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
                  Tip: assign to an elf to start a DM right away from the sidebar.
                </div>
              </div>
            </div>

            {error ? <div className="card" style={{ borderColor: 'rgba(255,77,77,0.35)' }}>{error}</div> : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" disabled={busy || elves.length === 0} onClick={() => void quickAssign()}>
                Quick assign (least busy)
              </button>
              <button className="btn btnPrimary" disabled={busy} onClick={() => void createTask()}>
                {busy ? 'Creating…' : 'Create task'}
              </button>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelTitle">Notifications</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No notifications.</div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} style={{ border: '1px solid rgba(91,102,117,0.25)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: 'var(--amber)' }}>
                      {n.type}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12, padding: 14 }}>
        <div className="panelTitle">All Tasks</div>

        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" />
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value as 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED')} style={{ maxWidth: 220 }}>
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Done</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No matching tasks.</div>
          ) : (
            filteredTasks.map((t) => (
              <div key={t._id} className="card">                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 900 }}>{t.title}</div>
                  <span className="badge">{t.status === 'COMPLETED' ? 'Done' : t.status === 'IN_PROGRESS' ? 'In progress' : 'Open'}</span>
                </div>
                {t.description ? <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>{t.description}</div> : null}
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
                  Assignee: {t.assigneeUserId ? elves.find((e) => e._id === t.assigneeUserId)?.username ?? t.assigneeUserId : 'Unassigned'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
