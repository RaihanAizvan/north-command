import { create } from 'zustand';

type Role = 'OVERSEER' | 'FIELD_AGENT';

type AuthState = {
  token: string | null;
  role: Role | null;
  stationId: string | null;
  setAuth: (args: { token: string; role: Role; stationId?: string | null }) => void;
  clear: () => void;
};

const LS_KEY = 'north-command-auth';

function load(): Pick<AuthState, 'token' | 'role' | 'stationId'> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { token: null, role: null, stationId: null };
    const parsed = JSON.parse(raw) as { token: string; role: Role; stationId?: string | null };
    return { token: parsed.token ?? null, role: parsed.role ?? null, stationId: parsed.stationId ?? null };
  } catch {
    return { token: null, role: null, stationId: null };
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...load(),
  setAuth: ({ token, role, stationId = null }) => {
    const next = { token, role, stationId };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    set(next);
  },
  clear: () => {
    localStorage.removeItem(LS_KEY);
    set({ token: null, role: null, stationId: null });
  },
}));
