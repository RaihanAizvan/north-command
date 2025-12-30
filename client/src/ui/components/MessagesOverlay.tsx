import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../api';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';
import { Avatar } from './Avatar';
import LoadingSpinner from './LoadingSpinner';

type Peer = { _id: string; username: string };

async function authGet<T>(url: string, token: string): Promise<T> {
  const r = await fetch(apiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

export default function MessagesOverlay({ peers, onClose }: { peers: Peer[]; onClose: () => void }) {
  const { token, role } = useAuthStore();
  const { currentPeerId, setCurrentPeer, prependHistory, messages, unread, send, emitTyping, typing } = useChatStore();

  const [mode, setMode] = useState<'list' | 'chat'>(currentPeerId ? 'chat' : 'list');
  const [text, setText] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(() => peers.find((p) => p._id === currentPeerId) ?? null, [peers, currentPeerId]);
  const thread = currentPeerId ? messages[currentPeerId] ?? [] : [];

  useEffect(() => {
    if (!currentPeerId) setMode('list');
  }, [currentPeerId]);

  async function openPeer(p: Peer) {
    if (!token) return;
    setLoadingThread(true);
    try {
      setCurrentPeer(p._id);
      const hist = await authGet<{ _id: string; fromUserId: string; toUserId: string; message: string; createdAt: string }[]>(
        `/api/chat/dm/${p._id}`,
        token
      );
      prependHistory(p._id, hist);
      setMode('chat');
    } finally {
      setLoadingThread(false);
    }
  }

  const typingText = currentPeerId && typing[currentPeerId] ? 'Typing…' : '';

  useEffect(() => {
    if (mode !== 'chat') return;
    // Auto-scroll to bottom on new messages or when opening a thread
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [mode, thread.length, currentPeerId]);

  return (
    <div className="overlayPanel">
      <div className="overlayHeader">
        <div className="overlayTitle">Messages</div>
        <button className="iconBtn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="overlayBody">
        {mode === 'list' ? (
          <div className="overlayList">
            {peers.map((p) => (
              <button key={p._id} className="overlayRow" onClick={() => void openPeer(p)}>
                <Avatar name={p.username} size={32} role={role === 'OVERSEER' ? 'FIELD_AGENT' : 'OVERSEER'} />
                <div className="overlayRowBody">
                  <div className="overlayRowTop">
                    <div className="overlayRowName">{p.username}</div>
                    {(unread[p._id] ?? 0) > 0 ? <span className="sidebarDmBadge">{unread[p._id]}</span> : null}
                  </div>
                  <div className="overlayRowSub">Tap to open chat</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="overlayChat">
            <div className="overlayChatTop">
              <button className="btn" onClick={() => setMode('list')}>
                ← People
              </button>
              <div style={{ fontWeight: 900 }}>{active?.username ?? 'Chat'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{typingText}</div>
            </div>

            <div className="overlayThread">
              {loadingThread ? <LoadingSpinner label="Loading messages" /> : null}
              {!loadingThread
                ? thread.map((m) => (
                    <div key={m._id} className={`msgBubble ${m.self ? 'me' : 'them'}`}>
                      <div className="msgText">{m.message}</div>
                      <div className="msgMeta">{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  ))
                : null}
              <div ref={endRef} />
            </div>

            <form
              className="overlayComposer"
              onSubmit={(e) => {
                e.preventDefault();
                if (!currentPeerId) return;
                const msg = text.trim();
                if (!msg) return;
                void send(currentPeerId, msg);
                setText('');
                // Ensure we scroll after the message is appended (socket echo)
                setTimeout(() => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50);
              }}
            >
              <textarea
                className="chatInput"
                value={text}
                placeholder="Write a message…"
                onChange={(e) => {
                  setText(e.target.value);
                  if (currentPeerId) emitTyping(currentPeerId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                  }
                }}
                rows={2}
              />
              <button className="btn btnPrimary" disabled={!text.trim()} type="submit">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
