import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/auth';

type Elf = { _id: string; username: string; role: 'FIELD_AGENT'; createdAt: string };

export default function ElfManagementPage() {
  const { token } = useAuthStore();
  const [elves, setElves] = useState<Elf[]>([]);
  const [modalElf, setModalElf] = useState<Elf | null>(null);
  const [modalTasks, setModalTasks] = useState<Array<{ _id: string; title: string; status: string }> | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '') + '/api/admin/elves', { headers: { Authorization: `Bearer ${token}` } })
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

  async function viewTasks(elf: Elf) {
    if (!token) return;
    setModalElf(elf);
    setModalTasks(null);
    const list = await fetch(`/api/admin/elves/${elf._id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    setModalTasks(list);
  }

  return (
    <div className="stack">
      <div className="panelTitle">Elf Management</div>
      {elves.map((e) => (
        <div key={e._id} className="elfRow">
          <div className="elfMeta">
            <div className="elfName">{e.username}</div>
            <div className="elfSub">Created: {new Date(e.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="elfActions">
            <button className="btn" onClick={() => void viewTasks(e)}>
              View tasks
            </button>
            <button className="btn btnDanger" onClick={() => void deleteElf(e._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {modalElf ? (
        <div className="msgOverlay" onClick={() => setModalElf(null)}>
          <div className="msgCard" onClick={(ev) => ev.stopPropagation()}>
            <div className="overlayPanel">
              <div className="overlayHeader">
                <div className="overlayTitle">Tasks for {modalElf.username}</div>
                <button className="iconBtn" onClick={() => setModalElf(null)} aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="overlayBody">
                <div className="inboxList">
                  {!modalTasks ? (
                    <div className="inboxEmpty">Loading…</div>
                  ) : modalTasks.length === 0 ? (
                    <div className="inboxEmpty">No tasks assigned.</div>
                  ) : (
                    modalTasks.map((t) => (
                      <div key={t._id} className="inboxItem">
                        <div className="inboxIcon" aria-hidden>
                          {t.status === 'COMPLETED' ? 'D' : t.status === 'IN_PROGRESS' ? 'P' : 'O'}
                        </div>
                        <div className="inboxBody">
                          <div className="inboxTop">
                            <div className="inboxType">{t.status}</div>
                          </div>
                          <div className="inboxMsg" style={{ display: 'block', color: 'rgba(232,240,255,0.9)' }}>
                            {t.title}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
