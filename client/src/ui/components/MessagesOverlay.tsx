import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../api';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';
import { Avatar } from './Avatar';
import LoadingSpinner from './LoadingSpinner';
import { useAiChatStore } from '../state/aiChat';
import Markdown from './Markdown';

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.round((startToday - start) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString();
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupKey(m: { self?: boolean; fromUserId: string }) {
  return `${m.self ? 'me' : 'them'}:${m.fromUserId}`;
}

type Peer = { _id: string; username: string };

async function authGet<T>(url: string, token: string): Promise<T> {
  const r = await fetch(apiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

export default function MessagesOverlay({ peers, onClose }: { peers: Peer[]; onClose: () => void }) {
  const { token, role } = useAuthStore();
  const { currentPeerId, setCurrentPeer, prependHistory, messages, unread, send, emitTyping, typing } = useChatStore();
  const ai = useAiChatStore();

  const [mode, setMode] = useState<'list' | 'chat'>(currentPeerId ? 'chat' : 'list');
  const [text, setText] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(() => peers.find((p) => p._id === currentPeerId) ?? null, [peers, currentPeerId]);
  const isBot = currentPeerId === 'NORTHBOT';
  const thread = currentPeerId
    ? isBot
      ? ai.messages.map((m) => ({ _id: m.id, self: m.self, fromUserId: m.self ? 'me' : 'bot', message: m.text, createdAt: m.createdAt }))
      : messages[currentPeerId] ?? []
    : [];

  useEffect(() => {
    if (!currentPeerId) setMode('list');
  }, [currentPeerId]);

  async function openPeer(p: Peer) {
    if (!token) return;
    setLoadingThread(true);
    try {
      setCurrentPeer(p._id);

      if (p._id === 'NORTHBOT') {
        ai.reset();
        setMode('chat');
        return;
      }

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
              {loadingThread || (isBot && ai.loading) ? <LoadingSpinner label={isBot ? 'NorthBot is thinking' : 'Loading messages'} /> : null}

              {!loadingThread
                ? thread.map((m, idx) => {
                    const prev = thread[idx - 1];
                    const next = thread[idx + 1];

                    const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                    const isGroupStart = !prev || groupKey(prev) !== groupKey(m) || newDay;
                    const isGroupEnd = !next || groupKey(next) !== groupKey(m) || dayKey(next.createdAt) !== dayKey(m.createdAt);

                    return (
                      <div key={m._id} className="chatRow">
                        {newDay ? <div className="daySep"><span>{dayLabel(m.createdAt)}</span></div> : null}
                        <div className={`bubbleRow ${m.self ? 'me' : 'them'} ${isGroupEnd ? 'tail' : ''} ${isGroupStart ? 'start' : 'cont'}`}>
                          <div className={`bubble ${m.self ? 'me' : 'them'}`}>
                            <div className="bubbleText">{isBot && !m.self ? <Markdown text={m.message} /> : m.message}</div>
                            <div className="bubbleMeta">{timeLabel(m.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                if (isBot) {
                  void ai.send(msg);
                } else {
                  void send(currentPeerId, msg);
                }
                setText('');
                setTimeout(() => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50);
              }}
            >
              <textarea
                className="chatInput"
                value={text}
                placeholder={isBot ? 'Ask NorthBot…' : 'Write a message…'}
                onChange={(e) => {
                  setText(e.target.value);
                  if (!isBot && currentPeerId) emitTyping(currentPeerId);
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
