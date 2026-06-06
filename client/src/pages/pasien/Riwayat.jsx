import { useNavigate } from 'react-router-dom';
import PasienSidebar from '../../components/PasienSidebar';

export default function PasienRiwayat() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      <PasienSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'linear-gradient(90deg,#7dd3fc,#38bdf8)' }}>
          <h1 style={{ color: '#1e3a5f' }}>Riwayat Konsultasi</h1>
          <div className="topbar-right">
            <button className="btn-notif" style={{ background: 'rgba(255,255,255,0.4)' }}>🔔</button>
            <button className="btn-logout" style={{ background: 'rgba(255,255,255,0.4)', color: '#1e3a5f', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/pasien/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Dr. Sarah Melati</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>15 Mei 2026 · Umum</div>
              </div>
              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Selesai</span>
            </div>
            {[['DIAGNOSA','Flu Ringan'],['CATATAN','Istirahat cukup'],['RESEP','Paracetamol 500mg x 1']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, width: 80, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 13, color: k === 'RESEP' ? 'var(--blue)' : 'inherit', fontWeight: k === 'RESEP' ? 600 : 400 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
