import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';
import { Avatar } from './Avatar';

type Peer = { _id: string; username: string };

async function authGet<T>(url: string, token: string): Promise<T> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('Request failed');
  return r.json();
}

export default function MessagesPanel({ peers }: { peers: Peer[] }) {
  const { token, role } = useAuthStore();
  const { currentPeerId, setCurrentPeer, prependHistory, messages, unread, send } = useChatStore();
  const [text, setText] = useState('');

  const active = useMemo(() => peers.find((p) => p._id === currentPeerId) ?? null, [peers, currentPeerId]);
  const thread = currentPeerId ? messages[currentPeerId] ?? [] : [];

  async function openPeer(p: Peer) {
    if (!token) return;
    setCurrentPeer(p._id);
    const hist = await authGet<{ _id: string; fromUserId: string; toUserId: string; message: string; createdAt: string }[]>(
      `/api/chat/dm/${p._id}`,
      token
    );
    prependHistory(p._id, hist);
  }

  // On desktop, this panel is used as a DM selector (sidebar-like)
  // On mobile, it can still be used as the full messaging overlay.
  return (
    <div className="msgPanel">
      <div className="msgLeft">
        <div className="msgTitle">Messaging</div>
        <div className="msgList">
          {peers.map((p) => (
            <button key={p._id} className={`msgRow ${currentPeerId === p._id ? 'active' : ''}`} onClick={() => void openPeer(p)}>
              <Avatar name={p.username} role={role === 'OVERSEER' ? 'FIELD_AGENT' : 'OVERSEER'} />
              <div className="msgRowBody">
                <div className="msgRowTop">
                  <div className="msgName">{p.username}</div>
                  {(unread[p._id] ?? 0) > 0 ? <span className="msgUnread">{unread[p._id]}</span> : null}
                </div>
                <div className="msgPreview">Direct message</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="msgRight">
        <div className="msgHeader">{active ? active.username : 'Select a conversation'}</div>
        <div className="msgThread">
          {thread.map((m) => (
            <div key={m._id} className={`msgBubble ${m.self ? 'me' : 'them'}`}>
              <div className="msgText">{m.message}</div>
              <div className="msgMeta">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        <div className="msgComposer">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" />
          <button
            className="btn btnPrimary"
            disabled={!currentPeerId || !text.trim()}
            onClick={() => {
              if (!currentPeerId || !text.trim()) return;
              void send(currentPeerId, text.trim());
              setText('');
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
