import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../utils/api';

export default function ProtectedRoute({ children, role }) {
  const token = getAccessToken();

  if (!token) {
    if (role === 'admin')  return <Navigate to="/admin/login" replace />;
    if (role === 'dokter') return <Navigate to="/dokter/login" replace />;
    if (role === 'pasien') return <Navigate to="/pasien/login" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
