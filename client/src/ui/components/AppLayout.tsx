import { useEffect, useState } from 'react';
import { apiUrl } from '../api';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';
import NotificationsInbox from './NotificationsInbox';
import ChatPane from './ChatPane';
import MessagesOverlay from './MessagesOverlay';
import ToastHost, { Toast } from './ToastHost';
import SnowLayer, { getSavedSnow, saveSnow, SnowIntensity } from './SnowLayer';
import { Avatar } from './Avatar';
import { useAiChatStore } from '../state/aiChat';
import { BellIcon, ChatIcon, MenuIcon, SnowIcon, TreeIcon } from './HeaderIcons';

type Peer = { _id: string; username: string };

async function authGet<T>(url: string, token: string): Promise<T> {
  const r = await fetch(apiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

export default function AppLayout() {
  const { token, role, clear } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();
  const { connect, disconnect, peers, setPeers, socket, unread, setCurrentPeer, prependHistory } = useChatStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secChannels, setSecChannels] = useState(true);
  const [secDms, setSecDms] = useState(true);
  const [secAccount, setSecAccount] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isDesktop = width >= 1100;
  const isMobile = width <= 720;

  // Close the messages overlay if we navigated to the dedicated page.
  useEffect(() => {
    if (isMobile && loc.pathname === '/messages') {
      setMessagesOpen(false);
    }
  }, [isMobile, loc.pathname]);
  const [chatCollapsed, setChatCollapsed] = useState(() => (typeof window === 'undefined' ? false : localStorage.getItem('north:chatCollapsed') === '1'));
  const [notifCount, setNotifCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [snow, setSnow] = useState<SnowIntensity>(() => (typeof window === 'undefined' ? 'medium' : getSavedSnow()));
  const [loadingPeers, setLoadingPeers] = useState(false);

  useEffect(() => {
    if (!token) return;
    connect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  // peers
  useEffect(() => {
    if (!token) return;
    let stop = false;
    (async () => {
      setLoadingPeers(true);
      try {
        if (role === 'OVERSEER') {
          const list = await authGet<{ _id: string; username: string; role: 'FIELD_AGENT' }[]>('/api/tasks/elves', token);
          if (!stop) setPeers(list.map((x) => ({ _id: x._id, username: x.username })));
        } else if (role === 'FIELD_AGENT') {
          const santa = await authGet<{ _id: string; username: string }>('/api/chat/overseer', token);
          if (!stop) setPeers([santa, { _id: 'NORTHBOT', username: 'NorthBot' }]);
        }
      } finally {
        if (!stop) setLoadingPeers(false);
      }
    })().catch(() => {});
    return () => {
      stop = true;
    };
  }, [token, role, setPeers]);

  // notifications
  useEffect(() => {
    if (!token) return;
    let stop = false;
    (async () => {
      const list = await authGet<{ _id: string; readAt?: string | null }[]>('/api/notifications', token);
      if (!stop) setNotifCount(list.filter((n) => !n.readAt).length);
    })().catch(() => {});
    return () => {
      stop = true;
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const onNotif = (payload: unknown) => {
      const p = payload as { notification?: { message?: string; type?: string } } | undefined;
      setNotifCount((c) => c + 1);
      const msg = p?.notification?.message ?? 'New notification';
      const type = p?.notification?.type ?? 'Update';
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [{ id, title: type, message: msg, at: Date.now() }, ...prev].slice(0, 3));
    };
    socket.on('notification:new', onNotif);
    return () => {
      socket.off('notification:new', onNotif);
    };
  }, [socket]);

  if (!token) return <Outlet />;

  async function openDm(peer: Peer) {
    if (!token) return;
    if (!isDesktop) setMessagesOpen(true);

    // AI bot conversation is handled locally
    if (peer._id === 'NORTHBOT') {
      setCurrentPeer(peer._id);
      useAiChatStore.getState().reset();
      return;
    }

    setCurrentPeer(peer._id);
    const hist = await authGet<{ _id: string; fromUserId: string; toUserId: string; message: string; createdAt: string }[]>(
      `/api/chat/dm/${peer._id}`,
      token
    );
    prependHistory(peer._id, hist);
  }

  useEffect(() => {
    // On mobile, messages is a dedicated route, not an overlay.
    const anyOverlayOpen = notifOpen || drawerOpen || (messagesOpen && !isMobile);
    document.body.style.overflow = anyOverlayOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [messagesOpen, notifOpen, drawerOpen, isMobile]);

  return (
    <div className="layout">
      <SnowLayer intensity={snow} />
      <header className="appHeader" role="banner">
        <div className="appHeaderInner">
          <div className="hdrLeft">
            <button className="iconBtn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <MenuIcon />
            </button>
            <div className="hdrBrand" aria-label="North Command">
              <TreeIcon />
              <span className="hdrBrandText">North Command</span>
            </div>
          </div>

          <div className="hdrCenter">
            <div className="hdrTitle">{role === 'OVERSEER' ? 'Santa Operations' : 'Elf Operations'}</div>
          </div>

          <div className="hdrRight">
            {/* Search (desktop) */}
            <form
              className="hdrSearch"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const q = (fd.get('q') ?? '').toString().trim();
                if (!q) return;
                nav(`${role === 'OVERSEER' ? '/santa' : '/elf'}?q=${encodeURIComponent(q)}`);
              }}
            >
              <input name="q" className="hdrSearchInput" placeholder="Search…" />
            </form>

            <button className="iconBtn" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
              <BellIcon />
              {notifCount > 0 ? <span className="topBadge">{notifCount}</span> : null}
            </button>

            <button
              className="iconBtn"
              aria-label="Messages"
              onClick={() => {
                if (isMobile) {
                  nav('/messages');
                  return;
                }
                setMessagesOpen(true);
                setCurrentPeer(null);
              }}
              title="Messages"
            >
              <ChatIcon />
            </button>

            {/* Desktop-only quick actions */}
            <div className="hdrDesktopOnly">
              {role === 'OVERSEER' ? (
                <button className="btn" onClick={() => nav('/santa#create')}>
                  New Task
                </button>
              ) : null}

              {isDesktop && chatCollapsed ? (
                <button
                  className="iconBtn"
                  aria-label="Expand chat"
                  onClick={() => {
                    setChatCollapsed(false);
                    localStorage.setItem('north:chatCollapsed', '0');
                  }}
                  title="Show chat"
                >
                  <ChatIcon />
                </button>
              ) : null}

              <div className="userChip">
                <button className="userChipBtn" onClick={() => setSecAccount((v) => !v)} type="button">
                  <span className="userDot" aria-hidden />
                  <span className="userChipText">{role === 'OVERSEER' ? 'Santa' : 'Elf'}</span>
                </button>
                {secAccount ? (
                  <div className="userMenu">
                    <button
                      className="userMenuItem"
                      onClick={() => {
                        const next: SnowIntensity = snow === 'off' ? 'light' : snow === 'light' ? 'medium' : snow === 'medium' ? 'heavy' : 'off';
                        setSnow(next);
                        saveSnow(next);
                      }}
                    >
                      Snow: {snow}
                    </button>
                    <button className="userMenuItem" onClick={clear}>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop status strip */}
      <div className="statusStrip" aria-hidden>
        <div className="statusStripInner">
          <div className="statusPill">
            <span className="dotLive" /> LIVE
          </div>
          <div>🎅 Christmas Ops • realtime</div>
        </div>
      </div>

      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebarHeader">
          <div className="brand">North Command</div>
          <button className="iconBtn" onClick={() => setDrawerOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sidebarScroll">
          <div className="sidebarSection">
            <div className="sidebarSectionHeader">Navigation</div>
            <nav className="navList">
              <NavLink className="sidebarChannel" to={role === 'OVERSEER' ? '/santa' : '/elf'} onClick={() => setDrawerOpen(false)}>
                <span className="chanDot" aria-hidden />
                <span className="chanName">Dashboard</span>
              </NavLink>
              {role === 'OVERSEER' ? (
                <>
                  <NavLink className="sidebarChannel" to="/analytics" onClick={() => setDrawerOpen(false)}>
                    <span className="chanDot" aria-hidden />
                    <span className="chanName">Analytics</span>
                  </NavLink>
                  <NavLink className="sidebarChannel" to="/elves" onClick={() => setDrawerOpen(false)}>
                    <span className="chanDot" aria-hidden />
                    <span className="chanName">Elf Management</span>
                  </NavLink>
                  <NavLink className="sidebarChannel" to="/settings" onClick={() => setDrawerOpen(false)}>
                    <span className="chanDot" aria-hidden />
                    <span className="chanName">Settings</span>
                  </NavLink>
                </>
              ) : null}
              <button
                className="sidebarChannel"
                onClick={() => {
                  if (isMobile) {
                    setDrawerOpen(false);
                    nav('/messages');
                    return;
                  }
                  setMessagesOpen(true);
                  setCurrentPeer(null);
                  setDrawerOpen(false);
                }}
              >
                <span className="chanDot" aria-hidden />
                <span className="chanName">Messages</span>
              </button>
              <button
                className="sidebarChannel"
                onClick={() => {
                  setNotifOpen(true);
                  setDrawerOpen(false);
                }}
              >
                <span className="chanDot" aria-hidden />
                <span className="chanName">Notifications</span>
              </button>
            </nav>
          </div>

          <div className="sidebarDivider" />

          <div className="sidebarSection">
            <div className="sidebarSectionHeader">Direct Messages</div>
            <div className="sidebarList">
              {loadingPeers ? (
                <div className="card" style={{ padding: 10, display: 'grid', placeItems: 'center' }}>
                  <div className="spinRingOnly" style={{ width: 34, height: 34 }} aria-hidden />
                </div>
              ) : null}
              {peers.map((p: Peer) => (
                <button
                  className="sidebarDm"
                  key={p._id}
                  onClick={() => {
                    void openDm(p);
                    setDrawerOpen(false);
                  }}
                >
                  <Avatar name={p.username} size={28} role={role === 'OVERSEER' ? 'FIELD_AGENT' : 'OVERSEER'} />
                  <div className="sidebarDmBody">
                    <div className="sidebarDmName">{p.username}</div>
                    <div className="sidebarDmSub">DM</div>
                  </div>
                  {(unread[p._id] ?? 0) > 0 ? <span className="sidebarDmBadge">{unread[p._id]}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebarFooter">
          <div className="userPanel">
            <div className="userInfo">
              <div className="userAvatar">{(role || 'U').slice(0, 1)}</div>
              <div className="userMeta">
                <div className="userName">{role === 'OVERSEER' ? 'Santa' : 'Elf'}</div>
                <div className="userSub">{role ?? 'User'}</div>
              </div>
            </div>
            <div className="userActions">
              <button
                className="iconBtn"
                aria-label="Snow intensity"
                onClick={() => {
                  const next: SnowIntensity =
                    snow === 'off' ? 'light' : snow === 'light' ? 'medium' : snow === 'medium' ? 'heavy' : 'off';
                  setSnow(next);
                  saveSnow(next);
                }}
                title={`Snow: ${snow}`}
              >
                ❄
              </button>
              <button
                className="btn"
                onClick={() => {
                  clear();
                  setDrawerOpen(false);
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {drawerOpen ? <div className="backdrop" onClick={() => setDrawerOpen(false)} /> : null}

      <main className="content">
        <div className={isDesktop ? 'contentGrid' : ''}>
          <div className="contentMain">
            <Outlet />
          </div>
          {isDesktop && !chatCollapsed ? (
            <div className="contentChat">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid var(--panel-border)' }}>
                <div style={{ fontWeight: 900 }}>Chat</div>
                <button
                  className="iconBtn"
                  aria-label="Collapse chat"
                  onClick={() => {
                    setChatCollapsed(true);
                    localStorage.setItem('north:chatCollapsed', '1');
                  }}
                >
                  ❯
                </button>
              </div>
              <div style={{ height: 'calc(100% - 52px)' }}>
                <ChatPane />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Messages is a full page on mobile; keep overlay only for tablet/non-desktop widths */}
      {messagesOpen && !isDesktop && !isMobile ? (
        <div className="msgOverlay" onClick={() => setMessagesOpen(false)}>
          <div className="msgCard" onClick={(e) => e.stopPropagation()}>
            <MessagesOverlay peers={peers} onClose={() => setMessagesOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* On desktop, clicking the chat icon should open the people picker in the sidebar.
          The actual chat is persistent on the right (ChatPane). */}

      {notifOpen ? (
        <div className="msgOverlay" onClick={() => setNotifOpen(false)}>
          <div className="msgCard" onClick={(e) => e.stopPropagation()}>
            <div className="overlayPanel">
              <div className="overlayHeader">
                <div className="overlayTitle">Notifications</div>
                <button className="iconBtn" onClick={() => setNotifOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="overlayBody compact">
                <NotificationsInbox onUnreadChange={(c) => setNotifCount(c)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ToastHost toasts={toasts} dismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
