import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../state/auth';
import { useChatStore } from '../state/chat';

function groupKey(m: { self?: boolean; fromUserId: string; createdAt: string }) {
  return `${m.self ? 'me' : 'them'}:${m.fromUserId}`;
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
        {threadLoading ? <div className="chatEmpty"><div className="spinWrap"><div className="spinRingOnly" style={{ width: 34, height: 34 }} /></div></div> : null}
        {!threadLoading && thread.length === 0 ? <div className="chatEmpty">No messages yet.</div> : null}
        {thread.map((m, idx) => {
          const prev = thread[idx - 1];
          const newGroup = !prev || groupKey(prev) !== groupKey(m);
          return (
            <div key={m._id} className={`chatMsg ${m.self ? 'me' : 'them'} ${newGroup ? 'groupStart' : 'cont'}`}>
              <div className="chatBubble">{m.message}</div>
              {newGroup ? <div className="chatTime">{new Date(m.createdAt).toLocaleTimeString()}</div> : null}
            </div>
          );
        })}
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
