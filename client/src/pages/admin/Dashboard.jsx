import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <div className="main-content">
        <div className="topbar" style={{ background: 'var(--navy)' }}>
          <h1>Dashboard</h1>
          <div className="topbar-right">
            <button className="btn-notif">🔔</button>
            <button className="btn-logout" onClick={() => navigate('/admin/login')}>🚪 Logout</button>
          </div>
        </div>
        <div className="content-area">
          <div className="stat-grid">
            {[{ icon: '👥', label: 'Total Pasien', value: '1265', cls: 'blue' },
              { icon: '🩺', label: 'Total Dokter', value: '100', cls: 'green' },
              { icon: '📅', label: 'Appointments Hari Ini', value: '150', cls: 'orange' }].map(s => (
              <div className="stat-card" key={s.label}>
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-note">⚠️ Angka dari database</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">⏰ Appointment Terbaru</div>
                <span className="card-link" onClick={() => navigate('/admin/appointments')}>Lihat Semua</span>
              </div>
              {[{ init: 'AS', color: '#6366f1', name: 'Andi Saputra', sub: 'dr. Rina · 09.00', badge: 'menunggu', label: 'Menunggu' },
                { init: 'RD', color: '#ec4899', name: 'Rina Dewi', sub: 'dr. Budi · 10.30', badge: 'dikonfirmasi', label: 'Dikonfirmasi Dokter' },
                { init: 'FN', color: '#14b8a6', name: 'Fajar Nugroho', sub: 'dr. Sari · 11.00', badge: 'selesai', label: 'Selesai' }].map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar" style={{ background: a.color }}>{a.init}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.sub}</div></div>
                  <span className={`badge ${a.badge}`}>{a.label}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 10, background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E' }}>⚠️ Preview ini akan terisi otomatis dari database saat backend terhubung</div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">💬 Chat Dokter</div>
                <span className="card-link" onClick={() => navigate('/admin/chat')}>Buka Semua</span>
              </div>
              {[{ init: 'RW', color: '#22c55e', name: 'dr. Rina Wulandari', preview: 'Nyam nyam', time: '10.10', online: true },
                { init: 'BS', color: '#3b82f6', name: 'dr. Budi Sanjaya', preview: 'Yehoo', time: '12.15', online: false },
                { init: 'SH', color: '#f59e0b', name: 'dr. Sari Handayani', preview: 'Saya bisanya ja...', time: '14.50', online: true }].map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/admin/chat')}>
                  <div className="avatar" style={{ background: c.color }}>{c.init}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.preview}</div></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.time}</div>
                    {c.online && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></div>}
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
