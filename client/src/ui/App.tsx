import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ElfDashboard from './pages/ElfDashboard';
import SantaDashboard from './pages/SantaDashboard';
import MessagesPage from './pages/MessagesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ElfManagementPage from './pages/ElfManagementPage';
import SettingsPage from './pages/SettingsPage';
import { useAuthStore } from '../ui/state/auth';
import AppLayout from './components/AppLayout';

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function roleFromToken(token: string | null): 'OVERSEER' | 'FIELD_AGENT' | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { role?: 'OVERSEER' | 'FIELD_AGENT' };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default function App() {
  const { token, role } = useAuthStore();
  const effectiveRole = role ?? roleFromToken(token);

  return (
    <Routes>
      {/* Public route (no shell) */}
      <Route path="/login" element={<Login />} />

      {/* Shell-wrapped routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to={token ? (effectiveRole === 'OVERSEER' ? '/santa' : '/elf') : '/login'} replace />} />
        <Route
          path="/elf"
          element={token && effectiveRole === 'FIELD_AGENT' ? <ElfDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/santa"
          element={token && effectiveRole === 'OVERSEER' ? <SantaDashboard /> : <Navigate to="/login" replace />}
        />
        <Route path="/messages" element={token ? <MessagesPage /> : <Navigate to="/login" replace />} />
        <Route path="/analytics" element={token && effectiveRole === 'OVERSEER' ? <AnalyticsPage /> : <Navigate to="/login" replace />} />
        <Route path="/elves" element={token && effectiveRole === 'OVERSEER' ? <ElfManagementPage /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={token && effectiveRole === 'OVERSEER' ? <SettingsPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}
