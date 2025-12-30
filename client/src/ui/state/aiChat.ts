import { create } from 'zustand';
import { apiUrl } from '../api';
import { useAuthStore } from './auth';

export type AiMsg = { id: string; self: boolean; text: string; createdAt: string };

type AiChatState = {
  messages: AiMsg[];
  loading: boolean;
  send: (text: string) => Promise<void>;
  reset: () => void;
};

export const useAiChatStore = create<AiChatState>((set, get) => ({
  messages: [],
  loading: false,

  reset: () => set({ messages: [], loading: false }),

  send: async (text: string) => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    const now = new Date().toISOString();
    const userMsg: AiMsg = { id: `u-${Date.now()}`, self: true, text, createdAt: now };
    set((s) => ({ messages: [...s.messages, userMsg], loading: true }));

    const res = await fetch(apiUrl('/api/ai/chat'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      const botMsg: AiMsg = {
        id: `b-${Date.now()}`,
        self: false,
        text: `NorthBot is unavailable. ${t || ''}`.trim(),
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, botMsg], loading: false }));
      return;
    }

    const data = (await res.json()) as { reply: string };
    const botMsg: AiMsg = { id: `b-${Date.now()}`, self: false, text: data.reply, createdAt: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, botMsg], loading: false }));
  },
}));
