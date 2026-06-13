import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
import { useNotif } from '../../components/NotifPopup';

export default function AdminPasien() {
  const navigate = useNavigate();
  const [pasiens, setPasiens] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { bellButton, popup } = useNotif('notif-admin');

  useEffect(() => { loadPasiens(); }, []);

  async function loadPasiens() {
    setLoading(true);
    const res = await apiFetch('/pasien');
    if (res?.success) setPasiens(res.data);
    setLoading(false);
  }

  async function hapus(id, nama) {
    if (!window.confirm('Hapus data pasien ' + nama + '?')) return;
    await apiFetch(`/pasien/${id}`, { method: 'DELETE' });
    loadPasiens();
  }

  function logout() { sessionStorage.clear(); navigate('/admin/login'); }

 const filtered = pasiens.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));

  function maskNIK(nik) {
    if (!nik || nik === '-') return '-';
    const s = nik.toString();
    return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
  }
  function maskHP(hp) {
    if (!hp || hp === '-') return '-';
    const s = hp.toString();
    return s.slice(0, 4) + ' **** ' + s.slice(-4);
  }
  function maskEmail(email) {
    if (!email || email === '-') return '-';
    const [user, domain] = email.split('@');
    return user.slice(0, 2) + '*****@' + domain;
  }

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Data Pasien</h1>
          <div className="topbar-right">
            {bellButton}<button className="btn-logout" onClick={logout}>🚪 Logout</button>
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
              {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div> : (
                <table>
                  <thead><tr><th>Nama</th><th>NIK</th><th>Telepon</th><th>Email</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>}
                    {filtered.map(p => (
                      <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nama || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{maskNIK(p.nik)}</td>
                      <td>{maskHP(p.no_hp)}</td>
                      <td>{maskEmail(p.email)}</td>
                      <td><button className="btn-del" onClick={() => hapus(p.id, p.nama)}>🗑️</button></td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      {popup}
    </div>
  );
}
