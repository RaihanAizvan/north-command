import { useEffect } from 'react';
import { useChatStore } from '../state/chat';

export type Toast = { id: string; title: string; message: string; at: number };

export default function ToastHost({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((t) => window.setTimeout(() => dismiss(t.id), 4200));
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [toasts, dismiss]);

  return (
    <div className="toastHost" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <div className="toastTop">
            <div className="toastTitle">{t.title}</div>
            <button className="toastX" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
          <div className="toastMsg">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
