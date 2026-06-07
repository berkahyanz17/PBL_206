import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { apiFetch } from '../../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pasien: 0, dokter: 0, appointments: 0 });
  const [recentAppts, setRecentAppts] = useState([]);
  const [dokters, setDokters] = useState([]);

  useEffect(() => {
    async function load() {
      const [pasienRes, dokterRes, apptRes] = await Promise.all([
        apiFetch('/pasien'),
        apiFetch('/dokter'),
        apiFetch('/appointments')
      ]);
      if (pasienRes?.success) setStats(s => ({ ...s, pasien: pasienRes.data.length }));
      if (dokterRes?.success) {
        setStats(s => ({ ...s, dokter: dokterRes.data.length }));
        setDokters(dokterRes.data.slice(0, 3));
      }
      if (apptRes?.success) {
        const today = new Date().toISOString().slice(0, 10);
        const todayAppts = apptRes.data.filter(a => a.tgl?.slice(0, 10) === today);
        setStats(s => ({ ...s, appointments: todayAppts.length }));
        setRecentAppts(apptRes.data.slice(0, 3));
      }
    }
    load();
  }, []);

  function logout() {
    sessionStorage.clear();
    navigate('/admin/login');
  }

  const statusBadge = { menunggu: 'menunggu', dikonfirmasi: 'dikonfirmasi', selesai: 'selesai', ditolak: 'tolak' };
  const statusLabel = { menunggu: 'Menunggu', dikonfirmasi: 'Dikonfirmasi', selesai: 'Selesai', ditolak: 'Ditolak' };
  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e'];

  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Dashboard</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="stat-grid">
            {[{ icon: '👥', label: 'Total Pasien', value: stats.pasien, cls: 'blue' },
              { icon: '🩺', label: 'Total Dokter', value: stats.dokter, cls: 'green' },
              { icon: '📅', label: 'Appointments Hari Ini', value: stats.appointments, cls: 'orange' }].map(s => (
              <div className="stat-card" key={s.label}>
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">⏰ Appointment Terbaru</div>
                <span className="card-link" onClick={() => navigate('/admin/appointments')}>Lihat Semua</span>
              </div>
              {recentAppts.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada appointment.</div>}
              {recentAppts.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar" style={{ background: colors[i % colors.length] }}>{a.pasien_nama?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.pasien_nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.dokter_nama} · {a.jam}</div>
                  </div>
                  <span className={`badge ${statusBadge[a.status]}`}>{statusLabel[a.status]}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🩺 Dokter Terdaftar</div>
                <span className="card-link" onClick={() => navigate('/admin/dokter')}>Lihat Semua</span>
              </div>
              {dokters.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar" style={{ background: colors[i % colors.length] }}>{d.nama?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.spesialis}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
