import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../state/auth';

type DockItemBase = {
  key: string;
  label: string;
  show: (role: 'OVERSEER' | 'FIELD_AGENT' | null) => boolean;
  icon: React.ReactNode;
};

type DockItemLink = DockItemBase & { kind: 'link'; to: string };

type DockItemAction = DockItemBase & { kind: 'action'; onClick: () => void };

type DockItem = DockItemLink | DockItemAction;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="dockSvg" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

function BellIcon() {
  return (
    <Icon>
      <path
        d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 0 0-5.2-6.78V3a1.8 1.8 0 1 0-3.6 0v1.22A7 7 0 0 0 5 11v4.8l-1.6 1.6v.6h17.2v-.6L19 15.8Z"
        fill="currentColor"
      />
    </Icon>
  );
}

function PersonIcon() {
  return (
    <Icon>
      <path
        d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2 4.2 4.2 0 0 0 4.2 4.2Zm0 2.1c-4.2 0-7.6 2.3-7.6 5.1v1h15.2v-1c0-2.8-3.4-5.1-7.6-5.1Z"
        fill="currentColor"
      />
    </Icon>
  );
}

function SparkIcon() {
  return (
    <Icon>
      <path
        d="M12 2l1.1 4.1L17 7.2l-3.9 1.1L12 12l-1.1-3.7L7 7.2l3.9-1.1L12 2Zm6 10l.7 2.6 2.3.7-2.3.7L18 18l-.7-2.3-2.3-.7 2.3-.7L18 12ZM5.5 12l.7 2.6 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.6Z"
        fill="currentColor"
      />
    </Icon>
  );
}

function LockIcon() {
  return (
    <Icon>
      <path
        d="M17 10h-1V8a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V8Z"
        fill="currentColor"
      />
    </Icon>
  );
}

function Snow() {
  // Render N flakes with randomized animation durations and positions.
  const flakes = Array.from({ length: 60 }).map((_, i) => {
    const left = Math.random() * 100; // vw
    const delay = Math.random() * 8; // s
    const duration = 8 + Math.random() * 10; // s
    const size = 4 + Math.random() * 4; // px
    const style: React.CSSProperties = {
      left: `${left}vw`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      width: size,
      height: size,
      opacity: 0.8 + Math.random() * 0.2,
    };
    return <div key={i} className="flake" style={style} />;
  });
  return <div className="snow" aria-hidden>{flakes}</div>;
}

function Title() {
  const { role } = useAuthStore();
  const loc = useLocation();

  if (loc.pathname.startsWith('/login')) return 'Welcome';
  if (role === 'OVERSEER') return 'Overseer';
  if (role === 'FIELD_AGENT') return 'Field Agent';
  return 'North Command';
}

type Notification = {
  _id: string;
  type: string;
  message: string;
  taskId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

async function getJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

async function patchJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export default function AppShell() {
  const { role, clear, token } = useAuthStore();

  const [dockHoverX, setDockHoverX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement | null>(null);
  const [notifPos, setNotifPos] = useState<{ top: number; left: number } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifError, setNotifError] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications]);

  const dockItems: DockItem[] = useMemo(() => {
    const items: DockItem[] = [];

    if (role) {
      items.push({
        kind: 'action',
        key: 'notifications',
        label: 'Notifications',
        show: () => true,
        onClick: () => setNotifOpen((v) => !v),
        icon: <BellIcon />,
      });
    }

    items.push({
      kind: 'link',
      key: 'santa',
      to: '/santa',
      label: 'Overseer',
      show: (r) => r === 'OVERSEER',
      icon: <SparkIcon />,
    });

    items.push({
      kind: 'link',
      key: 'elf',
      to: '/elf',
      label: 'Field Agent',
      show: (r) => r === 'FIELD_AGENT',
      icon: <PersonIcon />,
    });

    items.push({
      kind: 'link',
      key: 'login',
      to: '/login',
      label: 'Login',
      show: (r) => !r,
      icon: <LockIcon />,
    });

    return items;
  }, [role]);

  function computeNotifPos() {
    const btn = notifBtnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gap = 12;
    const width = 360;
    const height = 340;

    const leftPreferred = rect.right + gap;
    const left = leftPreferred + width <= window.innerWidth - 12 ? leftPreferred : Math.max(12, rect.left - gap - width);

    const topPreferred = rect.top - height + rect.height;
    const top = Math.min(window.innerHeight - height - 12, Math.max(12, topPreferred));

    setNotifPos({ top, left });
  }

  useLayoutEffect(() => {
    if (!notifOpen) return;
    computeNotifPos();
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen) return;

    const onResize = () => computeNotifPos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [notifOpen]);

  useEffect(() => {
    if (!token || !notifOpen) return;
    setNotifError(null);
    getJson<Notification[]>('/api/notifications', token)
      .then((list) => setNotifications(list))
      .catch((e) => setNotifError(e instanceof Error ? e.message : 'Failed to load notifications'));
  }, [token, notifOpen]);

  async function markRead(n: Notification) {
    if (!token) return;
    const updated = await patchJson<Notification>(`/api/notifications/${n._id}/read`, token, { read: true });
    setNotifications((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
  }

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!notifOpen) return;
      const pop = document.getElementById('notif-popover');
      const btn = notifBtnRef.current;
      const target = e.target as Node;
      if (pop?.contains(target) || btn?.contains(target)) return;
      setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [notifOpen]);

  // Realtime: keep notification count fresh
  useEffect(() => {
    if (!token) return;
    // Existing dashboards already connect sockets; this is a light-weight approach:
    // refresh notifications when the popover opens.
  }, [token]);

  function getDockIconStyle(key: string, hoverX: number | null, dockRef: React.RefObject<HTMLDivElement>) {
    const base = 1.0;
    const max = 1.6; // max scale
    if (hoverX == null || !dockRef.current) return { transform: `scale(${base})` } as React.CSSProperties;

    const el = dockRef.current.querySelector(`[data-key="${key}"]`) as HTMLElement | null;
    if (!el) return { transform: `scale(${base})` } as React.CSSProperties;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const d = Math.abs(hoverX - centerX);
    const sigma = 70; // controls falloff width
    const influence = Math.exp(-(d * d) / (2 * sigma * sigma));
    const scale = base + (max - base) * influence;
    return { transform: `scale(${scale})` } as React.CSSProperties;
  }

  return (
    <div className="app">
      <div className="bg">
        <Snow />
      </div>

      <header className="nav">
        <div className="navGlass">
          <div className="navLeft">
            <div className="brand">NORTH</div>
            <div className="navTitle">
              <Title />
            </div>
          </div>

          <div className="navRight">
            {role ? (
              <button className="btn btnGhost" onClick={clear}>
                Sign out
              </button>
            ) : (
              <span className="pill">Public</span>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <nav className="dockWrap" aria-label="Primary">
        <div
          className="dock"
          ref={dockRef}
          onMouseMove={(e) => setDockHoverX(e.clientX)}
          onMouseLeave={() => setDockHoverX(null)}
        >
          {dockItems
            .filter((i) => i.show(role))
            .map((item) => {
              const common = { key: item.key } as const;
              const refCb = (el: HTMLElement | null) => {
                if (el) el.setAttribute('data-key', item.key);
              };

              const content = (
                <div className="dockItemInner">
                  <div
                    className="dockIcon"
                    ref={refCb as unknown as React.RefObject<HTMLDivElement>}
                    style={getDockIconStyle(item.key, dockHoverX, dockRef)}
                  >
                    {item.icon}
                    {item.key === 'notifications' && unreadCount > 0 ? (
                      <span className="notifBadge" aria-label={`${unreadCount} unread`}>
                        {unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="dockLabel">{item.label}</div>
                </div>
              );

              if (item.kind === 'link') {
                return (
                  <NavLink
                    {...common}
                    to={item.to}
                    className={({ isActive }) => `dockItem ${isActive ? 'active' : ''}`}
                  >
                    {content}
                  </NavLink>
                );
              }

              return (
                <button
                  {...common}
                  className={`dockItem ${notifOpen && item.key === 'notifications' ? 'active' : ''}`}
                  onClick={(e) => {
                    item.onClick();
                    if (item.key === 'notifications') {
                      notifBtnRef.current = e.currentTarget as HTMLButtonElement;
                      setTimeout(() => computeNotifPos(), 0);
                    }
                  }}
                >
                  {content}
                </button>
              );
            })}
        </div>
      </nav>

      {notifOpen && notifPos ? (
        <div
          id="notif-popover"
          className="notifPopover"
          style={{ position: 'fixed', top: notifPos.top, left: notifPos.left, width: 360, height: 340 }}
        >
          <div className="notifHeader">Notifications</div>
          <div className="notifBody">
            {notifError ? (
              <div className="notifEmpty">{notifError}</div>
            ) : notifications.length === 0 ? (
              <div className="notifEmpty">No notifications.</div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`notifItem ${n.readAt ? 'read' : ''}`}>
                  <div className="notifTop">
                    <div className="notifType">{n.type}</div>
                    <div className="notifTime">{new Date(n.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div className="notifMsg">{n.message}</div>
                  {!n.readAt ? (
                    <div className="notifActions">
                      <button className="btn btnGhost" onClick={() => void markRead(n)}>
                        Mark read
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
