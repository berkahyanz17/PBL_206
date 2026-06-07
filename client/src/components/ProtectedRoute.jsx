import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    if (role === 'admin') return <Navigate to="/admin/login" />;
    if (role === 'dokter') return <Navigate to="/dokter/login" />;
    if (role === 'pasien') return <Navigate to="/pasien/login" />;
    return <Navigate to="/" />;
  }
  return children;
}
