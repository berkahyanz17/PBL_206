import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const initDokter = [
  { id: 1, init: 'KT', color: '#22c55e', nama: 'dr. Kuro Tetsuro', spesialis: 'umum', str: 'STR-2025-1111', harga: 'Rp. 150.000' },
  { id: 2, init: 'IG', color: '#3b82f6', nama: 'dr. Ichinose Guren', spesialis: 'spesialis dalam', str: 'STR-2025-2222', harga: 'Rp. 200.000' },
  { id: 3, init: 'DO', color: '#f59e0b', nama: 'dr. Dazai Osamu', spesialis: 'anak', str: 'STR-2025-3333', harga: 'Rp. 100.000' },
];

export function AdminDokter() {
  const navigate = useNavigate();
  const [dokters, setDokters] = useState(initDokter);
  const [filter, setFilter] = useState('semua');
  const filtered = dokters.filter(d => filter === 'semua' || d.spesialis === filter);

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Daftar Dokter</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={() => navigate('/admin/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="section-title">Kelola Dokter</div>
          <div className="filter-row">
            {['semua', 'umum', 'spesialis dalam', 'anak'].map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                style={filter === f ? { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : {}}
                onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nama</th><th>Spesialisasi</th><th>No. STR</th><th>Harga</th><th>Aksi</th></tr></thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar" style={{ background: d.color }}>{d.init}</div><span style={{ fontWeight: 600 }}>{d.nama}</span></div></td>
                      <td>{d.spesialis}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.str}</td>
                      <td style={{ fontWeight: 700 }}>{d.harga}</td>
                      <td><button className="btn-del" onClick={() => { if (window.confirm('Hapus ' + d.nama + '?')) setDokters(prev => prev.filter(x => x.id !== d.id)); }}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDokter;
