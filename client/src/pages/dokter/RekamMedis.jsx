import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DokterSidebar from '../../components/DokterSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

export default function DokterRekam() {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const { bellButton, popup } = useNotif('notif-dokter');
  const user = JSON.parse(sessionStorage.getItem('dokterUser') || '{}');

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/rekam-medis/dokter/${user.id}`);
      if (res?.success) setRiwayat(res.data);
    }
    load();
  }, []);

  const filtered = riwayat.filter(r => r.pasien_nama?.toLowerCase().includes(search.toLowerCase()));

  async function logout() { const rt = localStorage.getItem('refreshToken'); if (rt) { await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }); } sessionStorage.clear(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/dokter/login'); }

  return (
    <div className="dashboard-layout">
      <DokterSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--green)' }}>
          <h1>Rekam Medis</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <span>🔍</span>
            <input type="text" placeholder="Cari nama pasien..." style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Tanggal</th><th>Pasien</th><th>Diagnosa</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>}
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID') : new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={{ fontWeight: 600 }}>{r.pasien_nama}</td>
                    <td><span className="badge-pill badge-green" style={{ padding: '4px 12px' }}>{r.diagnosa}</span></td>
                    <td><button className="btn-action btn-detail" onClick={() => setDetail(r)}>Lihat Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay open" onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, animation: 'slideUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Detail Rekam Medis</h3>
              <button onClick={() => setDetail(null)} style={{ background: '#F3F4F6', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,var(--green-dark),var(--green))', borderRadius: 14, padding: '22px 24px', marginBottom: 20, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{detail.pasien_nama?.charAt(0)}</div>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{detail.pasien_nama}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Keluhan: {detail.keluhan}</div></div>
            </div>
            {[['Diagnosa', detail.diagnosa], ['Catatan Dokter', detail.catatan], ['Resep Obat', detail.resep]].map(([label, val]) => (
              <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{val || '-'}</div>
              </div>
            ))}
            <button onClick={() => setDetail(null)} className="btn-batal" style={{ width: '100%' }}>Tutup</button>
          </div>
        </div>
      )}
      {popup}
    </div>
  );
}
