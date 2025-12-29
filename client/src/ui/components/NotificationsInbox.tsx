import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../state/auth';

export type Notification = {
  _id: string;
  type: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

type Tab = 'ALL' | 'UNREAD';

async function getJson<T>(url: string, token: string): Promise<T> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

async function patchJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

export default function NotificationsInbox({ onUnreadChange }: { onUnreadChange?: (unread: number) => void }) {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('UNREAD');
  const [items, setItems] = useState<Notification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  useEffect(() => {
    if (!token) return;
    getJson<Notification[]>('/api/notifications', token)
      .then((list) => {
        setItems(list);
        onUnreadChange?.(list.filter((n) => !n.readAt).length);
      })
      .catch(() => {});
  }, [token, onUnreadChange]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const filtered = useMemo(() => {
    const list = tab === 'UNREAD' ? items.filter((n) => !n.readAt) : items;
    return list.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [items, tab]);

  async function markRead(id: string) {
    if (!token) return;
    setBusyId(id);
    try {
      const updated = await patchJson<Notification>(`/api/notifications/${id}/read`, token, { read: true });
      setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (!token) return;
    const unread = items.filter((n) => !n.readAt);
    if (unread.length === 0) return;

    setBusyAll(true);
    try {
      // No bulk endpoint: best-effort sequential.
      for (const n of unread) {
        const updated = await patchJson<Notification>(`/api/notifications/${n._id}/read`, token, { read: true });
        setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      }
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <div className="inbox">
      <div className="inboxTabs">
        <button className={`inboxTab ${tab === 'UNREAD' ? 'active' : ''}`} onClick={() => setTab('UNREAD')}>
          Unread {unreadCount > 0 ? <span className="inboxCount">{unreadCount}</span> : null}
        </button>
        <button className={`inboxTab ${tab === 'ALL' ? 'active' : ''}`} onClick={() => setTab('ALL')}>
          All
        </button>
        <div className="inboxTabSpacer" />
        <button className="inboxAction" disabled={busyAll || unreadCount === 0} onClick={() => void markAllRead()}>
          {busyAll ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      <div className="inboxList">
        {filtered.length === 0 ? <div className="inboxEmpty">No notifications.</div> : null}
        {filtered.map((n) => (
          <div key={n._id} className={`inboxItem ${n.readAt ? 'read' : 'unread'}`} title={n.message}>
            <div className="inboxIcon" aria-hidden>
              {n.type?.slice(0, 1).toUpperCase() || 'N'}
            </div>
            <div className="inboxBody">
              <div className="inboxTop">
                <div className="inboxType">{n.type}</div>
                <div className="inboxTime">{new Date(n.createdAt).toLocaleTimeString()}</div>
              </div>
              <div className="inboxMsg">{n.message}</div>
            </div>
            {!n.readAt ? (
              <button className="tickBtn" disabled={busyId === n._id} onClick={() => void markRead(n._id)} aria-label="Mark read">
                {busyId === n._id ? '…' : '✓'}
              </button>
            ) : (
              <div className="inboxDone" aria-hidden>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
