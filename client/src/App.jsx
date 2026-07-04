import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminDokter from './pages/admin/Dokter';
import AdminPasien from './pages/admin/Pasien';
import AdminChat from './pages/admin/Chat';
import AdminSettings from './pages/admin/Settings';
import DokterLogin from './pages/dokter/Login';
import DokterLupa from './pages/dokter/LupaPassword';
import DokterReset from './pages/dokter/ResetPassword';
import DokterJadwal from './pages/dokter/Jadwal';
import DokterRiwayat from './pages/dokter/Riwayat';
import DokterRekam from './pages/dokter/RekamMedis';
import DokterKelola from './pages/dokter/KelolaJadwal';
import DokterChat from './pages/dokter/Chat';
import DokterProfil from './pages/dokter/Profil';
import DokterSettings from './pages/dokter/Settings';
import PasienLogin from './pages/pasien/Login';
import PasienDaftar from './pages/pasien/Daftar';
import PasienLupa from './pages/pasien/LupaPassword';
import PasienReset from './pages/pasien/ResetPassword';
import PasienHome from './pages/pasien/Home';
import PasienCari from './pages/pasien/CariDokter';
import PasienRiwayat from './pages/pasien/Riwayat';
import PasienProfil from './pages/pasien/Profil';
import PasienSettings from './pages/pasien/Settings';

const A = ({ children }) => <ProtectedRoute role="admin">{children}</ProtectedRoute>;
const D = ({ children }) => <ProtectedRoute role="dokter">{children}</ProtectedRoute>;
const P = ({ children }) => <ProtectedRoute role="pasien">{children}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<A><AdminDashboard /></A>} />
      <Route path="/admin/appointments" element={<A><AdminAppointments /></A>} />
      <Route path="/admin/dokter" element={<A><AdminDokter /></A>} />
      <Route path="/admin/pasien" element={<A><AdminPasien /></A>} />
      <Route path="/admin/chat" element={<A><AdminChat /></A>} />
      <Route path="/admin/settings" element={<A><AdminSettings /></A>} />
      <Route path="/dokter/login" element={<DokterLogin />} />
      <Route path="/dokter/lupa-password" element={<DokterLupa />} />
      <Route path="/dokter/reset-password" element={<DokterReset />} />
      <Route path="/dokter/jadwal" element={<D><DokterJadwal /></D>} />
      <Route path="/dokter/riwayat" element={<D><DokterRiwayat /></D>} />
      <Route path="/dokter/rekam-medis" element={<D><DokterRekam /></D>} />
      <Route path="/dokter/kelola-jadwal" element={<D><DokterKelola /></D>} />
      <Route path="/dokter/chat" element={<D><DokterChat /></D>} />
      <Route path="/dokter/profil" element={<D><DokterProfil /></D>} />
      <Route path="/dokter/settings" element={<D><DokterSettings /></D>} />
      <Route path="/pasien/login" element={<PasienLogin />} />
      <Route path="/pasien/daftar" element={<PasienDaftar />} />
      <Route path="/pasien/lupa-password" element={<PasienLupa />} />
      <Route path="/pasien/reset-password" element={<PasienReset />} />
      <Route path="/pasien/home" element={<P><PasienHome /></P>} />
      <Route path="/pasien/cari-dokter" element={<P><PasienCari /></P>} />
      <Route path="/pasien/riwayat" element={<P><PasienRiwayat /></P>} />
      <Route path="/pasien/profil" element={<P><PasienProfil /></P>} />
      <Route path="/pasien/settings" element={<P><PasienSettings /></P>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
