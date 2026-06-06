import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '📅', label: 'Jadwal Hari Ini', path: '/dokter/jadwal' },
  { icon: '📋', label: 'Riwayat Konsultasi', path: '/dokter/riwayat' },
  { icon: '🩺', label: 'Rekam Medis', path: '/dokter/rekam-medis' },
  { icon: '🕐', label: 'Kelola Jadwal', path: '/dokter/kelola-jadwal' },
  { icon: '💬', label: 'Chat Admin', path: '/dokter/chat' },
  { icon: '👤', label: 'Profil Saya', path: '/dokter/profil' },
];

export default function DokterSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <aside className="sidebar" style={{ background: 'var(--green)' }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>🩺</div>
        <span>Dokter Panel</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path} className={`nav-item${pathname === item.path ? ' active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span> {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
