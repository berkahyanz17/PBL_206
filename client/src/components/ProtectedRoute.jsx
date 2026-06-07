import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ children, role }) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    if (role === 'admin') return <Navigate to="/admin/login" />;
    if (role === 'dokter') return <Navigate to="/dokter/login" />;
    if (role === 'pasien') return <Navigate to="/pasien/login" />;
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);
    // Cek expired
    if (decoded.exp * 1000 < Date.now()) {
      sessionStorage.clear();
      return <Navigate to="/" />;
    }
    // Cek role
    if (decoded.role !== role) {
      if (decoded.role === 'admin') return <Navigate to="/admin/dashboard" />;
      if (decoded.role === 'dokter') return <Navigate to="/dokter/jadwal" />;
      if (decoded.role === 'pasien') return <Navigate to="/pasien/home" />;
      return <Navigate to="/" />;
    }
  } catch {
    sessionStorage.clear();
    return <Navigate to="/" />;
  }

  return children;
}
