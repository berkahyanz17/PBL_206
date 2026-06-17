import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/api';

export default function ProtectedRoute({ children, role }) {
  const token = getAccessToken();

  if (!token) {
    if (role === 'admin') return <Navigate to="/admin/login" />;
    if (role === 'dokter') return <Navigate to="/dokter/login" />;
    if (role === 'pasien') return <Navigate to="/pasien/login" />;
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp * 1000 < Date.now()) {
      // Token expired — try refresh synchronously isn't possible here
      // Clear and redirect, apiFetch will handle refresh on next API call
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (role === 'admin') return <Navigate to="/admin/login" />;
        if (role === 'dokter') return <Navigate to="/dokter/login" />;
        if (role === 'pasien') return <Navigate to="/pasien/login" />;
        return <Navigate to="/" />;
      }
      // Has refresh token — let them through, apiFetch will refresh
    }

    if (decoded.role !== role) {
      if (decoded.role === 'admin') return <Navigate to="/admin/dashboard" />;
      if (decoded.role === 'dokter') return <Navigate to="/dokter/jadwal" />;
      if (decoded.role === 'pasien') return <Navigate to="/pasien/home" />;
      return <Navigate to="/" />;
    }
  } catch {
    clearTokens();
    return <Navigate to="/" />;
  }

  return children;
}
