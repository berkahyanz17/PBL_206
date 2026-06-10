import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import { apiFetch } from '../../utils/api';
import MamoruChat from './Mamoruchat';

export default function PasienHome() {
  const navigate = useNavigate();
  const nama = sessionStorage.getItem('pasienNama') || 'Pasien';
  const token = sessionStorage.getItem('token') || '';
  const user = JSON.parse(sessionStorage.getItem('pasienUser') || '{}');

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/appointments/pasien/${user.id}`);
      if (res?.success) setAppointments(res.data);
    }
    load();
  }, []);

  function logout() { sessionStorage.clear(); navigate('/pasien/login'); }

  const upcoming = appointments.filter(a => a.status === 'dikonfirmasi' || a.status === 'menunggu');
  const recent = appointments.filter(a => a.status === 'selesai').slice(0, 1);

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Portal Pasien</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>Selamat Datang, {nama}! 👋</h2>
            <p style={{ fontSize: 14, color: '#3b5a8a', marginTop: 4 }}>Kelola kesehatan Anda dengan mudah</p>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12 }}>Appointment Mendatang</div>
          {upcoming.length === 0 && <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>Tidak ada appointment mendatang. <span onClick={() => navigate('/pasien/cari-dokter')} style={{ color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>Booking sekarang →</span></div>}
          {upcoming.map(a => (
            <div key={a.id} style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.dokter_nama} - {a.spesialis}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.tgl} · {a.jam}</div>
              </div>
              <span style={{ background: '#1d4ed8', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a.status === 'dikonfirmasi' ? 'Terkonfirmasi' : 'Menunggu'}</span>
            </div>
          ))}

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, marginTop: 20 }}>Riwayat Konsultasi Terakhir</div>
          {recent.length === 0 && <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>Belum ada riwayat konsultasi.</div>}
          {recent.map(a => (
            <div key={a.id} style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.dokter_nama}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.jam?.slice(0, 5)} · {a.keluhan}
                </div>
              </div>
              <span onClick={() => navigate('/pasien/riwayat')} style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Lihat Detail</span>
            </div>
          ))}
        </div>
      </div>
      <MamoruChat />
    </div>
  );
}
