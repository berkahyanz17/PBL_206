import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

export default function PasienRiwayat() {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('pasienUser') || '{}');
  const { bellButton, popup } = useNotif('notif-pasien', { background: 'rgba(255,255,255,0.4)' });

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/appointments/pasien/${user.id}`);
      if (res?.success) setRiwayat(res.data);
      setLoading(false);
    }
    load();
  }, []);

  const statusColor = { selesai: '#D1FAE5', dikonfirmasi: '#DBEAFE', menunggu: '#FEF3C7', ditolak: '#FEE2E2' };
  const statusText = { selesai: '#065F46', dikonfirmasi: '#1E40AF', menunggu: '#92400E', ditolak: '#991B1B' };
  const statusLabel = { selesai: 'Selesai', dikonfirmasi: 'Dikonfirmasi', menunggu: 'Menunggu', ditolak: 'Ditolak' };

  // Appointment dianggap "lewat jam" kalau tgl+jam sudah lampau tapi statusnya
  // masih menunggu/dikonfirmasi (gak pernah diproses/selesai tepat waktu).
  function sudahLewatJam(a) {
    if (!a.tgl || !a.jam) return false;
    if (a.status !== 'menunggu' && a.status !== 'dikonfirmasi') return false;
    const waktu = new Date(`${new Date(a.tgl).toISOString().slice(0, 10)}T${a.jam.length === 5 ? a.jam + ':00' : a.jam}`);
    return waktu < new Date();
  }

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/pasien/login'); }

  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Riwayat Konsultasi</h1>
          <div className="topbar-right">
            {bellButton}
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat data...</div>}
          {!loading && riwayat.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Belum ada riwayat konsultasi.</div>}
          {riwayat.map(a => {
            const lewat = sudahLewatJam(a);
            return (
            <div key={a.id} style={{ background: lewat ? '#F3F4F6' : '#EFF6FF', borderRadius: 14, padding: '20px 24px', marginBottom: 14, opacity: lewat ? 0.65 : 1, filter: lewat ? 'grayscale(0.4)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{a.dokter_nama}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.spesialis}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: lewat ? '#E5E7EB' : statusColor[a.status], color: lewat ? '#6B7280' : statusText[a.status], padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{statusLabel[a.status]}</span>
                  {lewat && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>⏱ Jam sudah lewat</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, width: 80, flexShrink: 0 }}>KELUHAN</div>
                <div style={{ fontSize: 13 }}>{a.keluhan}</div>
              </div>
              {a.jam && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, width: 80, flexShrink: 0 }}>JAM</div>
                  <div style={{ fontSize: 13 }}>{a.jam?.slice(0, 5)}</div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
      <MamoruChat />
      {popup}
    </div>
  );
}
