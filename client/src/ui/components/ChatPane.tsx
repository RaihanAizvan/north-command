import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';

function groupKey(m: { self?: boolean; fromUserId: string }) {
  return `${m.self ? 'me' : 'them'}:${m.fromUserId}`;
}

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
export default function ChatPane() {
  const { token } = useAuthStore();
  const { currentPeerId, peers, messages, send, typing, emitTyping } = useChatStore();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const peer = useMemo(() => peers.find((p) => p._id === currentPeerId) ?? null, [peers, currentPeerId]);
  const thread = currentPeerId ? messages[currentPeerId] ?? [] : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length, currentPeerId]);

  const threadLoading = currentPeerId != null && messages[currentPeerId] == null;

  if (!token) return null;

  const typingText = currentPeerId && typing[currentPeerId] ? 'Typing…' : '';

  return (
    <div className="chatPane">
      <div className="chatHeader">
        <div className="chatTitle">{peer ? peer.username : 'Messages'}</div>
        <div className="chatSubtle">{typingText}</div>
      </div>

      <div className="chatThread">
        {threadLoading ? (
          <div className="chatEmpty">
            <div className="spinWrap">
              <div className="spinRingOnly" style={{ width: 34, height: 34 }} />
            </div>
          </div>
        ) : null}

        {!threadLoading && thread.length === 0 ? <div className="chatEmpty">No messages yet.</div> : null}

        {!threadLoading
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
                      <div className="bubbleText">{m.message}</div>
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
        className="chatComposer"
        onSubmit={(e) => {
          e.preventDefault();
          if (!currentPeerId) return;
          const msg = text.trim();
          if (!msg) return;
          void send(currentPeerId, msg);
          setText('');
        }}
      >
        <textarea
          className="chatInput"
          value={text}
          placeholder={currentPeerId ? 'Message…' : 'Select a DM'}
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
          disabled={!currentPeerId}
        />
        <button className="btn btnPrimary" disabled={!currentPeerId || !text.trim()} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
