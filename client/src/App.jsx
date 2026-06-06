import { Routes, Route, Navigate } from 'react-router-dom';

// Index
import Index from './pages/Index';

// Admin
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminDokter from './pages/admin/Dokter';
import AdminPasien from './pages/admin/Pasien';
import AdminChat from './pages/admin/Chat';

// Dokter
import DokterLogin from './pages/dokter/Login';
import DokterLupa from './pages/dokter/LupaPassword';
import DokterJadwal from './pages/dokter/Jadwal';
import DokterRiwayat from './pages/dokter/Riwayat';
import DokterRekam from './pages/dokter/RekamMedis';
import DokterKelola from './pages/dokter/KelolaJadwal';
import DokterChat from './pages/dokter/Chat';
import DokterProfil from './pages/dokter/Profil';

// Pasien
import PasienLogin from './pages/pasien/Login';
import PasienDaftar from './pages/pasien/Daftar';
import PasienLupa from './pages/pasien/LupaPassword';
import PasienReset from './pages/pasien/ResetPassword';
import PasienHome from './pages/pasien/Home';
import PasienCari from './pages/pasien/CariDokter';
import PasienRiwayat from './pages/pasien/Riwayat';
import PasienProfil from './pages/pasien/Profil';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/appointments" element={<AdminAppointments />} />
      <Route path="/admin/dokter" element={<AdminDokter />} />
      <Route path="/admin/pasien" element={<AdminPasien />} />
      <Route path="/admin/chat" element={<AdminChat />} />

      {/* Dokter */}
      <Route path="/dokter/login" element={<DokterLogin />} />
      <Route path="/dokter/lupa-password" element={<DokterLupa />} />
      <Route path="/dokter/jadwal" element={<DokterJadwal />} />
      <Route path="/dokter/riwayat" element={<DokterRiwayat />} />
      <Route path="/dokter/rekam-medis" element={<DokterRekam />} />
      <Route path="/dokter/kelola-jadwal" element={<DokterKelola />} />
      <Route path="/dokter/chat" element={<DokterChat />} />
      <Route path="/dokter/profil" element={<DokterProfil />} />

      {/* Pasien */}
      <Route path="/pasien/login" element={<PasienLogin />} />
      <Route path="/pasien/daftar" element={<PasienDaftar />} />
      <Route path="/pasien/lupa-password" element={<PasienLupa />} />
      <Route path="/pasien/reset-password" element={<PasienReset />} />
      <Route path="/pasien/home" element={<PasienHome />} />
      <Route path="/pasien/cari-dokter" element={<PasienCari />} />
      <Route path="/pasien/riwayat" element={<PasienRiwayat />} />
      <Route path="/pasien/profil" element={<PasienProfil />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
