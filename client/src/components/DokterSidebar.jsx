import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '📅', label: 'Jadwal', path: '/dokter/jadwal' },
  { icon: '📋', label: 'Riwayat Konsultasi', path: '/dokter/riwayat' },
  { icon: '🩺', label: 'Rekam Medis', path: '/dokter/rekam-medis' },
  { icon: '🗓️', label: 'Kelola Jadwal', path: '/dokter/kelola-jadwal' },
  { icon: '💬', label: 'Chat', path: '/dokter/chat' },
  { icon: '👤', label: 'Profil', path: '/dokter/profil' },
];

export default function DokterSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('dokterUser') || '{}');

  return (
    <div className="sidebar" style={{ background: 'var(--green-dark)' }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'var(--green-light)' }}>🩺</div>
        <div>
          <span style={{ fontSize: 13 }}>{user.nama || 'Dokter'}</span>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{user.spesialis || ''}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path} className={`nav-item${location.pathname === item.path ? ' active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
}
