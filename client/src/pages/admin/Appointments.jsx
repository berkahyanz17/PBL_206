import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';
/*
const initAppts = [
  { id: 1, pasien: 'Andi Yohee', keluhan: 'Sakit kepala, Demam', dokter: 'dr. Dazai Osamu', spesialis: 'Umum', tgl: '24 Mei', jam: '15.00', status: 'menunggu' },
  { id: 2, pasien: 'Budiman', keluhan: 'Pusing, mual', dokter: 'dr. Kuro Tetsuro', spesialis: 'Umum', tgl: '25 Mei', jam: '09.00', status: 'menunggu' },
  { id: 3, pasien: 'Megumi', keluhan: 'Muntah, batuk pilek', dokter: 'dr. Kuro Tetsuro', spesialis: 'Umum', tgl: '24 Mei', jam: '13.30', status: 'dikonfirmasi' },
  { id: 4, pasien: 'Natsuki Seba', keluhan: 'Check up rutin', dokter: 'dr. Ichinose Guren', spesialis: 'Spesialis Dalam', tgl: '22 Mei', jam: '10.00', status: 'selesai' },
];*/
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAppts(); }, []);

  async function loadAppts() {
    setLoading(true);
    const res = await apiFetch('/appointments');
    if (res?.success) setAppts(res.data);
    setLoading(false);
  }

  async function forward(id) {
    await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dikonfirmasi' })
    });
    loadAppts();
  }

  async function tolak(id, nama) {
    if (!window.confirm('Tolak appointment ' + nama + '?')) return;
    await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ditolak' })
    });
    loadAppts();
  }

  function logout() { sessionStorage.clear(); navigate('/admin/login'); }

  const filtered = appts.filter(a => filter === 'semua' || a.status === filter);
  const statusLabel = { menunggu: 'Menunggu', dikonfirmasi: 'Dikonfirmasi Dokter', selesai: 'Selesai', ditolak: 'Ditolak' };

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Appointments</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="filter-row">
            {['semua', 'menunggu', 'dikonfirmasi', 'selesai', 'ditolak'].map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                style={filter === f ? { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : {}}
                onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="card">
            <div className="table-wrap">
              {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div> : (
                <table>
                  <thead><tr><th>Pasien</th><th>Dokter</th><th>Tgl &amp; Jam</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>}
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td><div style={{ fontWeight: 600 }}>{a.pasien_nama}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.keluhan}</div></td>
                        <td><div style={{ fontWeight: 600 }}>{a.dokter_nama}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.spesialis}</div></td>
                        <td><div style={{ fontWeight: 600 }}>{a.tgl}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.jam}</div></td>
                        <td><span className={`badge ${a.status === 'ditolak' ? 'tolak' : a.status}`}>{statusLabel[a.status]}</span></td>
                        <td>
                          {a.status === 'menunggu' ? (<>
                            <button className="btn-action btn-forward" onClick={() => forward(a.id)}>Forward</button>
                            <button className="btn-action btn-tolak" style={{ marginLeft: 6 }} onClick={() => tolak(a.id, a.pasien_nama)}>Tolak</button>
                          </>) : (
                            <button className="btn-action btn-detail" onClick={() => setDetail(a)}>Detail</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay open" onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Detail Appointment</h3>
              <button onClick={() => setDetail(null)} style={{ background: '#F3F4F6', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#0D1B4B,#1a2a6c)', borderRadius: 14, padding: '20px 24px', marginBottom: 18, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{detail.pasien_nama?.charAt(0)}</div>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{detail.pasien_nama}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 3 }}>{detail.dokter_nama} · {detail.spesialis}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Tanggal &amp; Jam</div><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.tgl} · {detail.jam}</div></div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Status</div><div style={{ fontSize: 14, fontWeight: 700 }}>{statusLabel[detail.status]}</div></div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, gridColumn: '1/-1' }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Keluhan</div><div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{detail.keluhan}</div></div>
            </div>
            <button onClick={() => setDetail(null)} style={{ width: '100%', padding: 13, background: '#F3F4F6', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
