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

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function roleFromToken(token: string | null): Role | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { role?: Role };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function load(): Pick<AuthState, 'token' | 'role' | 'stationId'> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { token: null, role: null, stationId: null };
    const parsed = JSON.parse(raw) as { token: string; role?: Role | null; stationId?: string | null };
    const token = parsed.token ?? null;
    const role = parsed.role ?? roleFromToken(token);
    return { token, role, stationId: parsed.stationId ?? null };
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
