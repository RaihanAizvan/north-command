import { useNavigate } from 'react-router-dom';
import MessagesOverlay from '../components/MessagesOverlay';
import { useChatStore } from '../state/chat';

export default function MessagesPage() {
  const nav = useNavigate();
  const peers = useChatStore((s) => s.peers);

  return (
    <div className="panel" style={{ height: 'calc(100svh - 96px)', overflow: 'hidden' }}>
      <MessagesOverlay peers={peers} onClose={() => nav(-1)} />
    </div>
  );
}
