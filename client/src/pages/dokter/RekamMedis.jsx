import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';

export default function DokterRekam() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Rekam Medis</h1>
          <div className="topbar-right"><button className="btn-notif">🔔</button><button className="btn-logout" onClick={() => navigate('/dokter/login')}>🚪 Logout</button></div>
        </div>
        <div className="content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>👥 Daftar Pasien</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer' }}>
                <div className="avatar" style={{ background: '#a855f7' }}>MF</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>Megumi Fushiguro</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>2 Kunjungan</div></div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div className="avatar" style={{ background: '#a855f7', width: 44, height: 44, fontSize: 14 }}>MF</div>
                <div><div style={{ fontSize: 16, fontWeight: 700 }}>Megumi Fushiguro</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pria · 22 thn</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: 'var(--text-dark)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Riwayat Medis</button>
                <button style={{ padding: '8px 18px', borderRadius: 20, border: '1.5px solid var(--border)', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>Resep Obat</button>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>📅 30 Mei 2026</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Check up rutin</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kondisi baik, tekanan darah normal 120/80<br />Vitamin C 1×1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
