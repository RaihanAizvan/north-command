import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';

type Elf = { _id: string; username: string; role: 'FIELD_AGENT'; createdAt: string };

export default function ElfManagementPage() {
  const { token } = useAuthStore();
  const [elves, setElves] = useState<Elf[]>([]);
  const [pw, setPw] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/elves', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setElves)
      .catch(() => {});
  }, [token]);

  async function deleteElf(elfId: string) {
    if (!token) return;
    const ok = confirm('Delete this elf account? This cannot be undone.');
    if (!ok) return;
    await fetch(`/api/admin/elves/${elfId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setElves((prev) => prev.filter((e) => e._id !== elfId));
  }

  async function resetPassword(elfId: string) { 
    if (!token) return;
    const password = pw[elfId] ?? '';
    if (!password.trim()) return;
    await fetch(`/api/admin/elves/${elfId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setPw((p) => ({ ...p, [elfId]: '' }));
  }

  return (
    <div className="stack">
      <div className="panelTitle">Elf Management</div>
      {elves.map((e) => (
        <div key={e._id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 220px 140px 120px', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900 }}>{e.username}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Created: {new Date(e.createdAt).toLocaleDateString()}</div>
          </div>
          <input className="input" value={pw[e._id] ?? ''} onChange={(ev) => setPw((p) => ({ ...p, [e._id]: ev.target.value }))} placeholder="New password" />
          <button className="btn" onClick={() => void resetPassword(e._id)}>
            Reset
          </button>
          <button className="btn btnDanger" onClick={() => void deleteElf(e._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
