import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';
import MamoruChat from './Mamoruchat';
import { apiFetch } from '../../utils/api';
import { useNotif, PASIEN_NOTIFS } from '../../components/NotifPopup';

export default function PasienRiwayat() {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem('pasienUser') || '{}');
  const { bellButton, popup } = useNotif('notif-pasien', PASIEN_NOTIFS, { background: 'rgba(255,255,255,0.4)' });

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

  function logout() { sessionStorage.clear(); navigate('/pasien/login'); }

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
          {riwayat.map(a => (
            <div key={a.id} style={{ background: '#EFF6FF', borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{a.dokter_nama}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(a.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.spesialis}
                  </div>
                </div>
                <span style={{ background: statusColor[a.status], color: statusText[a.status], padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{statusLabel[a.status]}</span>
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
          ))}
        </div>
      </div>
      <MamoruChat />
      {popup}
    </div>
  );
}
