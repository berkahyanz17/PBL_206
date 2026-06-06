import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const initPasien = [
  { id: 1, nama: 'Budiman', nik: '3201234567890123', telp: '08123456789', email: 'Budiman@gmail.com' },
  { id: 2, nama: 'Megumi Fushiguro', nik: '3209876543210987', telp: '08234567890', email: 'megumi@gmail.com' },
  { id: 3, nama: 'Natsuki Seba', nik: '3205551234567890', telp: '08345678901', email: 'natsuki@gmail.com' },
];

export default function AdminPasien() {
  const navigate = useNavigate();
  const [pasiens, setPasiens] = useState(initPasien);
  const [search, setSearch] = useState('');
  const filtered = pasiens.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Data Pasien</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={() => navigate('/admin/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="section-title">Daftar Pasien</div>
          <div className="filter-row">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
              <input style={{ padding: '10px 16px 10px 38px', border: '1.5px solid var(--border)', borderRadius: 20, background: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }}
                placeholder="Cari nama pasien..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nama</th><th>NIK</th><th>Telepon</th><th>Email</th><th>Aksi</th></tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nama}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.nik}</td>
                      <td>{p.telp}</td>
                      <td>{p.email}</td>
                      <td><button className="btn-del" onClick={() => { if (window.confirm('Hapus data pasien ' + p.nama + '?')) setPasiens(prev => prev.filter(x => x.id !== p.id)); }}>🗑️</button></td>
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
