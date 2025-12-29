import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';

type Notification = {
  _id: string;
  type: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

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

export default function NotificationsPanel({ onUnreadChange }: { onUnreadChange?: (unread: number) => void }) {
  const { token } = useAuthStore();
  const [items, setItems] = useState<Notification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getJson<Notification[]>('/api/notifications', token)
      .then((list) => {
        setItems(list);
        onUnreadChange?.(list.filter((n) => !n.readAt).length);
      })
      .catch(() => {});
  }, [token, onUnreadChange]);

  async function markRead(n: Notification) {
    if (!token) return;
    setBusyId(n._id);
    try {
      const updated = await patchJson<Notification>(`/api/notifications/${n._id}/read`, token, { read: true });
      setItems((prev) => {
        const next = prev.map((x) => (x._id === updated._id ? updated : x));
        onUnreadChange?.(next.filter((m) => !m.readAt).length);
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="notifPanel">
      <div className="notifPanelTitle">Notifications</div>
      <div className="notifPanelBody">
        {items.length === 0 ? <div className="notifEmpty">No notifications.</div> : null}
        {items.map((n) => (
          <div
            key={n._id}
            className={`notifRow ${n.readAt ? 'read' : ''}`}
            title={n.message}
          >
            <div className="notifRowTop">
              <div className="notifRowTopLeft">
                <div className="notifRowType">{n.type}</div>
                <div className="notifRowMsgInline">{n.message}</div>
              </div>
              <div className="notifRowTopRight">
                <div className="notifRowTime">{new Date(n.createdAt).toLocaleTimeString()}</div>
                {!n.readAt ? (
                  <button
                    className="tickBtn"
                    disabled={busyId === n._id}
                    onClick={() => void markRead(n)}
                    aria-label="Mark read"
                    title="Mark read"
                  >
                    {busyId === n._id ? '…' : '✓'}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="notifRowMsg">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
