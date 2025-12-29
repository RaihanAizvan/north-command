import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ElfDashboard from './pages/ElfDashboard';
import SantaDashboard from './pages/SantaDashboard';
import MessagesPage from './pages/MessagesPage';
import { useAuthStore } from '../ui/state/auth';
import AppLayout from './components/AppLayout';

export default function App() {
  const { token, role } = useAuthStore();

  return (
    <Routes>
      {/* Public route (no shell) */}
      <Route path="/login" element={<Login />} />

      {/* Shell-wrapped routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to={token ? (role === 'OVERSEER' ? '/santa' : '/elf') : '/login'} replace />} />
        <Route
          path="/elf"
          element={token && role === 'FIELD_AGENT' ? <ElfDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/santa"
          element={token && role === 'OVERSEER' ? <SantaDashboard /> : <Navigate to="/login" replace />}
        />
        <Route path="/messages" element={token ? <MessagesPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}
