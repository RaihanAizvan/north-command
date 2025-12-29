import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';

type Message = { _id: string; fromUserId: string; toUserId: string; message: string; createdAt: string; self?: boolean };

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function getMyUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    const payload = JSON.parse(json) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

type Peer = { _id: string; username: string };

type ChatState = {
  socket: Socket | null;
  currentPeerId: string | null;
  messages: Record<string, Message[]>; // by peerId
  peers: Peer[];
  unread: Record<string, number>; // by peerId
  typing: Record<string, boolean>; // by peerId
  setCurrentPeer: (peerId: string | null) => void;
  setPeers: (peers: Peer[]) => void;
  connect: () => void;
  disconnect: () => void;
  send: (toUserId: string, message: string) => Promise<void>;
  emitTyping: (toUserId: string) => void;
  prependHistory: (peerId: string, history: Message[]) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  currentPeerId: null,
  messages: {},
  peers: [],
  unread: {},
  typing: {},

  setCurrentPeer: (peerId) => set((s) => ({ currentPeerId: peerId, unread: peerId ? { ...s.unread, [peerId]: 0 } : s.unread })),
  setPeers: (peers) => set({ peers }),

  connect: () => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    const sock = io({ auth: { token } });

    sock.on('chat:msg', (msg: Message) => {
      const peerId = msg.self ? msg.toUserId : msg.fromUserId;
      set((s) => {
        const arr = s.messages[peerId] ? [...s.messages[peerId]] : [];
        arr.push({ ...msg, createdAt: new Date(msg.createdAt).toISOString() });
        const unread = { ...s.unread };
        const typing = { ...s.typing, [peerId]: false };
        if (s.currentPeerId !== peerId && !msg.self) unread[peerId] = (unread[peerId] ?? 0) + 1;
        return { messages: { ...s.messages, [peerId]: arr }, unread, typing };
      });
    });

    sock.on('chat:typing', (payload: { fromUserId: string }) => {
      const peerId = payload.fromUserId;
      set((s) => ({ typing: { ...s.typing, [peerId]: true } }));
      window.setTimeout(() => {
        set((s) => ({ typing: { ...s.typing, [peerId]: false } }));
      }, 1200);
    });

    set({ socket: sock });
  },

  disconnect: () => {
    const sock = get().socket;
    if (sock) sock.disconnect();
    set({ socket: null });
  },

  send: async (toUserId, message) => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    await fetch(`/api/chat/dm/${toUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
    // server will echo via socket
  },

  emitTyping: (toUserId) => {
    const sock = get().socket;
    if (!sock) return;
    sock.emit('chat:typing', { toUserId });
  },

  prependHistory: (peerId, history) => {
    const { token } = useAuthStore.getState();
    const myId = token ? getMyUserIdFromJwt(token) : null;

    const normalized = history.map((m) => {
      // Prefer robust inference for DMs: if the message is addressed to the peer, it's from me.
      // This works even if token decoding fails.
      const inferredSelf = m.toUserId === peerId;
      return {
        ...m,
        createdAt: new Date(m.createdAt).toISOString(),
        self: myId ? m.fromUserId === myId : inferredSelf,
      };
    });

    set((s) => ({
      messages: { ...s.messages, [peerId]: normalized },
      unread: { ...s.unread, [peerId]: 0 },
      typing: { ...s.typing, [peerId]: false },
    }));
  },
}));
